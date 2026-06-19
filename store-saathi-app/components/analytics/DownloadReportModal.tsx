import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {
  getAnalyticsReport,
  type ReportPeriod,
} from "../../constants/analytics.api";
import { getMe } from "../../constants/auth.api";
import AnalyticsPinModal from "../AnalyticsPinModal";

/* ─────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────── */
// ReportPeriod is imported from analytics.api

interface DayRow {
  type: "day";
  date: string;
  label: string;
  totalSales: number;
  collected: number;
  debt: number;
  billCount: number;
  cash: number;
  upi: number;
  others: number;
}

interface MonthTotalRow {
  type: "month_total";
  date: string;
  label: string;
  totalSales: number;
  collected: number;
  debt: number;
  billCount: number;
  cash: number;
  upi: number;
  others: number;
}

type ReportRow = DayRow | MonthTotalRow;

interface GrandTotal {
  totalSales: number;
  collected: number;
  debt: number;
  billCount: number;
  cash: number;
  upi: number;
  others: number;
}

/* ─────────────────────────────────────────────────
   PERIOD OPTIONS
───────────────────────────────────────────────── */
const PERIOD_OPTIONS: { key: ReportPeriod; label: string; sublabel: string; icon: string }[] = [
  { key: "this_month",    label: "This Month",    sublabel: "Current month so far",        icon: "today-outline" },
  { key: "last_month",    label: "Last Month",    sublabel: "Day-by-day breakdown",         icon: "calendar-outline" },
  { key: "last_quarter",  label: "Last Quarter",  sublabel: "3 months daily detail",        icon: "stats-chart-outline" },
  { key: "last_6_months", label: "Last 6 Months", sublabel: "6 months daily detail",        icon: "bar-chart-outline" },
  { key: "last_year",     label: "Last Year",     sublabel: "Full year daily detail",       icon: "analytics-outline" },
];

/* ─────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────── */
/** rupee formatter */
const r = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ─────────────────────────────────────────────────
   FETCH REPORT DATA FROM API
───────────────────────────────────────────────── */
async function fetchReportData(period: ReportPeriod): Promise<{
  rows: ReportRow[];
  grandTotal: GrandTotal;
  from: string;
  to: string;
  shopName: string;
}> {
  const res = await getAnalyticsReport(period);
  const data = res.data;
  return {
    rows: data.rows || [],
    grandTotal: data.grandTotal,
    from: data.from,
    to: data.to,
    shopName: data.shopName || "My Store",
  };
}

/* ─────────────────────────────────────────────────
   HTML → PDF BUILDER
───────────────────────────────────────────────── */
function buildHTML(
  period: ReportPeriod,
  rows: ReportRow[],
  grandTotal: GrandTotal,
  from: string,
  to: string,
  shopName: string
): string {
  const periodLabel = PERIOD_OPTIONS.find((p) => p.key === period)?.label || period;
  const generated = new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const tableRow = (
    label: string,
    sales: number,
    collected: number,
    debt: number,
    cash: number,
    upi: number,
    others: number,
    billCount: number,
    isTotal = false,
    isGrand = false
  ) => `
    <tr class="${isGrand ? "grand-total" : isTotal ? "month-total" : "day-row"}">
      <td class="label-cell">${label}</td>
      <td>${isGrand || isTotal ? "" : billCount}</td>
      <td>${r(sales)}</td>
      <td class="green">${r(collected)}</td>
      <td class="red">${r(debt)}</td>
      <td>${r(cash)}</td>
      <td>${r(upi)}</td>
      <td>${r(others)}</td>
    </tr>`;

  // Group rows by month for section headers
  let tableBody = "";
  let lastMonth = "";

  for (const row of rows) {
    if (row.type === "month_total") {
      tableBody += tableRow(row.label, row.totalSales, row.collected, row.debt, row.cash, row.upi, row.others, row.billCount, true);
      lastMonth = "";
    } else {
      // Skip days with zero sales entirely
      if (row.billCount === 0 && row.totalSales === 0) continue;

      // day row — add month header if entering a new month
      const monthKey = row.date.substring(0, 7); // YYYY-MM
      if (monthKey !== lastMonth) {
        const [y, m] = monthKey.split("-").map(Number);
        const monthLabel = new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        tableBody += `<tr class="month-header"><td colspan="8">📅 ${monthLabel}</td></tr>`;
        lastMonth = monthKey;
      }
      tableBody += tableRow(row.label, row.totalSales, row.collected, row.debt, row.cash, row.upi, row.others, row.billCount);
    }
  }

  // Grand total row
  tableBody += tableRow("GRAND TOTAL", grandTotal.totalSales, grandTotal.collected, grandTotal.debt, grandTotal.cash, grandTotal.upi, grandTotal.others, grandTotal.billCount, false, true);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1E293B; background: #fff; padding: 24px; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #1E3A8A; padding-bottom: 16px; }
  .brand { font-size: 22px; font-weight: 800; color: #1E3A8A; }
  .brand span { color: #F59E0B; }
  .shop-name { font-size: 13px; font-weight: 700; color: #334155; margin-top: 4px; }
  .meta { text-align: right; color: #64748B; font-size: 10px; line-height: 1.6; }
  .meta strong { color: #1E293B; font-size: 12px; display: block; margin-bottom: 2px; }

  .summary-cards { display: flex; gap: 12px; margin-bottom: 24px; }
  .card { flex: 1; border-radius: 10px; padding: 14px; }
  .card-blue { background: #1E3A8A; color: #fff; }
  .card-green { background: #DCFCE7; color: #166534; }
  .card-red { background: #FEE2E2; color: #991B1B; }
  .card-label { font-size: 9px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; opacity: 0.75; margin-bottom: 4px; }
  .card-value { font-size: 18px; font-weight: 800; }
  .card-sub { font-size: 9px; margin-top: 4px; opacity: 0.7; }

  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #1E3A8A; color: #fff; padding: 8px 6px; text-align: right; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; }
  th:first-child { text-align: left; }
  th:nth-child(2) { text-align: center; }
  td { padding: 6px 6px; border-bottom: 1px solid #F1F5F9; text-align: right; font-size: 10px; }
  td.label-cell { text-align: left; color: #475569; }
  td:nth-child(2) { text-align: center; color: #94A3B8; }

  tr.month-header td { background: #EFF6FF; color: #1E3A8A; font-weight: 800; font-size: 11px; padding: 10px 8px; border-top: 2px solid #BFDBFE; text-align: left; }
  tr.day-row:hover td { background: #F8FAFC; }
  tr.month-total td { background: #F1F5F9; font-weight: 700; color: #1E293B; border-top: 1px solid #CBD5E1; border-bottom: 2px solid #CBD5E1; }
  tr.grand-total td { background: #1E3A8A; color: #fff; font-weight: 800; font-size: 11px; padding: 10px 6px; }
  tr.grand-total td.label-cell { color: #fff; }

  .green { color: #16A34A; }
  .red { color: #DC2626; }
  tr.month-total .green { color: #15803D; }
  tr.month-total .red { color: #B91C1C; }

  .payment-row { display: flex; gap: 16px; margin-top: 16px; margin-bottom: 24px; }
  .pay-card { flex: 1; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; }
  .pay-label { font-size: 9px; color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .pay-value { font-size: 14px; font-weight: 800; color: #1E293B; margin-top: 2px; }

  .footer { margin-top: 32px; text-align: center; font-size: 9px; color: #CBD5E1; border-top: 1px solid #F1F5F9; padding-top: 12px; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div>
    <div class="brand">Store <span>Saarthi</span></div>
    <div class="shop-name">${shopName}</div>
    <div style="color:#64748B;font-size:10px;margin-top:4px;">Sales Report — ${periodLabel}</div>
  </div>
  <div class="meta">
    <strong>${from} → ${to}</strong>
    Generated: ${generated}
  </div>
</div>

<!-- SUMMARY CARDS -->
<div class="summary-cards">
  <div class="card card-blue">
    <div class="card-label">Total Sales</div>
    <div class="card-value">${r(grandTotal.totalSales)}</div>
    <div class="card-sub">${grandTotal.billCount} bills • ${periodLabel}</div>
  </div>
  <div class="card card-green">
    <div class="card-label">Collected</div>
    <div class="card-value">${r(grandTotal.collected)}</div>
    <div class="card-sub">Cash + UPI + Others</div>
  </div>
  <div class="card card-red">
    <div class="card-label">Pending Debt</div>
    <div class="card-value">${r(grandTotal.debt)}</div>
    <div class="card-sub">Unpaid credit</div>
  </div>
</div>

<!-- PAYMENT BREAKDOWN -->
<div class="payment-row">
  <div class="pay-card">
    <div class="pay-label">💵 Cash</div>
    <div class="pay-value">${r(grandTotal.cash)}</div>
  </div>
  <div class="pay-card">
    <div class="pay-label">📱 UPI</div>
    <div class="pay-value">${r(grandTotal.upi)}</div>
  </div>
  <div class="pay-card">
    <div class="pay-label">🏦 Others</div>
    <div class="pay-value">${r(grandTotal.others)}</div>
  </div>
</div>

<!-- NOTE -->
<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:9px 14px;margin-bottom:14px;font-size:10px;color:#92400E;display:flex;align-items:center;gap:8px;">
  ℹ️ <strong>Note:</strong>&nbsp;Only days with at least one sale are listed below. Days with no transactions are excluded.
</div>

<!-- MAIN TABLE -->
<table>
  <thead>
    <tr>
      <th style="width:26%">Date</th>
      <th style="width:5%">Bills</th>
      <th>Total Sales</th>
      <th>Collected</th>
      <th>Pending</th>
      <th>Cash</th>
      <th>UPI</th>
      <th>Others</th>
    </tr>
  </thead>
  <tbody>
    ${tableBody}
  </tbody>
</table>

<div class="footer">
  Store Saathi • Auto-generated sales report • ${generated} • Only days with sales are shown
</div>

</body>
</html>`;
}

/* ─────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────── */
interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function DownloadReportModal({ visible, onClose }: Props) {
  const [selected, setSelected] = useState<ReportPeriod>("last_month");
  const [loading, setLoading] = useState(false);

  // PIN gate
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pinVerified, setPinVerified] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(false);

  // Check if PIN exists when modal opens
  useEffect(() => {
    if (visible) {
      setPinVerified(false); // reset on every open
      getMe()
        .then((res) => setHasPin(res.data.shop.hasAnalyticsPin))
        .catch(() => setHasPin(false));
    }
  }, [visible]);

  const handleDownload = async () => {
    // If PIN not yet verified, ask for it first
    if (!pinVerified) {
      setPendingDownload(true);
      setShowPinModal(true);
      return;
    }
    await generateAndSharePDF();
  };

  const generateAndSharePDF = async () => {
    try {
      setLoading(true);

      // 1. Fetch data from the report API
      const { rows, grandTotal, from, to, shopName } = await fetchReportData(selected);

      // 2. Build HTML
      const html = buildHTML(selected, rows, grandTotal, from, to, shopName);

      // 3. Convert HTML → PDF (saves to app cache automatically)
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      // 4. Share / save the PDF
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Store Saathi — Sales Report`,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Saved", `Report saved to:\n${uri}`);
      }
    } catch (err: any) {
      console.error("PDF Report Error:", err);
      Alert.alert("Error", "Could not generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* Handle */}
          <View style={styles.handle} />

          {/* Title Row */}
          <View style={styles.titleRow}>
            <View style={styles.titleIconBg}>
              <Ionicons name="document-text-outline" size={20} color="#1E3A8A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Download Report</Text>
              <Text style={styles.titleSub}>PDF • Day-by-day breakdown with monthly totals</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Period Options */}
          <Text style={styles.sectionLabel}>SELECT PERIOD</Text>
          <View style={styles.optionsList}>
            {PERIOD_OPTIONS.map((opt) => {
              const isActive = selected === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSelected(opt.key)}
                  style={[styles.optionRow, isActive && styles.optionRowActive]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, isActive && styles.optionIconActive]}>
                    <Ionicons
                      name={opt.icon as any}
                      size={18}
                      color={isActive ? "#fff" : "#1E3A8A"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionSublabel, isActive && { color: "#3B5FC0" }]}>
                      {opt.sublabel}
                    </Text>
                  </View>
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={22} color="#1E3A8A" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Download Button */}
          <TouchableOpacity
            style={[styles.downloadBtn, loading && styles.downloadBtnDisabled]}
            onPress={handleDownload}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.downloadBtnText}>Generating PDF…</Text>
              </>
            ) : pinVerified ? (
              <>
                <Ionicons name="document-text-outline" size={18} color="#fff" />
                <Text style={styles.downloadBtnText}>Download PDF</Text>
              </>
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                <Text style={styles.downloadBtnText}>Verify PIN to Download</Text>
              </>
            )}
          </TouchableOpacity>

          {pinVerified && (
            <View style={styles.pinVerifiedBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#16A34A" />
              <Text style={styles.pinVerifiedText}>PIN verified • Access granted</Text>
            </View>
          )}

          <Text style={styles.footerNote}>
            Daily breakdown per month + grand total • Only days with sales shown • Share via WhatsApp, Drive, or save locally
          </Text>

        </View>
      </View>
    </Modal>

    {/* PIN VERIFICATION MODAL */}
    <AnalyticsPinModal
      visible={showPinModal}
      mode={hasPin === false ? "set" : "verify"}
      onClose={() => {
        setShowPinModal(false);
        setPendingDownload(false);
      }}
      onSuccess={() => {
        setShowPinModal(false);
        setPinVerified(true);
        setHasPin(true);
        if (pendingDownload) {
          setPendingDownload(false);
          // slight delay so pin modal fully closes before PDF generates
          setTimeout(() => generateAndSharePDF(), 300);
        }
      }}
    />
  </>
  );
}

/* ─────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  titleIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  titleSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#94A3B8",
    marginBottom: 10,
  },
  optionsList: {
    gap: 8,
    marginBottom: 24,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  optionRowActive: {
    borderColor: "#1E3A8A",
    backgroundColor: "#EFF6FF",
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconActive: {
    backgroundColor: "#1E3A8A",
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
  },
  optionLabelActive: {
    color: "#1E3A8A",
  },
  optionSublabel: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 1,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
    borderRadius: 16,
    paddingVertical: 17,
    gap: 8,
  },
  downloadBtnDisabled: {
    opacity: 0.65,
  },
  downloadBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  footerNote: {
    fontSize: 11,
    color: "#CBD5E1",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 16,
  },
  pinVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  pinVerifiedText: {
    fontSize: 12,
    color: "#16A34A",
    fontWeight: "600",
  },
});
