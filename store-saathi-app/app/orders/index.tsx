import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Switch,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";

import { getShopOrders } from "../../constants/orders.api";
import { getOnlineProfile, toggleStoreStatus } from "../../constants/onlineProfile.api";
import PageLoader from "../../components/PageLoader";
import { formatRupee } from "../../utils/formatCurrency";
import { useAudioPlayer } from "expo-audio";

const alertSound = require("../../assets/images/beep.mp3");

/* ================= ORDER STATUS CONFIG ================= */
const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; icon: string; label: string; borderColor: string }
> = {
  pending: {
    bg: "#fef3c7",
    text: "#92400e",
    icon: "time-outline",
    label: "Pending",
    borderColor: "#fbbf24",
  },
  accepted: {
    bg: "#dbeafe",
    text: "#1e40af",
    icon: "checkmark-circle-outline",
    label: "Accepted",
    borderColor: "#60a5fa",
  },
  rejected: {
    bg: "#fee2e2",
    text: "#991b1b",
    icon: "close-circle-outline",
    label: "Rejected",
    borderColor: "#f87171",
  },
  packing: {
    bg: "#e0e7ff",
    text: "#3730a3",
    icon: "cube-outline",
    label: "Packing",
    borderColor: "#818cf8",
  },
  ready: {
    bg: "#d1fae5",
    text: "#065f46",
    icon: "bag-check-outline",
    label: "Ready",
    borderColor: "#34d399",
  },
  out_for_delivery: {
    bg: "#cffafe",
    text: "#155e75",
    icon: "bicycle-outline",
    label: "Out for Delivery",
    borderColor: "#22d3ee",
  },
  delivered: {
    bg: "#dcfce7",
    text: "#166534",
    icon: "checkmark-done-circle-outline",
    label: "Delivered",
    borderColor: "#4ade80",
  },
  cancelled: {
    bg: "#f1f5f9",
    text: "#64748b",
    icon: "ban-outline",
    label: "Cancelled",
    borderColor: "#cbd5e1",
  },
};

/* ================= TABS ================= */
type TabType = "new" | "old";

/* ================= PULSE DOT COMPONENT ================= */
function PulseDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
  );
}

/* ================= TIME AGO HELPER ================= */
function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const created = new Date(dateStr);
  const diffMs = now.getTime() - created.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

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

  // 🟢 Store online/offline status
  const [isStoreOnline, setIsStoreOnline] = useState<boolean | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // 🔊 New order alert sound
  const alertPlayer = useAudioPlayer(alertSound);
  const prevOrderCountRef = useRef<number | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  // Fetch store online status
  const fetchStoreStatus = useCallback(async () => {
    try {
      const res = await getOnlineProfile();
      if (res.data?.success && res.data.profile) {
        setIsStoreOnline(res.data.profile.isStoreOnline ?? false);
      }
    } catch (e) {
      // Silently fail — toggle just won't show
    }
  }, []);

  useEffect(() => {
    fetchStoreStatus();
  }, [fetchStoreStatus]);

  const handleToggleStoreStatus = async () => {
    try {
      setTogglingStatus(true);
      const res = await toggleStoreStatus();
      if (res.data?.success) {
        setIsStoreOnline(res.data.isStoreOnline);
      }
    } catch (e) {
      console.warn("Toggle store status error:", e);
    } finally {
      setTogglingStatus(false);
    }
  };

  const playOrderAlert = useCallback(() => {
    try {
      alertPlayer.loop = true;
      alertPlayer.seekTo(0);
      alertPlayer.play();

      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);

      stopTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        try {
          alertPlayer.pause();
          alertPlayer.loop = false;
        } catch (e) {
          // Player may have been released — ignore
        }
      }, 3000);
    } catch (e) {
      console.warn("Failed to play order alert:", e);
    }
  }, [alertPlayer]);

  const fetchOrders = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (pageNum === 1 && !isRefresh) setLoading(true);
        if (pageNum > 1) setLoadingMore(true);

        const status = activeTab === "new" ? "pending" : "";
        const res = await getShopOrders({ status, page: pageNum, limit: 20 });

        if (res.data?.success) {
          let fetchedOrders = res.data.orders || [];

          if (activeTab === "old") {
            fetchedOrders = fetchedOrders.filter(
              (o: any) => o.status !== "pending"
            );
          }

          if (pageNum === 1) {
            setOrders(fetchedOrders);

            if (activeTab === "new") {
              const total = res.data.pagination?.total ?? fetchedOrders.length;
              if (
                prevOrderCountRef.current !== null &&
                total > prevOrderCountRef.current
              ) {
                playOrderAlert();
              }
              prevOrderCountRef.current = total;
            }
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
    [activeTab, playOrderAlert]
  );

  useEffect(() => {
    if (isFocused) {
      setPage(1);
      fetchOrders(1);
    }
  }, [activeTab, isFocused, fetchOrders]);

  // Auto-refresh every 2 seconds when screen is focused
  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(() => {
      fetchOrders(1, true);
    }, 2000);
    return () => clearInterval(interval);
  }, [isFocused, fetchOrders]);

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

  /* ================= ORDER CARD ================= */
  const renderOrderCard = ({ item, index }: { item: any; index: number }) => {
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
    const isPending = item.status === "pending";
    const timeAgo = getTimeAgo(item.createdAt);

    const isDineIn = item.orderType === "dineIn";
    const displayName = isDineIn
      ? `Table No. ${item.tableNumber || "?"}`
      : item.customer?.name || "Customer";
    const displayInitial = isDineIn
      ? "T"
      : (item.customer?.name || "C").charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={[
          styles.orderCard,
          isPending && styles.orderCardPending,
          { borderLeftColor: statusConf.borderColor },
        ]}
        activeOpacity={0.65}
        onPress={() => router.push(`/orders/${item._id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Order from ${displayName}, ${statusConf.label}, ${formatRupee(item.totalAmount)}`}
      >
        {/* Urgent indicator for pending orders */}
        {isPending && (
          <View style={styles.urgentBanner}>
            <PulseDot />
            <Text style={styles.urgentText}>Action Required</Text>
            <Text style={styles.timeAgoText}>{timeAgo}</Text>
          </View>
        )}

        {/* Order Type Tag */}
        <View style={styles.orderTypeRow}>
          <View
            style={[
              styles.orderTypeBadge,
              isDineIn ? styles.orderTypeDineIn : styles.orderTypeDelivery,
            ]}
          >
            <Ionicons
              name={isDineIn ? "restaurant-outline" : "bicycle-outline"}
              size={12}
              color={isDineIn ? "#7c2d12" : "#1e40af"}
            />
            <Text
              style={[
                styles.orderTypeText,
                isDineIn ? styles.orderTypeDineInText : styles.orderTypeDeliveryText,
              ]}
            >
              {isDineIn ? "Dine-In" : "Delivery"}
            </Text>
          </View>
        </View>

        {/* Top Row: Customer + Status */}
        <View style={styles.cardTopRow}>
          <View style={styles.customerInfo}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: isDineIn ? "#fff7ed" : statusConf.bg },
              ]}
            >
              <Text style={[styles.avatarText, { color: isDineIn ? "#c2410c" : statusConf.text }]}>
                {displayInitial}
              </Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName} numberOfLines={1}>
                {displayName}
              </Text>
              {!isDineIn && item.customer?.phone ? (
                <Text style={styles.customerPhone}>
                  {item.customer.phone}
                </Text>
              ) : null}
            </View>
          </View>

          <View
            style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}
          >
            <Ionicons
              name={statusConf.icon as any}
              size={13}
              color={statusConf.text}
            />
            <Text style={[styles.statusText, { color: statusConf.text }]}>
              {statusConf.label}
            </Text>
          </View>
        </View>

        {/* Items Summary */}
        <View style={styles.itemsSummary}>
          <MaterialCommunityIcons
            name="package-variant"
            size={15}
            color="#64748b"
          />
          <Text style={styles.itemsText} numberOfLines={1}>
            {item.items?.length || 0} item
            {(item.items?.length || 0) !== 1 ? "s" : ""} •{" "}
            {item.items
              ?.slice(0, 2)
              .map((i: any) => i.productName)
              .join(", ")}
            {(item.items?.length || 0) > 2
              ? ` +${item.items.length - 2} more`
              : ""}
          </Text>
        </View>

        {/* Bottom Row: Amount + Time + Payment */}
        <View style={styles.cardBottomRow}>
          <View style={styles.amountContainer}>
            <Text style={styles.orderAmount}>
              {formatRupee(item.totalAmount)}
            </Text>
            <View style={styles.paymentBadge}>
              <Ionicons
                name={
                  item.paymentMethod === "COD"
                    ? "cash-outline"
                    : "card-outline"
                }
                size={11}
                color="#475569"
              />
              <Text style={styles.paymentText}>
                {item.paymentMethod || "COD"}
              </Text>
            </View>
          </View>

          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={12} color="#94a3b8" />
            <Text style={styles.timeText}>
              {dateStr} • {timeStr}
            </Text>
          </View>
        </View>

        {/* Swipe hint for pending orders */}
        {isPending && (
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>Tap to accept or reject</Text>
            <Ionicons name="chevron-forward" size={14} color="#92400e" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /* ================= HEADER SUMMARY ================= */
  const renderListHeader = () => {
    if (activeTab !== "new" || orders.length === 0) return null;

    return (
      <View style={styles.summaryBanner}>
        <MaterialCommunityIcons
          name="bell-ring-outline"
          size={18}
          color="#1e40af"
        />
        <Text style={styles.summaryText}>
          {orders.length} order{orders.length !== 1 ? "s" : ""} waiting for your
          action
        </Text>
      </View>
    );
  };

  if (loading) return <PageLoader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Online Orders</Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === "new" ? "Manage incoming orders" : "Order history"}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.push("/online-profile")}
            accessibilityLabel="Store profile"
            accessibilityRole="button"
          >
            <Ionicons name="storefront-outline" size={20} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={onRefresh}
            accessibilityLabel="Refresh orders"
            accessibilityRole="button"
          >
            <Ionicons name="refresh" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      {/* STORE ONLINE/OFFLINE TOGGLE */}
      {isStoreOnline !== null && (
        <View style={styles.storeStatusBar}>
          <View style={styles.storeStatusLeft}>
            <View
              style={[
                styles.storeStatusDot,
                { backgroundColor: isStoreOnline ? "#22c55e" : "#ef4444" },
              ]}
            />
            <View>
              <Text style={styles.storeStatusTitle}>
                Store is {isStoreOnline ? "Online" : "Offline"}
              </Text>
              <Text style={styles.storeStatusSub}>
                {isStoreOnline ? "Accepting orders" : "Orders paused"}
              </Text>
            </View>
          </View>
          <Switch
            value={isStoreOnline}
            onValueChange={handleToggleStoreStatus}
            trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }}
            thumbColor={isStoreOnline ? "#16a34a" : "#94a3b8"}
            disabled={togglingStatus}
          />
        </View>
      )}

      {/* TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "new" && styles.tabActive]}
          onPress={() => setActiveTab("new")}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "new" }}
        >
          <Ionicons
            name="notifications-outline"
            size={17}
            color={activeTab === "new" ? "#fff" : "#64748b"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "new" && styles.tabTextActive,
            ]}
          >
            New
          </Text>
          {orders.length > 0 && activeTab === "new" && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{orders.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "old" && styles.tabActive]}
          onPress={() => setActiveTab("old")}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "old" }}
        >
          <Ionicons
            name="archive-outline"
            size={17}
            color={activeTab === "old" ? "#fff" : "#64748b"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "old" && styles.tabTextActive,
            ]}
          >
            Past Orders
          </Text>
        </TouchableOpacity>
      </View>

      {/* ORDER LIST */}
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrderCard}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 40 },
          orders.length === 0 && styles.listContentEmpty,
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
                name={
                  activeTab === "new"
                    ? "bell-off-outline"
                    : "package-variant-closed"
                }
                size={48}
                color="#94a3b8"
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === "new" ? "No New Orders" : "No Past Orders"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === "new"
                ? "When customers place orders, they'll appear here instantly"
                : "Accepted, delivered & other orders will show here"}
            </Text>
            <TouchableOpacity style={styles.emptyRefreshBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={16} color="#2563eb" />
              <Text style={styles.emptyRefreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#1e3a8a" />
              <Text style={styles.loadingMoreText}>Loading more orders...</Text>
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
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  headerTitle: {
    fontWeight: "800",
    fontSize: 19,
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 1,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
  },

  /* STORE STATUS BAR */
  storeStatusBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  storeStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  storeStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  storeStatusTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  storeStatusSub: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 1,
  },

  /* TABS */
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 11,
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#1e3a8a",
    elevation: 4,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 2,
  },
  countText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },

  /* SUMMARY BANNER */
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  summaryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e40af",
    flex: 1,
  },

  /* LIST */
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  listContentEmpty: {
    justifyContent: "center",
  },

  /* ORDER CARD */
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#e2e8f0",
  },
  orderCardPending: {
    backgroundColor: "#fffbeb",
    borderLeftColor: "#f59e0b",
    shadowColor: "#f59e0b",
    shadowOpacity: 0.08,
  },

  /* URGENT BANNER */
  urgentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#fef3c7",
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f59e0b",
  },
  urgentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#92400e",
    flex: 1,
  },
  timeAgoText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#b45309",
  },

  /* TOP ROW */
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    letterSpacing: -0.2,
  },
  customerPhone: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  /* ITEMS */
  itemsSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
  },
  itemsText: {
    fontSize: 13,
    color: "#475569",
    flex: 1,
    fontWeight: "500",
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
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },

  /* PAYMENT */
  paymentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paymentText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },

  /* ORDER TYPE BADGE */
  orderTypeRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  orderTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderTypeDineIn: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  orderTypeDelivery: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  orderTypeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  orderTypeDineInText: {
    color: "#7c2d12",
  },
  orderTypeDeliveryText: {
    color: "#1e40af",
  },

  /* TAP HINT */
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#fef3c7",
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400e",
  },

  /* EMPTY STATE */
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyRefreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  emptyRefreshText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
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
