import React, { useEffect, useState } from "react";
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

import { getBillById } from "../../constants/bills.api";
import { formatRupee } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { shareBillPdf } from "../../utils/billPdf";
import { printBillPdf58mm } from "../../utils/PrintBillPdf";

export default function ViewBillModal({ billId, onClose }: any) {
  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper for sharing the bill (text share)
  const onShare = async () => {
    try {
      await Share.share({
        message: `Bill Summary for ID: #${bill?.dailyBillNumber}
Total: ${formatRupee(bill?.totalAmount)}
Status: ${bill?.paymentStatus}`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const Row = ({ label, value, bold, danger, highlight }: any) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
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
  );

  useEffect(() => {
    if (!billId) return;

    async function fetchBill() {
      try {
        const res = await getBillById(billId);
        setBill(res.data.bill);
      } catch (e) {
        console.error("Fetch bill error", e);
      } finally {
        setLoading(false);
      }
    }

    fetchBill();
  }, [billId]);

  if (!billId) return null;

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* DRAG INDICATOR */}
          <View style={styles.dragIndicator} />

          {/* HEADER */}
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
                <Text style={styles.headerTitle}>Invoice Details</Text>
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
              <Text style={styles.loaderText}>Loading Bill...</Text>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
                {/* SUMMARY CARD */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Payable</Text>
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
                      {bill.paymentStatus}
                    </Text>
                  </View>
                </View>

                {/* INFO GRID */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoLabel}>Issued On</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(bill.createdAt)}
                    </Text>
                    <Text style={styles.infoSub}>
                      {new Date(bill.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>

                  <View style={styles.infoBlockRight}>
                    <Text style={styles.infoLabel}>Customer</Text>
                    <Text
                      style={styles.infoValue}
                      numberOfLines={1}
                    >
                      {bill.customerId?.name || "Walk-in Guest"}
                    </Text>
                    <Text style={styles.infoSub}>
                      {bill.customerId?.mobileNumber || "No Phone"}
                    </Text>
                  </View>
                </View>

                {/* ITEMS */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Order Summary</Text>
                  <View style={styles.itemsCard}>
                    {bill.items.map((item: any, i: number) => (
                      <View
                        key={i}
                        style={[
                          styles.itemRow,
                          i === bill.items.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemSub}>
                            {item.quantity} units ×{" "}
                            {formatRupee(item.price)}
                          </Text>
                        </View>
                        <Text style={styles.itemTotal}>
                          {formatRupee(item.total)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* BREAKDOWN */}
                <View style={styles.breakdownCard}>
                  <Row
                    label="Subtotal"
                    value={formatRupee(bill.subTotal)}
                  />
                  {bill.discount > 0 && (
                    <Row
                      label="Discount"
                      value={`- ${formatRupee(bill.discount)}`}
                      highlight
                    />
                  )}
                  <View style={styles.dashedDivider} />
                  <Row
                    label="Net Total"
                    value={formatRupee(bill.totalAmount)}
                    bold
                  />
                  <Row
                    label="Amount Paid"
                    value={formatRupee(bill.paidAmount)}
                  />
                  {bill.totalAmount - bill.paidAmount > 0 && (
                    <Row
                      label="Balance Due"
                      value={formatRupee(
                        bill.totalAmount - bill.paidAmount
                      )}
                      danger
                      bold
                    />
                  )}
                </View>
              </ScrollView>

              {/* FOOTER */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => shareBillPdf(bill)}
                >
                  <Feather name="share" size={18} color="#475569" />
                  <Text style={styles.secondaryBtnText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => printBillPdf58mm(bill)}
                >
                  <Feather name="printer" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Print Bill</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */

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
    padding: 60,
    alignItems: "center",
  },
  loaderText: {
    marginTop: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  content: {
    padding: 20,
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
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
    flexDirection: "row",
    padding: 20,
    paddingBottom: 34,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
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
