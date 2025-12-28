import React, { useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  subTotal: number;
  discount: number;
  setDiscount: (v: number) => void;
  paidAmount: number;
  setPaidAmount: (v: number) => void;
  totalAmount: number;
  onCheckout: () => Promise<void> | void;
  disabled?: boolean;
};

export default function BillSummary({
  subTotal,
  discount,
  setDiscount,
  paidAmount,
  setPaidAmount,
  totalAmount,
  onCheckout,
  disabled = false,
}: Props) {
  
  // Requirement: Paid Amount should default to Total Amount
  useEffect(() => {
    if (totalAmount > 0) {
      setPaidAmount(totalAmount);
    }
  }, [totalAmount]);

  const dueAmount = Math.max(totalAmount - paidAmount, 0);

  return (
    <View style={styles.container}>
      {/* COMPACT INPUT SECTION */}
      <View style={styles.inputGrid}>
        <View style={styles.compactInputGroup}>
          <Ionicons name="pricetag-outline" size={12} color="#64748b" />
          <Text style={styles.compactLabel}>Discount</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="0"
            value={discount ? String(discount) : ""}
            onChangeText={(v) => setDiscount(Number(v) || 0)}
            style={styles.compactInput}
            selectTextOnFocus
          />
        </View>

        <View style={styles.compactInputGroup}>
          <Ionicons name="cash-outline" size={12} color="#64748b" />
          <Text style={styles.compactLabel}>Received</Text>
          <TextInput
            keyboardType="numeric"
            placeholder="0"
            value={paidAmount ? String(paidAmount) : ""}
            onChangeText={(v) => setPaidAmount(Number(v) || 0)}
            style={[styles.compactInput, { color: '#059669' }]}
            selectTextOnFocus
          />
        </View>
      </View>

      {/* COMPACT SUMMARY BOX */}
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.subText}>Subtotal: ₹{subTotal}</Text>
          {dueAmount > 0 && (
            <Text style={styles.dueText}>Due: ₹{dueAmount}</Text>
          )}
        </View>
        
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>₹{totalAmount.toLocaleString()}</Text>
        </View>
      </View>

      {/* SLIM CHECKOUT BUTTON */}
      <TouchableOpacity
        disabled={disabled}
        onPress={onCheckout}
        activeOpacity={0.8}
        style={[
          styles.checkoutBtn,
          disabled && styles.disabledBtn,
        ]}
      >
        <Text style={[styles.checkoutText, disabled && styles.disabledText]}>
          {disabled ? "CART EMPTY" : "COMPLETE BILL"}
        </Text>
        {!disabled && <Ionicons name="chevron-forward" size={16} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    gap: 10,
  },

  inputGrid: {
    flexDirection: "row",
    gap: 8,
  },

  compactInputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38, // Reduced height
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  compactLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    marginLeft: 4,
    marginRight: 8,
  },

  compactInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: 'right',
    paddingVertical: 0,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  subText: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },

  dueText: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "700",
    marginTop: 2,
  },

  totalContainer: {
    alignItems: 'flex-end',
  },

  totalLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
  },

  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2563eb",
  },

  checkoutBtn: {
    backgroundColor: "#2563eb",
    height: 48, // Slimmer button
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },

  checkoutText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 1,
  },

  disabledBtn: {
    backgroundColor: "#f1f5f9",
    elevation: 0,
    shadowOpacity: 0,
  },

  disabledText: {
    color: "#cbd5e1",
  },
});