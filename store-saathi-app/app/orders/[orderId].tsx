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
const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  pending: { bg: "#fef3c7", text: "#92400e", icon: "time-outline", label: "Pending" },
  accepted: { bg: "#dbeafe", text: "#1e40af", icon: "checkmark-circle-outline", label: "Accepted" },
  rejected: { bg: "#fee2e2", text: "#991b1b", icon: "close-circle-outline", label: "Rejected" },
  packing: { bg: "#e0e7ff", text: "#3730a3", icon: "cube-outline", label: "Packing" },
  ready: { bg: "#d1fae5", text: "#065f46", icon: "bag-check-outline", label: "Ready" },
  out_for_delivery: { bg: "#cffafe", text: "#155e75", icon: "bicycle-outline", label: "Out for Delivery" },
  delivered: { bg: "#dcfce7", text: "#166534", icon: "checkmark-done-circle-outline", label: "Delivered" },
  cancelled: { bg: "#f1f5f9", text: "#64748b", icon: "ban-outline", label: "Cancelled" },
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
            // Print KOT after accepting the order
            try {
              await printKOT(order);
            } catch (printError) {
              console.warn("KOT print failed:", printError);
            }
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.response?.data?.message || "Failed to accept order"
            );
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
              Alert.alert(
                "Error",
                error?.response?.data?.message || "Failed to reject order"
              );
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
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    const label = NEXT_STATUS_LABEL[order.status] || `Move to ${nextStatus}`;

    Alert.alert("Update Status", `${label}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            setActionLoading(true);
            await updateOrderStatus(orderId!, nextStatus);
            await fetchOrder();
          } catch (error: any) {
            Alert.alert(
              "Error",
              error?.response?.data?.message || "Failed to update status"
            );
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
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const createdAt = new Date(order.createdAt);
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOrder();
            }}
            tintColor="#1e3a8a"
            colors={["#1e3a8a"]}
          />
        }
      >
        {/* STATUS BANNER */}
        <View style={[styles.statusBanner, { backgroundColor: statusConf.bg }]}>
          <Ionicons name={statusConf.icon as any} size={24} color={statusConf.text} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: statusConf.text }]}>
              {statusConf.label}
            </Text>
            <Text style={[styles.statusSub, { color: statusConf.text }]}>
              {createdAt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              •{" "}
              {createdAt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </Text>
          </View>
          <Text style={[styles.statusAmount, { color: statusConf.text }]}>
            {formatRupee(order.totalAmount)}
          </Text>
        </View>

        {/* CUSTOMER INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="person" size={18} color="#1e3a8a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>
                  {order.customer?.name || "N/A"}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call" size={18} color="#1e3a8a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>
                  {order.customer?.phone || "N/A"}
                </Text>
              </View>
              {order.customer?.phone ? (
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => Linking.openURL(`tel:${order.customer.phone}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* DELIVERY ADDRESS */}
        {order.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="location" size={18} color="#ef4444" />
                </View>
                <View style={{ flex: 1 }}>
                  {order.address.label ? (
                    <Text style={styles.infoLabel}>{order.address.label}</Text>
                  ) : null}
                  <Text style={styles.infoValue}>
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
              </View>

              {/* BOOK DELIVERY BUTTON */}
              <View style={styles.divider} />
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
                      // Opens Google Maps with a pin at the location (no navigation)
                      const url = `geo:${lat},${lng}?q=${lat},${lng}`;
                      Linking.openURL(url);
                    } else {
                      Alert.alert("No Location", "No coordinates available for this address");
                    }
                  }}
                >
                  <Ionicons name="map-outline" size={18} color="#2563eb" />
                  <Text style={styles.viewOnMapText}>View on Map</Text>
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
                    ]
                      .filter(Boolean)
                      .join(", ");

                    const mapsLink = lat && lng
                      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;

                    const customerName = order.customer?.name || "Customer";
                    const customerPhone = order.customer?.phone || "N/A";

                    const message = `� *Delivery Details*\n\n👤 *Customer:* ${customerName}\n📞 *Phone:* ${customerPhone}\n\n📍 *Address:*\n${addressText}\n\n🗺️ *Google Maps:*\n${mapsLink}`;

                    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
                    const canOpen = await Linking.canOpenURL(whatsappUrl);
                    if (canOpen) {
                      Linking.openURL(whatsappUrl);
                    } else {
                      Alert.alert("WhatsApp not found", "Please install WhatsApp to share");
                    }
                  }}
                >
                  <MaterialCommunityIcons name="whatsapp" size={20} color="#fff" />
                  <Text style={styles.shareButtonText}>Share to Partner</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ORDER ITEMS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Items ({order.items?.length || 0})
          </Text>
          <View style={styles.card}>
            {order.items?.map((item: any, index: number) => (
              <View key={index}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyText}>{item.quantity}x</Text>
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
                      @ {formatRupee(item.price)}/pc
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* TOTAL */}
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
          <Text style={styles.sectionTitle}>Payment & Notes</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="wallet" size={18} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Payment Method</Text>
                <Text style={styles.infoValue}>
                  {order.paymentMethod || "COD"}
                </Text>
              </View>
            </View>
            {order.notes ? (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <MaterialCommunityIcons
                      name="note-text"
                      size={18}
                      color="#f59e0b"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Customer Note</Text>
                    <Text style={styles.infoValue}>{order.notes}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* PRINT ACTIONS — visible for accepted/non-cancelled orders */}
        {order.status !== "pending" && order.status !== "rejected" && order.status !== "cancelled" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Print</Text>
            <View style={styles.printActions}>
              <TouchableOpacity
                style={styles.printKotButton}
                activeOpacity={0.8}
                onPress={async () => {
                  try {
                    await printKOT(order);
                  } catch (e) {
                    console.warn("KOT print error:", e);
                  }
                }}
              >
                <MaterialCommunityIcons name="printer" size={20} color="#1e3a8a" />
                <Text style={styles.printKotButtonText}>Print KOT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.printBillButton}
                activeOpacity={0.8}
                onPress={async () => {
                  try {
                    // Create a bill record (for analytics) if not already created
                    if (!order.bill) {
                      const paymentMode = order.paymentMethod === "online" ? "UPI" : "CASH";
                      const paidAmount = order.paymentMethod === "online" ? order.totalAmount : 0;
                      await createBillFromOrder(orderId!, {
                        paymentMode,
                        paidAmount,
                      });
                      // Refresh order to get updated bill reference
                      await fetchOrder();
                    }
                    await printOrderBill(order);
                  } catch (e: any) {
                    const msg = e?.response?.data?.message || "Bill print error";
                    console.warn("Bill print error:", e);
                    Alert.alert("Error", msg);
                  }
                }}
              >
                <MaterialCommunityIcons name="receipt" size={20} color="#fff" />
                <Text style={styles.printBillButtonText}>Print Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
            <Ionicons name="close" size={20} color="#dc2626" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.acceptButtonText}>Accept</Text>
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
              {NEXT_STATUS_LABEL[order.status] || "Next Step"}
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
    backgroundColor: "#f8fafc",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  goBackBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#1e3a8a",
    borderRadius: 12,
  },
  goBackBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    padding: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  headerTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: "#0f172a",
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
  statusLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  statusSub: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  statusAmount: {
    fontSize: 20,
    fontWeight: "900",
  },

  /* SECTIONS */
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  /* INFO ROWS */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },

  /* ITEMS */
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  qtyBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: "center",
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "800",
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
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  itemUnitPrice: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  totalDivider: {
    height: 2,
    backgroundColor: "#e2e8f0",
    marginVertical: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1e3a8a",
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
    borderTopColor: "#f1f5f9",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
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
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 16,
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
  },
  acceptButtonText: {
    fontSize: 16,
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
  },
  nextStatusButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },

  /* BOOK DELIVERY */
  addressActions: {
    flexDirection: "row",
    gap: 10,
  },
  viewOnMapButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    gap: 6,
  },
  viewOnMapText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#2563eb",
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#25D366",
    gap: 8,
  },
  shareButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    gap: 6,
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  /* PRINT ACTIONS */
  printActions: {
    flexDirection: "row",
    gap: 12,
  },
  printKotButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    gap: 8,
  },
  printKotButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e3a8a",
  },
  printBillButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#1e3a8a",
    gap: 8,
  },
  printBillButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
});
