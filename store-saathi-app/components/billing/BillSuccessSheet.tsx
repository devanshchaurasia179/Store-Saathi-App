import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatRupee } from "../../utils/formatCurrency";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type BillSuccessSheetProps = {
  visible: boolean;
  onClose: () => void;
  billId: string | null;
  items: any[];         // Added: current bill items
  totalAmount: number;  // Added: final bill total
  isPrinterConnected: boolean;
  checkingPrinter: boolean;
  onPrint: () => void;
  onNextCustomer: () => void;
  labels: {
    paymentReceived: string;
    print: string;
    setupPrint: string;
    nextCustomer: string;
    itemsBought: string;
    total: string;
  };
};

export default function BillSuccessSheet({
  visible,
  onClose,
  billId,
  items,
  totalAmount,
  isPrinterConnected,
  checkingPrinter,
  onPrint,
  onNextCustomer,
  labels,
}: BillSuccessSheetProps) {
  const insets = useSafeAreaInsets();

  if (!billId) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.dragIndicator} />

          {/* SUCCESS STATUS */}
          <View style={styles.topSection}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.successTitle}>{labels.paymentReceived}</Text>
          </View>

          {/* MINI BILL COMPONENT */}
          <View style={styles.miniBill}>
            <View style={styles.billHeader}>
              <Text style={styles.billLabel}>{labels.itemsBought}</Text>
              <Text style={styles.itemCount}>{items.length} Items</Text>
            </View>

            <ScrollView 
              style={styles.itemsList} 
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {items.map((item, index) => (
                <View key={`${item.productId}-${item.variantId ?? 'no-variant'}-${index}`}>
                  <View style={styles.itemMain}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemDetails}>
                      {item.quantity} {item.unit || 'unit'} × {formatRupee(item.price)}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    {formatRupee(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.billFooter}>
              <Text style={styles.totalLabel}>{labels.total}</Text>
              <Text style={styles.totalValue}>{formatRupee(totalAmount)}</Text>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.printBtn,
                !isPrinterConnected && styles.setupBtn
              ]}
              onPress={onPrint}
              disabled={checkingPrinter}
            >
              {checkingPrinter ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather 
                    name={isPrinterConnected ? "printer" : "bluetooth"} 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.printBtnText}>
                    {isPrinterConnected ? labels.print : labels.setupPrint}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextBtn} onPress={onNextCustomer}>
              <Text style={styles.nextBtnText}>{labels.nextCustomer}</Text>
              <Ionicons name="arrow-forward" size={18} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: SCREEN_HEIGHT * 0.8,
    paddingHorizontal: 24,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  topSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#10b981",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
  },
  miniBill: {
    backgroundColor: "#f8fafc",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 10,
  },
  billLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemsList: {
    maxHeight: SCREEN_HEIGHT * 0.22,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemMain: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  itemDetails: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
  },
  billFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#475569",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2563eb",
  },
  actionContainer: {
    marginTop: 24,
    gap: 12,
  },
  printBtn: {
    backgroundColor: "#0f172a",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  setupBtn: {
    backgroundColor: "#f59e0b",
  },
  printBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  nextBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  nextBtnText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "800",
  },
});