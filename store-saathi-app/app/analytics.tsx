import React, { useState, useEffect } from "react";
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

/* 🔒 PIN COMPONENTS & API */
import AnalyticsPinModal from "../components/AnalyticsPinModal";
import { getMe } from "../constants/auth.api";

/* 🔤 LANGUAGE */
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
  
  const [showAllProducts, setShowAllProducts] = useState(false);
  
  // 👁️ Privacy & PIN State
  const [isDataVisible, setIsDataVisible] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<"set" | "verify" | "forgot">("verify");
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  // 🔍 Step 3: Detect if PIN exists on load
  useEffect(() => {
    async function checkPin() {
      try {
        const res = await getMe();
        setHasPin(res.data.shop.hasAnalyticsPin);
      } catch {
        setHasPin(false);
      }
    }
    checkPin();
  }, []);

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateParam = 
    mode === "daily" || mode === "weekly" 
      ? getLocalDateString(selectedDate) 
      : undefined;

  const { data, loading, error, refetch } = useAnalytics(mode, dateParam);

  // Helper to mask sensitive values
  const maskValue = (value: string | number) => {
    if (isDataVisible) return typeof value === 'number' ? formatRupee(value) : value;
    return "₹ ••••";
  };

  const maskText = (text: string) => {
    if (isDataVisible) return text;
    return "••••••••";
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowPicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
      setMode("daily");
    }
  };

  const handleToggleVisibility = () => {
    if (isDataVisible) {
      setIsDataVisible(false);
      return;
    }

    if (!hasPin) {
      setPinMode("set");
    } else {
      setPinMode("verify");
    }

    setShowPinModal(true);
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
        <Text style={styles.errorText}>{t.error}: {error}</Text>
        <TouchableOpacity onPress={refetch} style={styles.retryBtn}>
          <Text style={styles.retryText}>{t.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const debt = data?.debtVsSales || {};
  const paymentModes = data?.paymentModes || { CASH: 0, UPI: 0, OTHERS: 0 };
  const biggestBill = data?.biggestBill;
  
  const productsSource = data?.products || [];
  const displayedProducts = showAllProducts ? productsSource : productsSource.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* TOP NAVIGATION BAR */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.push("/dashboard")} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.calendarBtn} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={22} color="#1E3A8A" />
          </TouchableOpacity>
        </View>

        {/* HEADER WITH TITLE & EYE BUTTON */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>{t.title}</Text>
            <TouchableOpacity 
              style={styles.eyeBtn} 
              onPress={handleToggleVisibility}
            >
              <Ionicons 
                name={isDataVisible ? "eye-outline" : "eye-off-outline"} 
                size={26} 
                color="#1E3A8A" 
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.dateSub}>
            {mode === "daily"
              ? selectedDate.toDateString()
              : mode === "weekly"
              ? `${data?.startDate || ""} → ${data?.endDate || ""}`
              : mode === "monthly"
              ? new Date(selectedDate.getFullYear(), selectedDate.getMonth()).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
                  month: "long",
                  year: "numeric",
                })
              : selectedDate.getFullYear()}
          </Text>
        </View>

        {/* PERIOD TABS */}
        <View style={styles.tabs}>
          {(["daily", "weekly", "monthly", "yearly"] as const).map((modeKey) => (
            <TouchableOpacity
              key={modeKey}
              onPress={() => setMode(modeKey)}
              style={[styles.tab, mode === modeKey && styles.activeTab]}
            >
              <Text style={[styles.tabText, mode === modeKey && styles.activeTabText]}>
                {t[modeKey]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* QUICK FILTERS - Logic Updated: Only shows when daily mode is active */}
        {mode === "daily" && (
          <View style={styles.quickFilters}>
            {QUICK_FILTERS.map((f) => {
              const isSelected = 
                selectedDate.toDateString() ===
                (f === "Today" 
                  ? new Date().toDateString() 
                  : new Date(Date.now() - 86400000).toDateString());

              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setQuickFilter(f)}
                  style={[
                    styles.miniTab,
                    isSelected && styles.activeMiniTab,
                  ]}
                >
                  <Text style={[styles.miniTabText, isSelected && { color: '#fff' }]}>
                      {f === "Today" ? t.today : t.yesterday}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

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
          <Text style={styles.cardLabelMain}>{t.totalSales}</Text>
          <View style={styles.mainValueRow}>
            <Text style={styles.mainValue}>
                {maskValue(data?.totalSales || 0)}
            </Text>
            <Ionicons name="stats-chart" size={24} color="rgba(255,255,255,0.3)" />
          </View>
        </View>

        {/* COLLECTION ROW */}
        <View style={styles.row}>
          <View style={styles.statsCard}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="arrow-down" size={16} color="#16a34a" />
            </View>
            <Text style={styles.smallLabel}>{t.collected}</Text>
            <Text style={styles.greenValue}>
                {maskValue(debt.totalCollected || 0)}
            </Text>
            
            {/* Payment Mode Breakdown */}
            <View style={styles.breakdownContainer}>
               <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Cash:</Text>
                  <Text style={styles.breakdownValue}>{maskValue(paymentModes.CASH)}</Text>
               </View>
               <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>UPI:</Text>
                  <Text style={styles.breakdownValue}>{maskValue(paymentModes.UPI)}</Text>
               </View>
               <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Other:</Text>
                  <Text style={styles.breakdownValue}>{maskValue(paymentModes.OTHERS)}</Text>
               </View>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.iconCircleRed}>
              <Ionicons name="time-outline" size={16} color="#dc2626" />
            </View>
            <Text style={styles.smallLabel}>{t.pendingDebt}</Text>
            <Text style={styles.redValue}>
                {maskValue(debt.totalDebt || 0)}
            </Text>
            <View style={styles.unpaidBadge}>
                <Text style={styles.unpaidBadgeText}>
                   {t.unpaidCredit || "Unpaid Credit"}
                </Text>
            </View>
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
                <Text style={styles.billAmount}>
                    {maskValue(biggestBill.totalAmount)}
                </Text>
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

        {/* PRODUCT LIST */}
        <View style={styles.card}>
          <View style={styles.productHeader}>
            <View>
                <Text style={styles.cardLabel}>
                {t.productsSold(productsSource.length)}
                </Text>
                <Text style={styles.productSubHeader}>Top performing items</Text>
            </View>
            <View style={styles.trendingIconBg}>
                <Ionicons name="trending-up" size={18} color="#1E3A8A" />
            </View>
          </View>

          {productsSource.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="cart-outline" size={40} color="#CBD5E1" />
                <Text style={styles.emptyText}>{t.noProducts}</Text>
            </View>
          ) : (
            <View>
              {displayedProducts.map((product: any, index: number) => (
                <View key={product.productId || index} style={styles.productContainerTile}>
                  <View style={styles.productMainRow}>
                    <View style={styles.rankCircle}>
                      <Text style={styles.rankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {maskText(product.name)}
                      </Text>
                      <Text style={styles.totalRevenueSub}>
                         Total: {maskValue(product.totalRevenue)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.variantsListContainer}>
                    {product.variants.map((variant: any, vIdx: number) => (
                      <View key={variant.variantId || vIdx} style={styles.variantDetailRow}>
                        <View style={styles.variantLeft}>
                           <View style={styles.dot} />
                           <Text style={styles.variantNameLabel} numberOfLines={1}>
                             {maskText(variant.name)}
                           </Text>
                        </View>
                        <View style={styles.variantRight}>
                           <Text style={styles.variantQtyText}>
                             {isDataVisible ? variant.quantity : "••"} {isDataVisible ? (variant.unit || "unit") : ""}
                           </Text>
                           <Text style={styles.variantRevenueText}>
                             {maskValue(variant.revenue)}
                           </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}

              {productsSource.length > 5 && (
                <TouchableOpacity 
                  style={styles.seeMoreBtn} 
                  onPress={() => setShowAllProducts(!showAllProducts)}
                >
                  <Text style={styles.seeMoreText}>
                    {showAllProducts ? t.showLess : t.seeMore(productsSource.length - 5)}
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

      {/* 🔌 PIN MODAL */}
      <AnalyticsPinModal
        visible={showPinModal}
        mode={pinMode}
        onClose={() => setShowPinModal(false)}
        onSuccess={(modeOverride?: string) => {
          if (modeOverride === "forgot") {
            setPinMode("forgot");
            return;
          }
          setIsDataVisible(true);
          setHasPin(true);
        }}
      />

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
  navBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  errorText: { fontSize: 16, color: "#dc2626", textAlign: "center", marginBottom: 16 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#1E3A8A", borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600" },
  backBtn: { padding: 8, marginLeft: -8 },
  header: { marginBottom: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  screenTitle: { fontSize: 28, fontWeight: "800", color: "#1E293B" },
  eyeBtn: { marginLeft: 12, padding: 4 },
  dateSub: { fontSize: 14, color: "#64748B", marginTop: 2 },
  calendarBtn: { padding: 10, backgroundColor: "#fff", borderRadius: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  
  // Quick Filters UI Enhancements
  quickFilters: { flexDirection: "row", gap: 8, marginBottom: 16, marginTop: -4 },
  miniTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E2E8F0" },
  activeMiniTab: { backgroundColor: "#1E3A8A", borderColor: "#1E3A8A" }, 
  miniTabText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  
  tabs: { flexDirection: "row", backgroundColor: "#E2E8F0", borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  activeTab: { backgroundColor: "#fff", elevation: 2 },
  tabText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "#1E3A8A" },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 16, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  mainCard: { backgroundColor: "#1E3A8A", paddingVertical: 20 },
  cardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, color: "#94A3B8", textTransform: 'uppercase' },
  cardLabelMain: { fontSize: 11, fontWeight: "700", letterSpacing: 1, color: "rgba(255,255,255,0.6)", textTransform: 'uppercase' },
  mainValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainValue: { fontSize: 34, fontWeight: "800", color: "#fff", marginTop: 4 },
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statsCard: { flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 16, elevation: 2 },
  smallLabel: { fontSize: 12, color: "#64748B", marginVertical: 6, fontWeight: '500' },
  greenValue: { color: "#16A34A", fontSize: 20, fontWeight: "800" },
  redValue: { color: "#DC2626", fontSize: 20, fontWeight: "800" },
  iconCircleGreen: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" },
  iconCircleRed: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center" },
  
  unpaidBadge: { marginTop: 10, backgroundColor: '#FFF1F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  unpaidBadgeText: { fontSize: 10, color: '#E11D48', fontWeight: '700' },

  breakdownContainer: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 8 },
  breakdownRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  breakdownLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "600" },
  breakdownValue: { fontSize: 10, color: "#475569", fontWeight: "700" },

  billContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  billAmount: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
  billSubText: { fontSize: 12, color: "#64748B", marginTop: 2 },
  detailsBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  detailsBtnText: { color: '#1E3A8A', fontSize: 12, fontWeight: '700', marginRight: 2 },
  tag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: "700", color: '#64748B' },
  
  productHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  productSubHeader: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  trendingIconBg: { backgroundColor: '#EFF6FF', padding: 8, borderRadius: 10 },

  productContainerTile: { backgroundColor: "#F8FAFC", borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0" },
  productMainRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingBottom: 8 },
  rankCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1E3A8A", alignItems: "center", justifyContent: "center", marginRight: 12 },
  rankText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  totalRevenueSub: { fontSize: 12, fontWeight: "600", color: "#64748B", marginTop: 2 },
  variantsListContainer: { paddingLeft: 4 },
  variantDetailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  variantLeft: { flexDirection: "row", alignItems: "center", flex: 0.6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#CBD5E1", marginRight: 8 },
  variantNameLabel: { fontSize: 14, color: "#475569", fontWeight: "500" },
  variantRight: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", flex: 0.4 },
  variantQtyText: { fontSize: 13, color: "#64748B", marginRight: 10 },
  variantRevenueText: { fontSize: 13, fontWeight: "700", color: "#1E293B", width: 75, textAlign: 'right' },
  
  emptyContainer: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 15, color: "#94A3B8", textAlign: "center", marginTop: 8 },
  seeMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 4 },
  seeMoreText: { color: '#1E3A8A', fontSize: 14, fontWeight: '700' }
});