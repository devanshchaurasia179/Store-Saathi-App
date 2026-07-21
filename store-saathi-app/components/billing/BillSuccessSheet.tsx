import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatRupee } from "../../utils/formatCurrency";
import { reconnectSavedPrinter, isThermalPrinterSaved, getConnectedThermalPrinter } from "../../utils/printerManager";
import { getBillById } from "../../constants/bills.api";
import { printBillAuto } from "../../utils/thermalPrinter";

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
  const [isConnecting, setIsConnecting] = useState(false);
  const [printerName, setPrinterName] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      getConnectedThermalPrinter().then((printer) => {
        setPrinterName(printer?.name || null);
      });
    }
  }, [visible]);

  if (!billId) return null;

  const hasDiscount = discount > 0;
  const hasTax = tax > 0;

  const handleConnectAndPrint = async () => {
    setIsConnecting(true);
    try {
      const hasSaved = await isThermalPrinterSaved();
      if (!hasSaved) {
        Alert.alert("No Printer", "No saved printer found. Please set up a printer first.");
        setIsConnecting(false);
        return;
      }

      const connected = await reconnectSavedPrinter();
      if (!connected) {
        Alert.alert(
          "Connection Failed",
          "Could not connect to printer. Make sure it's powered on and in range."
        );
        setIsConnecting(false);
        return;
      }

      // Connected — now print
      const billRes = await getBillById(billId);
      if (billRes.data?.bill) {
        await printBillAuto(billRes.data.bill);
      }
    } catch (err: any) {
      Alert.alert("Print Failed", err?.message || "Unable to print. Try again.");
    } finally {
      setIsConnecting(false);
    }
  };

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

            {/* Printer info */}
            {printerName && (
              <View style={styles.printerInfo}>
                <Feather name="printer" size={14} color={isPrinterConnected ? "#16a34a" : "#94a3b8"} />
                <Text style={[styles.printerNameText, isPrinterConnected && styles.printerNameConnected]}>
                  {printerName}
                </Text>
                <View style={[styles.printerDot, isPrinterConnected && styles.printerDotConnected]} />
              </View>
            )}

            {isPrinterConnected ? (
              /* Printer is connected — show Print button */
              <TouchableOpacity
                style={styles.printBtn}
                onPress={onPrint}
                disabled={checkingPrinter}
                activeOpacity={0.85}
              >
                {checkingPrinter ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Feather name="printer" size={18} color="#fff" />
                    <Text style={styles.printBtnText}>{labels.print}</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              /* Printer not connected — show Connect & Print button */
              <TouchableOpacity
                style={[styles.printBtn, styles.connectBtn]}
                onPress={handleConnectAndPrint}
                disabled={isConnecting}
                activeOpacity={0.85}
              >
                {isConnecting ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.printBtnText}>Connecting...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="bluetooth" size={18} color="#fff" />
                    <Text style={styles.printBtnText}>Connect & Print</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  /* ── Main card ── */
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 28,
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
  printerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  printerNameText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  printerNameConnected: {
    color: "#16a34a",
  },
  printerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#cbd5e1",
  },
  printerDotConnected: {
    backgroundColor: "#22c55e",
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
  connectBtn: {
    backgroundColor: "#2563eb",
  },
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
