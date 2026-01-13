import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* 🛠 UTILS & API */
import { getBillById } from "../../constants/bills.api";
import { formatRupee } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { shareBillPdf } from "../../utils/billPdf";
import { printBill } from "../../utils/thermalPrinter";

/* 🛠 PRINTER MANAGEMENT UTILS */
import { 
  isThermalPrinterSaved 
} from "../../utils/printerManager";
import { BluetoothEscposPrinter } from "@vardrz/react-native-bluetooth-escpos-printer";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_VIEW_BILL } from "../../constants/language_viewBill";
import { useLanguage } from "../../providers/LanguageProvider";

export default function ViewBillModal({ billId, onClose }: any) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_VIEW_BILL[language] || LANGUAGE_TEXT_VIEW_BILL.en;

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // PRINTER STATUS STATE
  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [checkingPrinter, setCheckingPrinter] = useState(false);

  /**
   * Check if a printer is saved and actually reachable via Bluetooth
   */
  const checkPrinterStatus = useCallback(async () => {
    setCheckingPrinter(true);
    try {
      const hasSaved = await isThermalPrinterSaved();
      
      if (!hasSaved) {
        setIsPrinterConnected(false);
        return;
      }

      // Verify actual hardware connection with a light command
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      setIsPrinterConnected(true);
    } catch (e) {
      setIsPrinterConnected(false);
    } finally {
      setCheckingPrinter(false);
    }
  }, []);

  /**
   * Action Handler for the Print Button
   */
  const handlePrintPress = async () => {
    if (isPrinterConnected) {
      printBill(bill);
    } else {
      // Close modal and redirect to setup
      onClose();
      router.push("/PrintTest");
    }
  };

  const Row = ({ label, value, bold, danger, highlight, subText }: any) => (
    <View style={styles.rowContainer}>
        <View style={styles.row}>
            <View>
                <Text style={styles.rowLabel}>{label}</Text>
                {subText && <Text style={styles.rowSubText}>{subText}</Text>}
            </View>
            <Text
                style={[
                styles.rowValue,
                bold && styles.boldText,
                danger && { color: "#ef4444" },
                highlight && { color: "#10b981" },
                ]}
            >
                {value}
            </Text>
        </View>
    </View>
  );

  useEffect(() => {
    if (!billId) return;

    async function initialize() {
      setLoading(true);
      try {
        const res = await getBillById(billId);
        setBill(res.data.bill);
        await checkPrinterStatus();
      } catch (e) {
        console.error("Fetch bill error", e);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [billId, checkPrinterStatus]);

  if (!billId) return null;

  // TAX CALCULATION LOGIC
  const calculateTaxSplit = () => {
    if (!bill || !bill.taxPercentage || bill.taxPercentage <= 0) return null;
    
    // Total Tax Amount = (Subtotal * Tax%) / 100
    const totalTax = (bill.subTotal * bill.taxPercentage) / 100;
    const splitPercentage = bill.taxPercentage / 2;
    const splitAmount = totalTax / 2;

    return {
        totalTax,
        splitPercentage,
        splitAmount
    };
  };

  const taxData = calculateTaxSplit();

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.dragIndicator} />

          {/* FIXED HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons
                  name="receipt-text"
                  size={22}
                  color="#4f46e5"
                />
              </View>
              <View>
                <Text style={styles.headerTitle}>{t.invoiceDetails}</Text>
                <Text style={styles.headerSub}>
                  ID: #{bill?.dailyBillNumber || "..."}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text style={styles.loaderText}>{t.loadingBill}</Text>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
                {/* SUMMARY CARD */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>{t.totalPayable}</Text>
                  <Text style={styles.summaryAmount}>
                    {formatRupee(bill.totalAmount)}
                  </Text>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          bill.paymentStatus === "PAID"
                            ? "#dcfce7"
                            : "#fef3c7",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            bill.paymentStatus === "PAID"
                              ? "#22c55e"
                              : "#f59e0b",
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            bill.paymentStatus === "PAID"
                              ? "#166534"
                              : "#92400e",
                        },
                      ]}
                    >
                      {t.status[bill.paymentStatus]}
                    </Text>
                  </View>
                </View>

                {/* INFO GRID */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>{t.issuedOn}</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(bill.createdAt)}
                    </Text>
                    <Text style={styles.infoSub}>
                      {new Date(bill.createdAt).toLocaleTimeString(
                        language === "hi" ? "hi-IN" : "en-US",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </Text>
                  </View>

                  <View style={styles.infoBlockRight}>
                    <Text style={styles.infoLabel}>{t.customer}</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {bill.customerId?.name || t.walkIn}
                    </Text>
                    <Text style={styles.infoSub}>
                      {bill.customerId?.mobileNumber || t.noPhone}
                    </Text>
                  </View>
                </View>

                {/* ITEMS */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t.orderSummary}</Text>
                  <View style={styles.itemsCard}>
                    {bill.items.map((item: any, i: number) => (
                      <View
                        key={i}
                        style={[
                          styles.itemRow,
                          i === bill.items.length - 1 && { borderBottomWidth: 0 },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemSub}>
                            {item.quantity} {item.unit || "unit"} × {formatRupee(item.price)}
                          </Text>
                        </View>
                        <Text style={styles.itemTotal}>
                          {formatRupee(item.total)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* BREAKDOWN CARD */}
                <View style={styles.breakdownCard}>
                  <Row
                    label={t.subtotal}
                    value={formatRupee(bill.subTotal)}
                  />

                  {/* TAX SPLIT SECTION */}
                  {taxData && (
                    <View style={styles.taxContainer}>
                        <Row
                            label="CGST"
                            subText={`@${taxData.splitPercentage}%`}
                            value={formatRupee(taxData.splitAmount)}
                        />
                        <Row
                            label="SGST"
                            subText={`@${taxData.splitPercentage}%`}
                            value={formatRupee(taxData.splitAmount)}
                        />
                    </View>
                  )}

                  {bill.discount > 0 && (
                    <Row
                      label={t.discount}
                      value={`- ${formatRupee(bill.discount)}`}
                      highlight
                    />
                  )}
                  <View style={styles.dashedDivider} />
                  <Row
                    label={t.netTotal}
                    value={formatRupee(bill.totalAmount)}
                    bold
                  />
                  <Row
                    label={t.amountPaid}
                    value={formatRupee(bill.paidAmount)}
                  />
                  {bill.totalAmount - bill.paidAmount > 0 && (
                    <Row
                      label={t.balanceDue}
                      value={formatRupee(bill.totalAmount - bill.paidAmount)}
                      danger
                      bold
                    />
                  )}
                </View>

                {/* PRINTER STATUS MINI-ALERT */}
                {!isPrinterConnected && !loading && (
                   <View style={styles.offlineWarning}>
                      <Ionicons name="warning" size={14} color="#92400e" />
                      <Text style={styles.offlineWarningText}>
                        Printer is currently offline or not setup.
                      </Text>
                   </View>
                )}

                {/* BOTTOM BUFFER */}
                <View style={{ height: insets.bottom + 100 }} />
              </ScrollView>

              {/* FLOATING FOOTER */}
              <View 
                style={[
                  styles.footer, 
                  { 
                    paddingBottom: Math.max(insets.bottom, 20),
                    backgroundColor: "#fff",
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => shareBillPdf(bill)}
                >
                  <Feather name="share" size={18} color="#475569" />
                  <Text style={styles.secondaryBtnText}>{t.share}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    !isPrinterConnected && { backgroundColor: "#f59e0b" }
                  ]}
                  onPress={handlePrintPress}
                  disabled={checkingPrinter}
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
                      <Text style={styles.primaryBtnText}>
                        {isPrinterConnected ? t.print : "Connect"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "94%",
    elevation: 20,
    overflow: 'hidden',
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    backgroundColor: "#f5f3ff",
    padding: 10,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
  },
  headerSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },
  closeBtn: {
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 20,
  },
  loader: {
    padding: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    marginTop: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  summaryCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0f172a",
    marginVertical: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  infoGrid: {
    flexDirection: "row",
    marginBottom: 24,
  },
  infoBlock: { flex: 1 },
  infoBlockRight: { flex: 1, alignItems: "flex-end" },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  infoSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  itemsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  itemSub: {
    fontSize: 12,
    color: "#94a3b8",
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
  },
  breakdownCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  taxContainer: {
    marginVertical: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#e2e8f0',
    paddingLeft: 12,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 8,
  },
  offlineWarningText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  rowContainer: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  rowSubText: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  boldText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0f172a",
  },
  dashedDivider: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    marginVertical: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  primaryBtn: {
    flex: 2,
    backgroundColor: "#4f46e5",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  secondaryBtnText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "700",
  },
});