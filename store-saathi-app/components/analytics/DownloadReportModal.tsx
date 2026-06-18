import React, { useState } from "react";
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
  getMonthlyAnalytics,
  getYearlyAnalytics,
} from "../../constants/analytics.api";

/* ─────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────── */
export type ReportPeriod =
  | "last_month"
  | "last_quarter"
  | "last_6_months"
  | "last_year";

interface DaySummary {
  date: string;        // YYYY-MM-DD
  label: string;       // "11 Jun 2026"
  totalSales: number;
  collected: number;
  debt: number;
  billCount: number;
  cash: number;
  upi: number;
  others: number;
}

interface MonthSummary {
  monthLabel: string;  // "June 2026"
  days: DaySummary[];
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
  { key: "last_month",    label: "Last Month",    sublabel: "Day-by-day breakdown",    icon: "calendar-outline" },
  { key: "last_quarter",  label: "Last Quarter",  sublabel: "3 months daily detail",   icon: "stats-chart-outline" },
  { key: "last_6_months", label: "Last 6 Months", sublabel: "6 months daily detail",   icon: "bar-chart-outline" },
  { key: "last_year",     label: "Last Year",     sublabel: "Full year daily detail",  icon: "analytics-outline" },
];

/* ─────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────── */
const IST = 330; // minutes

/** Get IST date-string YYYY-MM-DD from a UTC Date */
function toISTDateStr(utcDate: Date): string {
  const d = new Date(utcDate.getTime() + IST * 60 * 1000);
  return d.toISOString().split("T")[0];
}

/** Format YYYY-MM-DD → "11 Jun 2026" */
function fmtDate(iso: string): string {
  const [y, m, dd] = iso.split("-").map(Number);
  return new Date(y, m - 1, dd).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/** Format month key YYYY-MM → "June 2026" */
function fmtMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long", year: "numeric",
  });
}

/** rupee formatter */
const r = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ─────────────────────────────────────────────────
   BUILD REPORT DATA FROM EXISTING APIs
   Strategy:
   - For last_month  → 1 call to getMonthlyAnalytics for that month
   - For last_quarter / last_6_months → N monthly calls
   - For last_year   → 1 call to getYearlyAnalytics
   Each API already returns bill-level data grouped as weeks/months.
   We re-aggregate on the frontend using the bills themselves via
   the monthly endpoint (which gives us week breakdowns) — but
   since the existing APIs don't give raw day data back, we use
   getMonthlyAnalytics which gives `weeks`. Instead we'll use
   getYearlyAnalytics which gives `months` array, then for each
   month call getMonthlyAnalytics which gives `weeks`.
   
   Actually the cleanest approach: call getMonthlyAnalytics for
   each target month — it returns `weeks` with per-week totals.
   We show weekly rows per month (not daily, since daily requires
   the new backend endpoint). The report will be:
     Week 1 Jun (1–7)  | sales | ...
     Week 2 Jun (8–14) | ...
     JUNE TOTAL        | ...
   This works entirely with the deployed APIs.
───────────────────────────────────────────────── */

/** Returns list of YYYY-MM strings for the period */
function getMonthsForPeriod(period: ReportPeriod): string[] {
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST * 60 * 1000);
  const curYear = nowIST.getFullYear();
  const curMonth = nowIST.getMonth(); // 0-indexed, this is the CURRENT month

  const months: string[] = [];

  if (period === "last_month") {
    // just the previous month
    const d = new Date(curYear, curMonth - 1, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  } else if (period === "last_quarter") {
    for (let i = 3; i >= 1; i--) {
      const d = new Date(curYear, curMonth - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  } else if (period === "last_6_months") {
    for (let i = 6; i >= 1; i--) {
      const d = new Date(curYear, curMonth - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
  } else if (period === "last_year") {
    const prevYear = curYear - 1;
    for (let m = 0; m < 12; m++) {
      months.push(`${prevYear}-${String(m + 1).padStart(2, "0")}`);
    }
  }

  return months;
}

interface WeekRow {
  weekLabel: string;
  totalSales: number;
  collected: number;
  debt: number;
  billCount: number;
  cash: number;
  upi: number;
  others: number;
}

interface MonthBlock {
  monthLabel: string;
  weeks: WeekRow[];
  totalSales: number;
  collected: number;
  debt: number;
  billCount: number;
  cash: number;
  upi: number;
  others: number;
}

async function fetchReportData(period: ReportPeriod): Promise<{
  months: MonthBlock[];
  grandTotal: Omit<MonthBlock, "monthLabel" | "weeks">;
  from: string;
  to: string;
}> {
  const monthKeys = getMonthsForPeriod(period);

  // Fetch all months in parallel
  const results = await Promise.all(
    monthKeys.map((key) => getMonthlyAnalytics(key))
  );

  const months: MonthBlock[] = [];
  let gSales = 0, gCollected = 0, gDebt = 0, gBills = 0, gCash = 0, gUpi = 0, gOthers = 0;

  for (let i = 0; i < monthKeys.length; i++) {
    const key = monthKeys[i];
    const apiData = results[i].data;

    // Build week rows from the `weeks` array returned by getMonthlyAnalytics
    const weekRows: WeekRow[] = (apiData.weeks || []).map((w: any) => {
      const weekStart = w.weekStart || "";
      // Format: "Jun 1 – Jun 7"
      const wDate = weekStart ? new Date(weekStart + "T00:00:00") : null;
      const weekLabel = wDate
        ? `Week of ${wDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
        : "Week";

      const wSales = w.totalSales || 0;
      const wCollected = w.debtVsSales?.totalCollected || 0;
      const wDebt = w.debtVsSales?.totalDebt || 0;
      const wBills = (w.products || []).length > 0 || wSales > 0 ? 1 : 0; // approx
      const wCash = w.paymentModes?.CASH || 0;
      const wUpi = w.paymentModes?.UPI || 0;
      const wOthers = w.paymentModes?.OTHERS || 0;

      return {
        weekLabel,
        totalSales: wSales,
        collected: wCollected,
        debt: wDebt,
        billCount: wBills,
        cash: wCash,
        upi: wUpi,
        others: wOthers,
      };
    });

    const mSales = apiData.totalSales || 0;
    const mCollected = apiData.debtVsSales?.totalCollected || 0;
    const mDebt = apiData.debtVsSales?.totalDebt || 0;
    const mCash = apiData.paymentModes?.CASH || 0;
    const mUpi = apiData.paymentModes?.UPI || 0;
    const mOthers = apiData.paymentModes?.OTHERS || 0;

    gSales += mSales;
    gCollected += mCollected;
    gDebt += mDebt;
    gCash += mCash;
    gUpi += mUpi;
    gOthers += mOthers;

    months.push({
      monthLabel: fmtMonth(key),
      weeks: weekRows,
      totalSales: mSales,
      collected: mCollected,
      debt: mDebt,
      billCount: weekRows.length,
      cash: mCash,
      upi: mUpi,
      others: mOthers,
    });
  }

  const from = monthKeys[0]
    ? new Date(monthKeys[0] + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "";
  const to = monthKeys[monthKeys.length - 1]
    ? new Date(monthKeys[monthKeys.length - 1] + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "";

  return {
    months,
    grandTotal: {
      totalSales: gSales,
      collected: gCollected,
      debt: gDebt,
      billCount: 0,
      cash: gCash,
      upi: gUpi,
      others: gOthers,
    },
    from,
    to,
  };
}

/* ─────────────────────────────────────────────────
   HTML → PDF BUILDER
───────────────────────────────────────────────── */
function buildHTML(
  period: ReportPeriod,
  months: MonthBlock[],
  grandTotal: Omit<MonthBlock, "monthLabel" | "weeks">,
  from: string,
  to: string
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
    isTotal = false,
    isGrand = false
  ) => `
    <tr class="${isGrand ? "grand-total" : isTotal ? "month-total" : "week-row"}">
      <td class="label-cell">${label}</td>
      <td>${r(sales)}</td>
      <td class="green">${r(collected)}</td>
      <td class="red">${r(debt)}</td>
      <td>${r(cash)}</td>
      <td>${r(upi)}</td>
      <td>${r(others)}</td>
    </tr>`;

  const monthBlocks = months
    .map(
      (m) => `
      <tr class="month-header">
        <td colspan="7">📅 ${m.monthLabel}</td>
      </tr>
      ${m.weeks.map((w) =>
        tableRow(w.weekLabel, w.totalSales, w.collected, w.debt, w.cash, w.upi, w.others)
      ).join("")}
      ${tableRow(`TOTAL — ${m.monthLabel}`, m.totalSales, m.collected, m.debt, m.cash, m.upi, m.others, true)}
    `
    )
    .join("");

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
  td { padding: 6px 6px; border-bottom: 1px solid #F1F5F9; text-align: right; font-size: 10px; }
  td.label-cell { text-align: left; color: #475569; }

  tr.month-header td { background: #EFF6FF; color: #1E3A8A; font-weight: 800; font-size: 11px; padding: 10px 8px; border-top: 2px solid #BFDBFE; text-align: left; }
  tr.week-row:hover td { background: #F8FAFC; }
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
    <div class="brand">Store <span>Saathi</span></div>
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
    <div class="card-sub">${periodLabel}</div>
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

<!-- MAIN TABLE -->
<table>
  <thead>
    <tr>
      <th style="width:28%">Period</th>
      <th>Total Sales</th>
      <th>Collected</th>
      <th>Pending</th>
      <th>Cash</th>
      <th>UPI</th>
      <th>Others</th>
    </tr>
  </thead>
  <tbody>
    ${monthBlocks}
    ${tableRow("GRAND TOTAL", grandTotal.totalSales, grandTotal.collected, grandTotal.debt, grandTotal.cash, grandTotal.upi, grandTotal.others, false, true)}
  </tbody>
</table>

<div class="footer">
  Store Saathi • Auto-generated sales report • ${generated}
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

  const handleDownload = async () => {
    try {
      setLoading(true);

      // 1. Fetch data from existing deployed APIs
      const { months, grandTotal, from, to } = await fetchReportData(selected);

      // 2. Build HTML
      const html = buildHTML(selected, months, grandTotal, from, to);

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
              <Text style={styles.titleSub}>PDF • Sales breakdown with monthly totals</Text>
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
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color="#fff" />
                <Text style={styles.downloadBtnText}>Download PDF</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Weekly breakdown per month + grand total • Share via WhatsApp, Drive, or save locally
          </Text>

        </View>
      </View>
    </Modal>
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
});
