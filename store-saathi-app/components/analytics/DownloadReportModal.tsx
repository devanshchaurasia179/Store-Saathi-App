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
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getAnalyticsReport, ReportPeriod } from "../../constants/analytics.api";

/* ─── Types ─── */
interface ReportRow {
  type: "day" | "month_total";
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

interface ReportData {
  shopName: string;
  period: string;
  from: string;
  to: string;
  grandTotal: Omit<ReportRow, "type" | "date" | "label">;
  rows: ReportRow[];
}

/* ─── Period Options ─── */
const PERIOD_OPTIONS: { key: ReportPeriod; label: string; icon: string }[] = [
  { key: "last_month",    label: "Last Month",       icon: "calendar-outline" },
  { key: "last_quarter",  label: "Last Quarter",     icon: "stats-chart-outline" },
  { key: "last_6_months", label: "Last 6 Months",    icon: "bar-chart-outline" },
  { key: "last_year",     label: "Last Year",        icon: "analytics-outline" },
];

/* ─── Helpers ─── */
const fmt = (n: number) => `₹${n.toFixed(2)}`;
const csvEscape = (val: string | number) => {
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

function buildCSV(data: ReportData): string {
  const lines: string[] = [];

  // Header block
  lines.push(`Store Saathi - Sales Report`);
  lines.push(`Shop: ${data.shopName}`);
  lines.push(`Period: ${data.from} to ${data.to}`);
  lines.push(`Generated: ${new Date().toLocaleString("en-IN")}`);
  lines.push("");

  // Column headers
  const headers = [
    "Date",
    "Type",
    "Bills",
    "Total Sales",
    "Collected",
    "Pending Debt",
    "Cash",
    "UPI",
    "Others",
  ];
  lines.push(headers.map(csvEscape).join(","));

  // Rows
  for (const row of data.rows) {
    const cols = [
      row.label,
      row.type === "month_total" ? "MONTHLY TOTAL" : "Daily",
      row.billCount,
      fmt(row.totalSales),
      fmt(row.collected),
      fmt(row.debt),
      fmt(row.cash),
      fmt(row.upi),
      fmt(row.others),
    ];
    lines.push(cols.map(csvEscape).join(","));
  }

  // Grand total
  lines.push("");
  const gt = data.grandTotal;
  const gtCols = [
    "GRAND TOTAL",
    "",
    gt.billCount,
    fmt(gt.totalSales),
    fmt(gt.collected),
    fmt(gt.debt),
    fmt(gt.cash),
    fmt(gt.upi),
    fmt(gt.others),
  ];
  lines.push(gtCols.map(csvEscape).join(","));

  return lines.join("\n");
}

/* ─── Component ─── */
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

      const res = await getAnalyticsReport(selected);
      const data: ReportData = res.data;

      if (!data.success && !(data as any).rows) {
        throw new Error("Failed to fetch report data");
      }

      const csv = buildCSV(data);
      const fileName = `StoreSaathi_Report_${selected}_${data.from}_${data.to}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: `${data.shopName} – Sales Report`,
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert("Saved", `Report saved to:\n${fileUri}`);
      }
    } catch (err: any) {
      console.error("Report download error:", err);
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

          {/* Title */}
          <View style={styles.titleRow}>
            <View style={styles.titleIconBg}>
              <Ionicons name="download-outline" size={20} color="#1E3A8A" />
            </View>
            <Text style={styles.title}>Download Report</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Daily sales breakdown with monthly totals. Exported as CSV — open in
            Excel, Sheets, or WhatsApp.
          </Text>

          {/* Period Options */}
          <Text style={styles.sectionLabel}>SELECT PERIOD</Text>
          <View style={styles.optionsList}>
            {PERIOD_OPTIONS.map((opt) => {
              const isSelected = selected === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSelected(opt.key)}
                  style={[styles.optionRow, isSelected && styles.optionRowActive]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.optionIcon, isSelected && styles.optionIconActive]}>
                    <Ionicons
                      name={opt.icon as any}
                      size={18}
                      color={isSelected ? "#fff" : "#1E3A8A"}
                    />
                  </View>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#1E3A8A" style={styles.checkIcon} />
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
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.downloadBtnText}>Download CSV</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            * Daily entries + monthly cumulative totals included
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E2E8F0",
    alignSelf: "center",
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  titleIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 20,
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
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  optionRowActive: {
    borderColor: "#1E3A8A",
    backgroundColor: "#EFF6FF",
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionIconActive: {
    backgroundColor: "#1E3A8A",
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    flex: 1,
  },
  optionLabelActive: {
    color: "#1E3A8A",
  },
  checkIcon: {
    marginLeft: 4,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E3A8A",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  downloadBtnDisabled: {
    opacity: 0.7,
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
    marginTop: 12,
  },
});
