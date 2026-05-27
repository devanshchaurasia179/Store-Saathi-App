import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatRupee } from "../../utils/formatCurrency";

type BillSuccessSheetProps = {
  visible: boolean;
  onClose: () => void;
  billId: string | null;
  itemCount: number;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  isPrinterConnected: boolean;
  checkingPrinter: boolean;
  onPrint: () => void;
  onNextCustomer: () => void;
  labels: {
    paymentReceived: string;
    print: string;
    setupPrint: string;
    nextCustomer: string;
  };
};

export default function BillSuccessSheet({
  visible,
  onClose,
  billId,
  itemCount,
  subtotal,
  discount,
  tax,
  totalAmount,
  isPrinterConnected,
  checkingPrinter,
  onPrint,
  onNextCustomer,
  labels,
}: BillSuccessSheetProps) {
  const insets = useSafeAreaInsets();

  if (!billId) return null;

  const hasDiscount = discount > 0;
  const hasTax = tax > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* ── Backdrop — tap to dismiss ── */}
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <View style={styles.card}>

          {/* ── Close button ── */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={17} color="#94a3b8" />
          </TouchableOpacity>

          {/* ── SUCCESS HEADER ── */}
          <View style={styles.header}>
            <View style={styles.successRing}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={30} color="#fff" />
              </View>
            </View>
            <Text style={styles.successTitle}>{labels.paymentReceived}</Text>
            <Text style={styles.billSuccess}>Bill Created, Successfully</Text>
          </View>

          {/* ── SUMMARY CARD ── */}
          <View style={styles.summaryCard}>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <Feather name="shopping-bag" size={14} color="#6366f1" />
                </View>
                <Text style={styles.rowLabel}>Items</Text>
              </View>
              <Text style={styles.rowValue}>{itemCount} {itemCount === 1 ? "item" : "items"}</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <Feather name="file-text" size={14} color="#6366f1" />
                </View>
                <Text style={styles.rowLabel}>Subtotal</Text>
              </View>
              <Text style={styles.rowValue}>{formatRupee(subtotal)}</Text>
            </View>

            {hasDiscount && (
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, styles.iconBoxGreen]}>
                    <Feather name="tag" size={14} color="#10b981" />
                  </View>
                  <Text style={[styles.rowLabel, styles.discountLabel]}>Discount</Text>
                </View>
                <Text style={styles.discountValue}>− {formatRupee(discount)}</Text>
              </View>
            )}

            {hasTax && (
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, styles.iconBoxAmber]}>
                    <Feather name="percent" size={14} color="#f59e0b" />
                  </View>
                  <Text style={styles.rowLabel}>Tax</Text>
                </View>
                <Text style={styles.rowValue}>{formatRupee(tax)}</Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid</Text>
              <Text style={styles.totalValue}>{formatRupee(totalAmount)}</Text>
            </View>

          </View>

          {/* ── ACTION BUTTONS ── */}
          <View style={styles.actions}>

            <TouchableOpacity
              style={[styles.printBtn, !isPrinterConnected && styles.setupBtn]}
              onPress={onPrint}
              disabled={checkingPrinter}
              activeOpacity={0.85}
            >
              {checkingPrinter ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather
                    name={isPrinterConnected ? "printer" : "bluetooth"}
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.printBtnText}>
                    {isPrinterConnected ? labels.print : labels.setupPrint}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={onNextCustomer}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>{labels.nextCustomer}</Text>
              <Ionicons name="arrow-forward" size={17} color="#6366f1" />
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  /* ── Backdrop ── */
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.75)",
    alignItems: "center",        // ← center horizontally
    justifyContent: "center",    // ← center vertically (was flex-end)
    paddingHorizontal: 20,
  },

  /* ── Main card (was bottom sheet) ── */
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 28,            // fully rounded — all 4 corners
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 18,
  },

  /* ── Close × ── */
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  /* ── Header ── */
  header: {
    alignItems: "center",
    paddingBottom: 20,
  },
  successRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10b981",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  billSuccess: {
    fontSize: 18,
    color: "#090d13",
    fontWeight: "600",
    marginTop: 1,
    letterSpacing: 0.5,
  },

  /* ── Summary card ── */
  summaryCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxGreen: { backgroundColor: "#d1fae5" },
  iconBoxAmber: { backgroundColor: "#fef3c7" },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  discountLabel: { color: "#10b981" },
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  discountValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10b981",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#6366f1",
    letterSpacing: -0.5,
  },

  /* ── Actions ── */
  actions: {
    gap: 10,
  },
  printBtn: {
    backgroundColor: "#112049",
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  setupBtn: { backgroundColor: "#f59e0b" },
  printBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  nextBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  nextBtnText: {
    color: "#6366f1",
    fontSize: 15,
    fontWeight: "800",
  },
});