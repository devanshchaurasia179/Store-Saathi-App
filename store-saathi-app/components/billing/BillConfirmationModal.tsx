import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatRupee } from "../../utils/formatCurrency";

interface BillItem {
  name: string;
  quantity: number;
  price: number;
}

interface BillConfirmationModalProps {
  visible: boolean;
  items: BillItem[];
  customerName: string;
  subTotal: number;
  discount: number;
  taxPercentage: number;
  totalAmount: number;
  selectedPaymentMode: "CASH" | "UPI" | "OTHERS" | "NONE" | null;
  isProcessing: boolean;
  onClose: () => void;
  onPaymentModeSelect: (mode: "CASH" | "UPI" | "OTHERS") => void;
  onConfirm: () => void;
}

const PaymentCard = ({
  mode,
  label,
  iconName,
  iconColor,
  bgColor,
  selectedMode,
  onSelect,
  isProcessing,
  checkColor,
}: {
  mode: "CASH" | "UPI" | "OTHERS";
  label: string;
  iconName: string;
  iconColor: string;
  bgColor: string;
  selectedMode: string | null;
  onSelect: (m: "CASH" | "UPI" | "OTHERS") => void;
  isProcessing: boolean;
  checkColor: string;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isSelected = selectedMode === mode;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.93,
        useNativeDriver: true,
        speed: 50,
        bounciness: 5,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
    ]).start();
    onSelect(mode);
  };

  return (
    <Animated.View style={[{ flex: 1 }, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.paymentModeCard, isSelected && styles.paymentModeCardSelected]}
        onPress={handlePress}
        disabled={isProcessing}
        activeOpacity={0.85}
      >
        {isSelected && <View style={styles.paymentCardGlow} />}
        <View style={[styles.paymentModeIcon, { backgroundColor: bgColor }]}>
          <MaterialCommunityIcons name={iconName as any} size={26} color={iconColor} />
        </View>
        <Text style={[styles.paymentModeText, isSelected && { color: iconColor, fontWeight: "800" }]}>
          {label}
        </Text>
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: checkColor + "20" }]}>
            <Ionicons name="checkmark" size={12} color={checkColor} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function BillConfirmationModal({
  visible,
  items,
  customerName,
  subTotal,
  discount,
  taxPercentage,
  totalAmount,
  selectedPaymentMode,
  isProcessing,
  onClose,
  onPaymentModeSelect,
  onConfirm,
}: BillConfirmationModalProps) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 200,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(60);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const taxAmount = (subTotal - discount) * (taxPercentage / 100);

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.confirmOverlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.combinedBillBox,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.confirmHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <Ionicons name="receipt-outline" size={18} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.confirmTitle}>Review Bill</Text>
                <Text style={styles.confirmSubtitle}>Verify details before printing</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <View style={styles.closeIconWrap}>
                <Ionicons name="close" size={16} color="#64748b" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.billConfirmItems}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.billConfirmScrollContent}
          >
            {/* Payment Method */}
            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.paymentModesGrid}>
              <PaymentCard
                mode="CASH"
                label="Cash"
                iconName="cash"
                iconColor="#16a34a"
                bgColor="#f0fdf4"
                checkColor="#16a34a"
                selectedMode={selectedPaymentMode}
                onSelect={onPaymentModeSelect}
                isProcessing={isProcessing}
              />
              <PaymentCard
                mode="UPI"
                label="UPI"
                iconName="qrcode-scan"
                iconColor="#2563eb"
                bgColor="#eff6ff"
                checkColor="#2563eb"
                selectedMode={selectedPaymentMode}
                onSelect={onPaymentModeSelect}
                isProcessing={isProcessing}
              />
              <PaymentCard
                mode="OTHERS"
                label="Others"
                iconName="wallet"
                iconColor="#d97706"
                bgColor="#fffbeb"
                checkColor="#d97706"
                selectedMode={selectedPaymentMode}
                onSelect={onPaymentModeSelect}
                isProcessing={isProcessing}
              />
            </View>

            {/* Dashed Receipt Divider */}
            <View style={styles.dashedDivider}>
              <View style={styles.dashedCircleLeft} />
              <View style={styles.dashedLine} />
              <View style={styles.dashedCircleRight} />
            </View>

            {/* Customer Info */}
            <View style={styles.customerInfoCard}>
              <View style={styles.customerAvatar}>
                <Text style={styles.customerAvatarText}>
                  {(customerName || "W")[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.customerInfoText}>
                <Text style={styles.miniLabel}>CUSTOMER</Text>
                <Text style={styles.customerName}>{customerName || "Walk-in Customer"}</Text>
              </View>
              <View style={styles.itemCountBadge}>
                <Text style={styles.itemCountText}>{items.length} items</Text>
              </View>
            </View>

            {/* Items */}
            <Text style={styles.sectionLabel}>Order Summary</Text>
            <View style={styles.itemsContainer}>
              {items.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.billConfirmItem,
                    index === items.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.itemIndexBubble}>
                    <Text style={styles.itemIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.billConfirmItemLeft}>
                    <Text style={styles.billConfirmItemName}>{item.name}</Text>
                    <Text style={styles.billConfirmItemQty}>
                      {item.quantity} × {formatRupee(item.price)}
                    </Text>
                  </View>
                  <Text style={styles.billConfirmItemTotal}>
                    {formatRupee(item.quantity * item.price)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Bill Summary */}
            <View style={styles.billSummaryCard}>
              <View style={styles.billConfirmSummaryRow}>
                <Text style={styles.billConfirmSummaryLabel}>Subtotal</Text>
                <Text style={styles.billConfirmSummaryValue}>{formatRupee(subTotal)}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.billConfirmSummaryRow}>
                  <View style={styles.discountLabelWrap}>
                    <Ionicons name="pricetag" size={12} color="#16a34a" style={{ marginRight: 5 }} />
                    <Text style={[styles.billConfirmSummaryLabel, { color: "#16a34a" }]}>Discount</Text>
                  </View>
                  <Text style={[styles.billConfirmSummaryValue, { color: "#16a34a" }]}>
                    −{formatRupee(discount)}
                  </Text>
                </View>
              )}
              {taxPercentage > 0 && (
                <View style={styles.billConfirmSummaryRow}>
                  <Text style={styles.billConfirmSummaryLabel}>Tax ({taxPercentage}%)</Text>
                  <Text style={styles.billConfirmSummaryValue}>{formatRupee(taxAmount)}</Text>
                </View>
              )}

              {/* Total Row */}
              <View style={styles.totalRowCard}>
                <View>
                  <Text style={styles.totalRowLabel}>Total Amount</Text>
                  <Text style={styles.totalRowSub}>incl. all charges</Text>
                </View>
                <Text style={styles.totalRowValue}>{formatRupee(totalAmount)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.billConfirmActions}>
            <TouchableOpacity
              style={styles.billConfirmEditBtn}
              onPress={onClose}
              disabled={isProcessing}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color="#475569" />
              <Text style={styles.billConfirmEditText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.billConfirmPrintBtn,
                (!selectedPaymentMode || isProcessing) && styles.billConfirmPrintBtnDisabled,
              ]}
              onPress={onConfirm}
              disabled={!selectedPaymentMode || isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.billConfirmPrintText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="print-outline" size={19} color="#fff" />
                  <Text style={styles.billConfirmPrintText}>Create Bill</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 0,
  },
  combinedBillBox: {
    backgroundColor: "#fff",
    width: "100%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "92%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },

  // Header
  confirmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  confirmSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 1,
    fontWeight: "500",
  },
  closeButton: {
    padding: 2,
  },
  closeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll Content
  billConfirmItems: {},
  billConfirmScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
  },

  // Section Labels
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },

  // Payment Cards
  paymentModesGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  paymentModeCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    position: "relative",
    minHeight: 110,
    justifyContent: "center",
    gap: 8,
  },
  paymentCardGlow: {
    position: "absolute",
    inset: 0,
    borderRadius: 14,
    backgroundColor: "rgba(37, 99, 235, 0.04)",
  },
  paymentModeCardSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#fafcff",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  paymentModeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentModeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: -0.1,
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  // Dashed Divider (receipt-style)
  dashedDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dashedCircleLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(2,6,23,0.72)",
    marginLeft: -20,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    marginHorizontal: 6,
  },
  dashedCircleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(2,6,23,0.72)",
    marginRight: -20,
  },

  // Customer Card
  customerInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e8edf3",
    gap: 12,
  },
  customerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  customerAvatarText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
  },
  customerInfoText: {
    flex: 1,
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  itemCountBadge: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3730a3",
  },

  // Items List
  itemsContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e8edf3",
    marginBottom: 16,
    overflow: "hidden",
  },
  billConfirmItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    gap: 10,
  },
  itemIndexBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  itemIndexText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },
  billConfirmItemLeft: {
    flex: 1,
  },
  billConfirmItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 3,
    lineHeight: 18,
  },
  billConfirmItemQty: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  billConfirmItemTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2563eb",
  },

  // Bill Summary
  billSummaryCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8edf3",
    gap: 0,
  },
  billConfirmSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  discountLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  billConfirmSummaryLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  billConfirmSummaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  totalRowCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#1e40af",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  totalRowLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
  totalRowSub: {
    fontSize: 10,
    color: "#93c5fd",
    fontWeight: "500",
    marginTop: 1,
  },
  totalRowValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },

  // Action Buttons
  billConfirmActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#fafbfc",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  billConfirmEditBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    gap: 6,
  },
  billConfirmEditText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
  },
  billConfirmPrintBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: "#2563eb",
    gap: 8,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  billConfirmPrintBtnDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0,
    elevation: 0,
  },
  billConfirmPrintText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
});