import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";

import { getShopOrders } from "../../constants/orders.api";
import PageLoader from "../../components/PageLoader";
import { formatRupee } from "../../utils/formatCurrency";

const { width } = Dimensions.get("window");

/* ================= ORDER STATUS CONFIG ================= */
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

/* ================= TABS ================= */
type TabType = "new" | "old";

export default function OnlineOrdersScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [activeTab, setActiveTab] = useState<TabType>("new");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchOrders = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (pageNum === 1 && !isRefresh) setLoading(true);
        if (pageNum > 1) setLoadingMore(true);

        // "new" = pending orders, "old" = all other statuses
        const status = activeTab === "new" ? "pending" : "";

        const res = await getShopOrders({ status, page: pageNum, limit: 20 });

        if (res.data?.success) {
          let fetchedOrders = res.data.orders || [];

          // For "old" tab, filter out pending orders
          if (activeTab === "old") {
            fetchedOrders = fetchedOrders.filter(
              (o: any) => o.status !== "pending"
            );
          }

          if (pageNum === 1) {
            setOrders(fetchedOrders);
          } else {
            setOrders((prev) => [...prev, ...fetchedOrders]);
          }

          setTotalPages(res.data.pagination?.totalPages || 1);
          setPage(pageNum);
        }
      } catch (error) {
        console.error("Fetch Orders Error:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    if (isFocused) {
      setPage(1);
      fetchOrders(1);
    }
  }, [activeTab, isFocused, fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchOrders(1, true);
  };

  const loadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchOrders(page + 1);
    }
  };

  const renderOrderCard = ({ item }: { item: any }) => {
    const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const createdAt = new Date(item.createdAt);
    const timeStr = createdAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const dateStr = createdAt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() => router.push(`/orders/${item._id}`)}
      >
        {/* Top Row: Customer + Status */}
        <View style={styles.cardTopRow}>
          <View style={styles.customerInfo}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={18} color="#1e3a8a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName} numberOfLines={1}>
                {item.customer?.name || "Customer"}
              </Text>
              <Text style={styles.customerPhone}>
                {item.customer?.phone || ""}
              </Text>
            </View>

          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
            <Ionicons name={statusConf.icon as any} size={12} color={statusConf.text} />
            <Text style={[styles.statusText, { color: statusConf.text }]}>
              {statusConf.label}
            </Text>
          </View>
        </View>

        {/* Items Summary */}
        <View style={styles.itemsSummary}>
          <MaterialCommunityIcons name="package-variant" size={16} color="#64748b" />
          <Text style={styles.itemsText} numberOfLines={1}>
            {item.items?.length || 0} item{(item.items?.length || 0) !== 1 ? "s" : ""} •{" "}
            {item.items
              ?.slice(0, 2)
              .map((i: any) => i.productName)
              .join(", ")}
            {(item.items?.length || 0) > 2 ? ` +${item.items.length - 2} more` : ""}
          </Text>
        </View>

        {/* Bottom Row: Amount + Time */}
        <View style={styles.cardBottomRow}>
          <Text style={styles.orderAmount}>{formatRupee(item.totalAmount)}</Text>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={12} color="#94a3b8" />
            <Text style={styles.timeText}>
              {dateStr} • {timeStr}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentRow}>
          <View style={styles.paymentBadge}>
            <Ionicons
              name={item.paymentMethod === "COD" ? "cash-outline" : "card-outline"}
              size={12}
              color="#475569"
            />
            <Text style={styles.paymentText}>{item.paymentMethod || "COD"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <PageLoader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Online Orders</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.push("/online-profile")}
          >
            <Ionicons name="storefront-outline" size={20} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "new" && styles.tabActive]}
          onPress={() => setActiveTab("new")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="notifications-outline"
            size={18}
            color={activeTab === "new" ? "#fff" : "#64748b"}
          />
          <Text style={[styles.tabText, activeTab === "new" && styles.tabTextActive]}>
            New Orders
          </Text>
          {activeTab === "new" && orders.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{orders.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "old" && styles.tabActive]}
          onPress={() => setActiveTab("old")}
          activeOpacity={0.7}
        >
          <Ionicons
            name="archive-outline"
            size={18}
            color={activeTab === "old" ? "#fff" : "#64748b"}
          />
          <Text style={[styles.tabText, activeTab === "old" && styles.tabTextActive]}>
            Past Orders
          </Text>
        </TouchableOpacity>
      </View>

      {/* ORDER LIST */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrderCard}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1e3a8a"
            colors={["#1e3a8a"]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons
                name={activeTab === "new" ? "bell-off-outline" : "package-variant"}
                size={44}
                color="#cbd5e1"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === "new" ? "No New Orders" : "No Past Orders"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "new"
                ? "New orders from customers will appear here"
                : "Accepted, delivered & other orders will show here"}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#1e3a8a" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#f0f7ff",
  },

  /* TABS */
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#1e3a8a",
    elevation: 3,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  tabTextActive: {
    color: "#fff",
  },
  countBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  countText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  /* LIST */
  listContent: {
    padding: 16,
    flexGrow: 1,
  },

  /* ORDER CARD */
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  customerPhone: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 1,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  /* ITEMS */
  itemsSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  itemsText: {
    fontSize: 13,
    color: "#64748b",
    flex: 1,
  },

  /* BOTTOM ROW */
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },

  /* PAYMENT */
  paymentRow: {
    marginTop: 8,
  },
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  paymentText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },

  /* EMPTY STATE */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#475569",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },

  /* LOADING MORE */
  loadingMore: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
});
