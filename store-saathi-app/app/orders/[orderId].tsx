import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Share,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getShopOrderById,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
  createBillFromOrder,
} from "../../constants/orders.api";
import PageLoader from "../../components/PageLoader";
import { formatRupee } from "../../utils/formatCurrency";
import { printKOT, printOrderBill } from "../../utils/thermalPrinter";

/* ================= STATUS CONFIG ================= */
const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string; label: string; gradient: string }> = {
  pending: { bg: "#fef3c7", text: "#92400e", icon: "time-outline", label: "Pending", gradient: "#fbbf24" },
  accepted: { bg: "#dbeafe", text: "#1e40af", icon: "checkmark-circle-outline", label: "Accepted", gradient: "#3b82f6" },
  rejected: { bg: "#fee2e2", text: "#991b1b", icon: "close-circle-outline", label: "Rejected", gradient: "#ef4444" },
  packing: { bg: "#e0e7ff", text: "#3730a3", icon: "cube-outline", label: "Packing", gradient: "#6366f1" },
  ready: { bg: "#d1fae5", text: "#065f46", icon: "bag-check-outline", label: "Ready", gradient: "#10b981" },
  out_for_delivery: { bg: "#cffafe", text: "#155e75", icon: "bicycle-outline", label: "Out for Delivery", gradient: "#06b6d4" },
  delivered: { bg: "#dcfce7", text: "#166534", icon: "checkmark-done-circle-outline", label: "Delivered", gradient: "#22c55e" },
  cancelled: { bg: "#f1f5f9", text: "#64748b", icon: "ban-outline", label: "Cancelled", gradient: "#94a3b8" },
};

/* ================= STATUS FLOW ================= */
const NEXT_STATUS: Record<string, string> = {
  accepted: "packing",
  packing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "delivered",
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  accepted: "Start Packing",
  packing: "Mark as Ready",
  ready: "Out for Delivery",
  out_for_delivery: "Mark Delivered",
};

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await getShopOrderById(orderId!);
      if (res.data?.success) {
        setOrder(res.data.order);
      }
    } catch (error) {
      console.error("Fetch Order Error:", error);
      Alert.alert("Error", "Failed to fetch order details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleAccept = () => {
    Alert.alert("Accept Order", "Are you sure you want to accept this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Accept",
        style: "default",
        onPress: async () => {
          try {
            setActionLoading(true);
            await acceptOrder(orderId!);
            await fetchOrder();
            try {
              await printKOT(order);
            } catch (printError) {
              console.warn("KOT print failed:", printError);
            }
          } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to accept order");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert(
      "Reject Order",
      "Are you sure you want to reject this order? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await rejectOrder(orderId!);
              await fetchOrder();
            } catch (error: any) {
              Alert.alert("Error", error?.response?.data?.message || "Failed to reject order");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleNextStatus = () => {
    if (!order) return;
    const isDineInOrder = order.orderType === "dineIn";
    const nextSt = isDineInOrder
      ? (order.status === "accepted" ? "packing" : order.status === "packing" ? "ready" : order.status === "ready" ? "delivered" : undefined)
      : NEXT_STATUS[order.status];
    if (!nextSt) return;

    const DINE_IN_LABELS: Record<string, string> = {
      accepted: "Start Packing",
      packing: "Mark as Ready",
      ready: "Mark Delivered",
    };

    const label = isDineInOrder
      ? (DINE_IN_LABELS[order.status] || `Move to ${nextSt}`)
      : (NEXT_STATUS_LABEL[order.status] || `Move to ${nextSt}`);

    Alert.alert("Update Status", `${label}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            setActionLoading(true);
            await updateOrderStatus(orderId!, nextSt);
            await fetchOrder();
          } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Failed to update status");
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) return <PageLoader />;

  if (!order) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.emptyStateIcon}>
          <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
        </View>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color="#fff" />
          <Text style={styles.goBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const createdAt = new Date(order.createdAt);
  const isDineIn = order.orderType === "dineIn";
  const nextStatus = isDineIn
    ? (order.status === "accepted" ? "packing" : order.status === "packing" ? "ready" : order.status === "ready" ? "delivered" : undefined)
    : NEXT_STATUS[order.status];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerOrderId}>#{orderId?.slice(-6).toUpperCase()}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => { setRefreshing(true); fetchOrder(); }}
        >
          <Ionicons name="refresh" size={20} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrder(); }}
            tintColor="#1e3a8a"
            colors={["#1e3a8a"]}
          />
        }
      >
        {/* STATUS BANNER */}
        <View style={[styles.statusBanner, { backgroundColor: statusConf.bg }]}>
          <View style={[styles.statusIconCircle, { backgroundColor: statusConf.text + "20" }]}>
            <Ionicons name={statusConf.icon as any} size={22} color={statusConf.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: statusConf.text }]}>
              {statusConf.label}
            </Text>
            <Text style={[styles.statusSub, { color: statusConf.text }]}>
              {createdAt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}•{" "}
              {createdAt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          </View>
          <View style={styles.statusAmountContainer}>
            <Text style={[styles.statusAmountLabel, { color: statusConf.text }]}>Total</Text>
            <Text style={[styles.statusAmount, { color: statusConf.text }]}>
              {formatRupee(order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* ORDER TYPE TAG */}
        <View style={styles.orderTypeTagRow}>
          <View
            style={[
              styles.orderTypeTag,
              isDineIn ? styles.orderTypeTagDineIn : styles.orderTypeTagDelivery,
            ]}
          >
            <Ionicons
              name={isDineIn ? "restaurant-outline" : "bicycle-outline"}
              size={14}
              color={isDineIn ? "#7c2d12" : "#1e40af"}
            />
            <Text
              style={[
                styles.orderTypeTagText,
                isDineIn ? styles.orderTypeTagDineInText : styles.orderTypeTagDeliveryText,
              ]}
            >
              {isDineIn ? "Dine-In" : "Delivery"}
            </Text>
          </View>
          {isDineIn && order.tableNumber ? (
            <View style={styles.tableNumberTag}>
              <MaterialCommunityIcons name="table-furniture" size={14} color="#4338ca" />
              <Text style={styles.tableNumberTagText}>Table {order.tableNumber}</Text>
            </View>
          ) : null}
        </View>

        {/* QUICK ACTIONS — Print Bill & Print KOT at the top */}
        {order.status !== "pending" && order.status !== "rejected" && order.status !== "cancelled" && (
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionPrintBill}
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  if (!order.bill) {
                    setActionLoading(true);
                    const paymentMode = order.paymentMethod === "online" ? "UPI" : "CASH";
                    const paidAmount = order.paymentMethod === "online" ? order.totalAmount : 0;
                    await createBillFromOrder(orderId!, { paymentMode, paidAmount });
                    await fetchOrder();
                  }
                  await printOrderBill(order);
                } catch (e: any) {
                  const msg = e?.response?.data?.message || "Bill print error";
                  console.warn("Bill print error:", e);
                  Alert.alert("Error", msg);
                } finally {
                  setActionLoading(false);
                }
              }}
            >
              <View style={styles.quickActionIconBg}>
                <Ionicons name="print" size={18} color="#fff" />
              </View>
              <Text style={styles.quickActionPrintBillText}>Print Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionPrintKot}
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  await printKOT(order);
                } catch (e) {
                  console.warn("KOT print error:", e);
                }
              }}
            >
              <View style={styles.quickActionKotIconBg}>
                <MaterialCommunityIcons name="printer" size={18} color="#1e3a8a" />
              </View>
              <Text style={styles.quickActionPrintKotText}>Print KOT</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CUSTOMER INFO */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Ionicons name={isDineIn ? "restaurant" : "person"} size={14} color="#1e3a8a" />
            </View>
            <Text style={styles.sectionTitle}>{isDineIn ? "Dine-In" : "Customer"}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.customerRow}>
              <View style={[styles.customerAvatar, isDineIn && { backgroundColor: "#c2410c" }]}>
                <Text style={styles.customerAvatarText}>
                  {isDineIn ? "T" : (order.customer?.name || "C")[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>
                  {isDineIn
                    ? `Table No. ${order.tableNumber || "?"}`
                    : order.customer?.name || "N/A"}
                </Text>
                {!isDineIn && (
                  <Text style={styles.customerPhone}>
                    {order.customer?.phone || "N/A"}
                  </Text>
                )}
              </View>
              {!isDineIn && order.customer?.phone ? (
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => {
                    const phone = order.customer.phone.replace(/[^0-9+]/g, "");
                    Linking.openURL(`tel:${phone}`);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={16} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* DELIVERY ADDRESS */}
        {order.address && !isDineIn && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: "#fef2f2" }]}>
                <Ionicons name="location" size={14} color="#ef4444" />
              </View>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <View style={styles.card}>
              <View style={styles.addressContent}>
                {order.address.label ? (
                  <View style={styles.addressLabelBadge}>
                    <Text style={styles.addressLabelText}>{order.address.label}</Text>
                  </View>
                ) : null}
                <Text style={styles.addressText}>
                  {[
                    order.address.houseNumber,
                    order.address.fullAddress,
                    order.address.landmark,
                    order.address.city,
                    order.address.pincode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
              </View>

              <View style={styles.addressDivider} />
              <View style={styles.addressActions}>
                <TouchableOpacity
                  style={styles.viewOnMapButton}
                  activeOpacity={0.7}
                  onPress={async () => {
                    let lat = order.address?.latitude;
                    let lng = order.address?.longitude;
                    if ((!lat || !lng) && order.customer?.addresses?.length > 0) {
                      const defaultAddr = order.customer.addresses.find(
                        (a: any) => a.isDefault
                      ) || order.customer.addresses[0];
                      lat = defaultAddr?.latitude;
                      lng = defaultAddr?.longitude;
                    }
                    if (lat && lng) {
                      Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}`);
                    } else {
                      Alert.alert("No Location", "No coordinates available for this address");
                    }
                  }}
                >
                  <Ionicons name="map-outline" size={16} color="#2563eb" />
                  <Text style={styles.viewOnMapText}>Map</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareButton}
                  activeOpacity={0.7}
                  onPress={async () => {
                    let lat = order.address?.latitude;
                    let lng = order.address?.longitude;
                    if ((!lat || !lng) && order.customer?.addresses?.length > 0) {
                      const defaultAddr = order.customer.addresses.find(
                        (a: any) => a.isDefault
                      ) || order.customer.addresses[0];
                      lat = defaultAddr?.latitude;
                      lng = defaultAddr?.longitude;
                    }
                    const addressText = [
                      order.address.houseNumber,
                      order.address.fullAddress,
                      order.address.landmark,
                      order.address.city,
                      order.address.pincode,
                    ].filter(Boolean).join(", ");
                    const mapsLink = lat && lng
                      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
                    const customerName = order.customer?.name || "Customer";
                    const customerPhone = order.customer?.phone || "";
                    const formattedPhone = customerPhone.startsWith("+") ? customerPhone : `+91${customerPhone.replace(/^0+/, "")}`;
                    const message = `📦 *Delivery Details*\n\n👤 *Customer:* ${customerName}\n📞 *Phone:* ${formattedPhone}\n\n📍 *Address:*\n${addressText}\n\n🗺️ *Google Maps:*\n${mapsLink}`;
                    await Share.share({
                      message,
                    });
                  }}
                >
                  <MaterialCommunityIcons name="whatsapp" size={18} color="#fff" />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ORDER ITEMS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: "#f0fdf4" }]}>
              <MaterialCommunityIcons name="package-variant" size={14} color="#16a34a" />
            </View>
            <Text style={styles.sectionTitle}>Items</Text>
            <View style={styles.itemCountBadge}>
              <Text style={styles.itemCountText}>{order.items?.length || 0}</Text>
            </View>
          </View>
          <View style={styles.card}>
            {order.items?.map((item: any, index: number) => (
              <View key={index}>
                {index > 0 && <View style={styles.itemDivider} />}
                <View style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                    </View>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.productName}
                    </Text>
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemPrice}>
                      {formatRupee(item.subtotal)}
                    </Text>
                    <Text style={styles.itemUnitPrice}>
                      @ {formatRupee(item.price)} each
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                {formatRupee(order.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* PAYMENT & NOTES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="wallet" size={14} color="#16a34a" />
            </View>
            <Text style={styles.sectionTitle}>Payment & Notes</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.paymentRow}>
              <View style={styles.paymentMethodBadge}>
                <Ionicons
                  name={order.paymentMethod === "COD" ? "cash-outline" : "card-outline"}
                  size={16}
                  color="#16a34a"
                />
                <Text style={styles.paymentMethodText}>
                  {order.paymentMethod || "COD"}
                </Text>
              </View>
              <View style={[
                styles.paymentStatusBadge,
                { backgroundColor: order.paymentMethod === "online" ? "#dcfce7" : "#fef3c7" }
              ]}>
                <Text style={[
                  styles.paymentStatusText,
                  { color: order.paymentMethod === "online" ? "#166534" : "#92400e" }
                ]}>
                  {order.paymentMethod === "online" ? "Paid" : "Pay on Delivery"}
                </Text>
              </View>
            </View>
            {order.notes ? (
              <>
                <View style={styles.notesDivider} />
                <View style={styles.notesContainer}>
                  <MaterialCommunityIcons name="note-text-outline" size={16} color="#f59e0b" />
                  <Text style={styles.notesText}>{order.notes}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      {actionLoading ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <ActivityIndicator size="large" color="#1e3a8a" />
        </View>
      ) : order.status === "pending" ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={handleReject}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={20} color="#dc2626" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.acceptButtonText}>Accept Order</Text>
          </TouchableOpacity>
        </View>
      ) : nextStatus ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.nextStatusButton}
            onPress={handleNextStatus}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-right-circle" size={22} color="#fff" />
            <Text style={styles.nextStatusButtonText}>
              {isDineIn
                ? (order.status === "accepted" ? "Start Packing" : order.status === "packing" ? "Mark as Ready" : order.status === "ready" ? "Mark Delivered" : "Next Step")
                : (NEXT_STATUS_LABEL[order.status] || "Next Step")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  goBackBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#1e3a8a",
    borderRadius: 12,
  },
  goBackBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    padding: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "800",
    fontSize: 17,
    color: "#0f172a",
  },
  headerOrderId: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 2,
  },
  refreshButton: {
    padding: 10,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
  },

  /* STATUS BANNER */
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  statusIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  statusSub: {
    fontSize: 12,
    marginTop: 3,
    opacity: 0.8,
    fontWeight: "500",
  },
  statusAmountContainer: {
    alignItems: "flex-end",
  },
  statusAmountLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    opacity: 0.7,
  },
  statusAmount: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },

  /* ORDER TYPE TAG */
  orderTypeTagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  orderTypeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderTypeTagDineIn: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  orderTypeTagDelivery: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  orderTypeTagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  orderTypeTagDineInText: {
    color: "#7c2d12",
  },
  orderTypeTagDeliveryText: {
    color: "#1e40af",
  },
  tableNumberTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  tableNumberTagText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4338ca",
  },

  /* QUICK ACTIONS */
  quickActionsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  quickActionPrintBill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#1e3a8a",
    gap: 8,
    elevation: 4,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  quickActionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionPrintBillText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  quickActionPrintKot: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
    gap: 8,
  },
  quickActionKotIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionPrintKotText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e3a8a",
  },

  /* SECTIONS */
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  sectionIconBg: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  /* CUSTOMER */
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#1e3a8a",
    alignItems: "center",
    justifyContent: "center",
  },
  customerAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  customerPhone: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 2,
    fontWeight: "500",
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  /* ADDRESS */
  addressContent: {
    gap: 6,
  },
  addressLabelBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  addressLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  addressText: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
    lineHeight: 20,
  },
  addressDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 14,
  },
  addressActions: {
    flexDirection: "row",
    gap: 10,
  },
  viewOnMapButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    gap: 6,
  },
  viewOnMapText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#25D366",
    gap: 6,
    elevation: 2,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  /* ITEMS */
  itemCountBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1e3a8a",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  qtyBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1e3a8a",
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },
  itemRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  itemUnitPrice: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  itemDivider: {
    height: 1,
    backgroundColor: "#f8fafc",
    marginVertical: 2,
  },
  totalDivider: {
    height: 1.5,
    backgroundColor: "#e2e8f0",
    marginVertical: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1e3a8a",
  },

  /* PAYMENT */
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paymentMethodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  notesDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 10,
  },
  notesText: {
    fontSize: 13,
    color: "#78350f",
    fontWeight: "500",
    flex: 1,
    lineHeight: 18,
  },

  /* BOTTOM ACTION BAR */
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#fef2f2",
    borderWidth: 1.5,
    borderColor: "#fecaca",
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#dc2626",
  },
  acceptButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#16a34a",
    gap: 8,
    elevation: 4,
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  nextStatusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#1e3a8a",
    gap: 10,
    elevation: 4,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  nextStatusButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
});
