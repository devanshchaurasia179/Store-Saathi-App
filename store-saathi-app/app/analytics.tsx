import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  FlatList,
  SafeAreaView,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Corrected relative paths based on your file structure
import { useAnalytics } from "../hooks/useAnalytics";
import { formatRupee } from "../utils/formatCurrency";
import ViewBillModal from "../components/bills/ViewBillModal";

const QUICK_FILTERS = ["Today", "Yesterday"] as const;

export default function AnalyticsScreen() {
  const router = useRouter();
  
  // States
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  
  // Modal States
  const [isBillModalVisible, setIsBillModalVisible] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);

  const dateParam = mode === "daily" || mode === "weekly" ? selectedDate.toISOString().split("T")[0] : undefined;

  const { data, loading, error, refetch } = useAnalytics(mode, dateParam);

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
      setMode("daily");
    }
  };

  const handleOpenBill = (id: string) => {
    setSelectedBillId(id);
    setIsBillModalVisible(true);
  };

  const handleCloseBill = () => {
    setIsBillModalVisible(false);
    setSelectedBillId(null);
  };

  const setQuickFilter = (filter: "Today" | "Yesterday") => {
    const d = new Date();
    if (filter === "Yesterday") d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    setMode("daily");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const debt = data?.debtVsSales || {};
  const products = data?.topProducts || [];
  const biggestBill = data?.biggestBill;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* TOP NAVIGATION BAR */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.push("/dashboard")} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.calendarBtn} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={22} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Analytics</Text>
            <Text style={styles.dateSub}>
              {mode === "daily"
                ? selectedDate.toDateString()
                : mode === "weekly"
                ? `${data?.startDate || ""} → ${data?.endDate || ""}`
                : mode === "monthly"
                ? new Date(selectedDate.getFullYear(), selectedDate.getMonth()).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })
                : selectedDate.getFullYear()}
            </Text>
          </View>
        </View>

        {/* QUICK FILTERS */}
        <View style={styles.quickFilters}>
          {QUICK_FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setQuickFilter(f)}
              style={[
                styles.miniTab,
                selectedDate.toDateString() ===
                  (f === "Today" ? new Date().toDateString() : new Date(Date.now() - 86400000).toDateString()) &&
                  styles.activeMiniTab,
              ]}
            >
              <Text style={styles.miniTabText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PERIOD TABS */}
        <View style={styles.tabs}>
          {(["daily", "weekly", "monthly", "yearly"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setMode(t)}
              style={[styles.tab, mode === t && styles.activeTab]}
            >
              <Text style={[styles.tabText, mode === t && styles.activeTabText]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* TOTAL SALES CARD */}
        <View style={[styles.card, styles.mainCard]}>
          <Text style={styles.cardLabelMain}>TOTAL SALES</Text>
          <Text style={styles.mainValue}>{formatRupee(data?.totalSales || 0)}</Text>
        </View>

        {/* COLLECTION ROW */}
        <View style={styles.row}>
          <View style={styles.statsCard}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="arrow-down" size={16} color="#16a34a" />
            </View>
            <Text style={styles.smallLabel}>Collected</Text>
            <Text style={styles.greenValue}>{formatRupee(debt.totalCollected || 0)}</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.iconCircleRed}>
              <Ionicons name="time-outline" size={16} color="#dc2626" />
            </View>
            <Text style={styles.smallLabel}>Pending Debt</Text>
            <Text style={styles.redValue}>{formatRupee(debt.totalDebt || 0)}</Text>
          </View>
        </View>

        {/* BIGGEST BILL SECTION */}
        {biggestBill && (
          <View style={styles.card}>
            <View style={styles.productHeader}>
              <Text style={styles.cardLabel}>BIGGEST BILL</Text>
              <View style={styles.tag}>
                <Text style={styles.tagText}>#{biggestBill.dailyBillNumber}</Text>
              </View>
            </View>
            
            <View style={styles.billContent}>
              <View>
                <Text style={styles.billAmount}>{formatRupee(biggestBill.totalAmount)}</Text>
                <Text style={styles.billSubText}>
                  {new Date(biggestBill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {biggestBill.paymentMode}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.detailsBtn} 
                onPress={() => handleOpenBill(biggestBill._id)}
              >
                <Text style={styles.detailsBtnText}>See Bill Details</Text>
                <Ionicons name="chevron-forward" size={14} color="#2563eb" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.divider} />
            <Text style={styles.itemsPreview} numberOfLines={1}>
              Items: {biggestBill.items.map((i: any) => i.name).join(", ")}
            </Text>
          </View>
        )}

        {/* FULL PRODUCT LIST */}
        <View style={styles.card}>
          <View style={styles.productHeader}>
            <Text style={styles.cardLabel}>
              PRODUCTS SOLD ({products.length})
            </Text>
            <Ionicons name="trending-up" size={18} color="#64748b" />
          </View>

          {products.length === 0 ? (
            <Text style={styles.emptyText}>No products sold in this period</Text>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.productId}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <View style={[styles.productItem, index === products.length - 1 && { marginBottom: 0 }]}>
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <View style={styles.productStats}>
                      <Text style={styles.qtyText}>Qty: {item.quantity}</Text>
                      <Text style={styles.revenueText}>{formatRupee(item.revenue)}</Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* BILL MODAL COMPONENT */}
      {selectedBillId && (
        <ViewBillModal
          billId={selectedBillId}
          onClose={handleCloseBill}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: "#64748b" },
  errorText: { fontSize: 16, color: "#dc2626", textAlign: "center", marginBottom: 16 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#2563eb", borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
  navBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10, marginBottom: 10 },
  backBtn: { padding: 8, marginLeft: -8 },
  header: { marginBottom: 15 },
  screenTitle: { fontSize: 28, fontWeight: "800", color: "#1e293b" },
  dateSub: { fontSize: 14, color: "#64748b", marginTop: 2 },
  calendarBtn: { padding: 10, backgroundColor: "#fff", borderRadius: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  quickFilters: { flexDirection: "row", gap: 8, marginBottom: 12 },
  miniTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#e2e8f0" },
  activeMiniTab: { backgroundColor: "#cbd5e1" },
  miniTabText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  tabs: { flexDirection: "row", backgroundColor: "#e2e8f0", borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  activeTab: { backgroundColor: "#fff", elevation: 2 },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  activeTabText: { color: "#2563eb" },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 16, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  mainCard: { backgroundColor: "#2563eb" },
  cardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, color: "#94a3b8" },
  cardLabelMain: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, color: "rgba(255,255,255,0.7)" },
  mainValue: { fontSize: 32, fontWeight: "800", color: "#fff", marginTop: 4 },
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statsCard: { flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 16, elevation: 2 },
  smallLabel: { fontSize: 12, color: "#64748b", marginVertical: 6 },
  greenValue: { color: "#16a34a", fontSize: 18, fontWeight: "700" },
  redValue: { color: "#dc2626", fontSize: 18, fontWeight: "700" },
  iconCircleGreen: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#dcfce7", alignItems: "center", justifyContent: "center" },
  iconCircleRed: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center" },
  billContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  billAmount: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  billSubText: { fontSize: 12, color: "#64748b", marginTop: 2 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  detailsBtnText: { color: '#2563eb', fontSize: 12, fontWeight: '700', marginRight: 2 },
  tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: "700", color: '#64748b' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  itemsPreview: { fontSize: 13, color: '#64748b', fontStyle: 'italic' },
  productHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  productItem: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  rankCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#e0e7ff", alignItems: "center", justifyContent: "center", marginRight: 12 },
  rankText: { fontSize: 14, fontWeight: "700", color: "#4f46e5" },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: "600", color: "#1e293b", marginBottom: 4 },
  productStats: { flexDirection: "row", justifyContent: "space-between" },
  qtyText: { fontSize: 14, color: "#64748b" },
  revenueText: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  emptyText: { fontSize: 15, color: "#94a3b8", textAlign: "center", paddingVertical: 20 },
});