import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import PageLoader from "@/components/PageLoader";
import { useAnalytics } from "../hooks/useAnalytics";
import { formatRupee } from "../utils/formatCurrency";
import ViewBillModal from "../components/bills/ViewBillModal";

/* 🔤 LANGUAGE & UX ENHANCEMENT */
import { LANGUAGE_TEXT_ANALYTICS } from "../constants/language";
import { useLanguage } from "../providers/LanguageProvider";

const QUICK_FILTERS = ["Today", "Yesterday"] as const;

export default function AnalyticsScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_ANALYTICS[language] || LANGUAGE_TEXT_ANALYTICS.en;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [isBillModalVisible, setIsBillModalVisible] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  
  // State to manage showing more products
  const [showAllProducts, setShowAllProducts] = useState(false);

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

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={60} color="#dc2626" />
        <Text style={styles.errorText}>{t.error}: {error}</Text>
        <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
          <Text style={styles.retryText}>{t.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const debt = data?.debtVsSales || {};
  const products = data?.topProducts || [];
  const biggestBill = data?.biggestBill;

  // Logic for slicing top 5 products
  const displayedProducts = showAllProducts ? products : products.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* TOP NAVIGATION BAR */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.push("/dashboard")} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.calendarBtn} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#1E3A8A" />
            <Text style={styles.calendarBtnText}>{t.selectDate}</Text>
          </TouchableOpacity>
        </View>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>{t.title}</Text>
            <View style={styles.dateBadge}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
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
        </View>

        {/* QUICK FILTERS */}
        <View style={styles.quickFilters}>
          {QUICK_FILTERS.map((f) => {
            const isSelected = selectedDate.toDateString() === (f === "Today" ? new Date().toDateString() : new Date(Date.now() - 86400000).toDateString());
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setQuickFilter(f)}
                style={[
                  styles.miniTab,
                  isSelected && styles.activeMiniTab,
                ]}
              >
                <Text style={[styles.miniTabText, isSelected && styles.activeMiniTabText]}>{t[f.toLowerCase()]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PERIOD TABS */}
        <View style={styles.tabs}>
          {(["daily", "weekly", "monthly", "yearly"] as const).map((modeKey) => (
            <TouchableOpacity
              key={modeKey}
              onPress={() => {
                setMode(modeKey);
                setShowAllProducts(false);
              }}
              style={[styles.tab, mode === modeKey && styles.activeTab]}
            >
              <Text style={[styles.tabText, mode === modeKey && styles.activeTabText]}>
                {t[modeKey]}
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
          <View style={styles.cardHeaderInline}>
            <Text style={styles.cardLabelMain}>{t.totalSales}</Text>
            <Ionicons name="stats-chart" size={18} color="rgba(255,255,255,0.6)" />
          </View>
          <Text style={styles.mainValue}>{formatRupee(data?.totalSales || 0)}</Text>
        </View>

        {/* COLLECTION ROW */}
        <View style={styles.row}>
          <View style={styles.statsCard}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="trending-up" size={16} color="#16a34a" />
            </View>
            <Text style={styles.smallLabel}>{t.collected}</Text>
            <Text style={styles.greenValue}>{formatRupee(debt.totalCollected || 0)}</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.iconCircleRed}>
              <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            </View>
            <Text style={styles.smallLabel}>{t.pendingDebt}</Text>
            <Text style={styles.redValue}>{formatRupee(debt.totalDebt || 0)}</Text>
          </View>
        </View>

        {/* BIGGEST BILL SECTION */}
        {biggestBill && (
          <View style={styles.card}>
            <View style={styles.productHeader}>
              <Text style={styles.cardLabel}>{t.biggestBill}</Text>
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
                <Text style={styles.detailsBtnText}>{t.seeBillDetails}</Text>
                <Ionicons name="chevron-forward" size={14} color="#1E3A8A" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* FULL PRODUCT LIST */}
        <View style={styles.card}>
          <View style={styles.productHeader}>
            <Text style={styles.cardLabel}>
              {t.productsSold(products.length)}
            </Text>
            <Ionicons name="medal-outline" size={18} color="#64748b" />
          </View>

          {products.length === 0 ? (
            <View style={styles.emptyStateContainer}>
                <Ionicons name="receipt-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>{t.noProducts}</Text>
            </View>
          ) : (
            <View>
                {displayedProducts.map((item: any, index: number) => (
                    <View key={item.productId} style={[styles.productItem, index === displayedProducts.length - 1 && !(!showAllProducts && products.length > 5) && { marginBottom: 0 }]}>
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
                ))}

                {/* See More / See Less Button */}
                {products.length > 5 && (
                  <TouchableOpacity 
                    style={styles.seeMoreBtn} 
                    onPress={() => setShowAllProducts(!showAllProducts)}
                  >
                    <Text style={styles.seeMoreText}>
                        {showAllProducts ? t.showTop5 : t.seeMore(products.length - 5)}
                    </Text>
                    <Ionicons 
                        name={showAllProducts ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color="#1E3A8A" 
                    />
                  </TouchableOpacity>
                )}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

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
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, paddingHorizontal: 16 },
  navBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  errorText: { fontSize: 16, color: "#64748B", textAlign: "center", marginVertical: 16, fontWeight: '600' },
  retryBtn: { paddingHorizontal: 30, paddingVertical: 12, backgroundColor: "#1E3A8A", borderRadius: 12, elevation: 3 },
  retryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  backBtn: { padding: 8, marginLeft: -8 },
  header: { marginBottom: 15 },
  screenTitle: { fontSize: 32, fontWeight: "900", color: "#1E293B", letterSpacing: -0.5 },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dateSub: { fontSize: 14, color: "#64748B", fontWeight: '600' },
  calendarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff", borderRadius: 20, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  calendarBtnText: { fontSize: 13, fontWeight: '700', color: '#1E3A8A' },
  quickFilters: { flexDirection: "row", gap: 10, marginBottom: 15 },
  miniTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0" },
  activeMiniTab: { backgroundColor: "#1E3A8A", borderColor: "#1E3A8A" },
  miniTabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  activeMiniTabText: { color: "#fff" },
  tabs: { flexDirection: "row", backgroundColor: "#E2E8F0", borderRadius: 16, padding: 4, marginBottom: 25 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  activeTab: { backgroundColor: "#fff", elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  tabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  activeTabText: { color: "#1E3A8A" },
  card: { backgroundColor: "#fff", padding: 18, borderRadius: 24, marginBottom: 16, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  mainCard: { backgroundColor: "#1E3A8A", paddingVertical: 24 },
  cardHeaderInline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabelMain: { fontSize: 12, fontWeight: "800", color: "rgba(255,255,255,0.6)", letterSpacing: 1, textTransform: 'uppercase' },
  mainValue: { fontSize: 38, fontWeight: "900", color: "#fff", marginTop: 8 },
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statsCard: { flex: 1, backgroundColor: "#fff", padding: 18, borderRadius: 24, elevation: 2 },
  smallLabel: { fontSize: 12, fontWeight: '700', color: "#64748B", marginVertical: 6 },
  greenValue: { color: "#16A34A", fontSize: 20, fontWeight: "800" },
  redValue: { color: "#DC2626", fontSize: 20, fontWeight: "800" },
  iconCircleGreen: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" },
  iconCircleRed: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
  cardLabel: { fontSize: 12, fontWeight: "800", color: "#94A3B8", letterSpacing: 1, textTransform: 'uppercase' },
  billContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  billAmount: { fontSize: 26, fontWeight: "900", color: "#1E293B" },
  billSubText: { fontSize: 12, fontWeight: '600', color: "#64748B", marginTop: 2 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  detailsBtnText: { color: '#1E3A8A', fontSize: 12, fontWeight: '800', marginRight: 4 },
  tag: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: "800", color: '#64748B' },
  productHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 },
  productItem: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  rankCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginRight: 12 },
  rankText: { fontSize: 14, fontWeight: "800", color: "#1E3A8A" },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 4 },
  productStats: { flexDirection: "row", justifyContent: "space-between" },
  qtyText: { fontSize: 14, fontWeight: '600', color: "#64748B" },
  revenueText: { fontSize: 14, fontWeight: "800", color: "#1E293B" },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 15, fontWeight: '600', color: "#94A3B8", textAlign: "center", marginTop: 12 },
  seeMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 6 },
  seeMoreText: { color: '#1E3A8A', fontSize: 14, fontWeight: '800' }
});