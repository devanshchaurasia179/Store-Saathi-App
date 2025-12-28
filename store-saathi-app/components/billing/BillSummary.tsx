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
  discount: number; // Now % value (e.g. 10 = 10%)
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
  // Auto-fill paid amount only on first render when total changes
  useEffect(() => {
    if (totalAmount > 0 && paidAmount === 0) {
      setPaidAmount(totalAmount);
    }
  }, [totalAmount]);

  // Calculate discount in rupees
  const discountAmount = (subTotal * discount) / 100;
  const finalTotal = Math.max(subTotal - discountAmount, 0);
  const dueAmount = Math.max(finalTotal - paidAmount, 0);

  return (
    <View style={styles.container}>
      {/* COMPACT INPUTS */}
      <View style={styles.inputRow}>
        {/* Discount % */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="pricetag-outline" size={14} color="#64748b" />
            <Text style={styles.label}>Discount %</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              keyboardType="numeric"
              value={discount > 0 ? String(discount) : ""}
              onChangeText={(v) => setDiscount(Number(v) || 0)}
              placeholder="0"
              style={styles.input}
              selectTextOnFocus
            />
            <Text style={styles.percent}>%</Text>
          </View>
          {discountAmount > 0 && (
            <Text style={styles.discountInfo}>-₹{discountAmount.toFixed(0)}</Text>
          )}
        </View>

        {/* Paid Amount - compact but readable */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="cash-outline" size={14} color="#059669" />
            <Text style={styles.label}>Paid</Text>
          </View>
          <View style={[styles.inputWrapper, styles.paidWrapper]}>
            <TextInput
              keyboardType="numeric"
              value={paidAmount > 0 ? String(paidAmount) : ""}
              onChangeText={(v) => setPaidAmount(Number(v) || 0)}
              placeholder="0"
              style={[styles.input, styles.paidInput]}
              selectTextOnFocus
            />
          </View>
        </View>
      </View>

      {/* SUMMARY */}
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.subLabel}>Subtotal</Text>
          <Text style={styles.subValue}>₹{subTotal.toLocaleString()}</Text>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>₹{finalTotal.toLocaleString()}</Text>
        </View>
      </View>

      {dueAmount > 0 && (
        <Text style={styles.dueText}>Due: ₹{dueAmount.toLocaleString()}</Text>
      )}

      {/* CHECKOUT BUTTON */}
      <TouchableOpacity
        disabled={disabled}
        onPress={onCheckout}
        activeOpacity={0.8}
        style={[styles.checkoutBtn, disabled && styles.disabledBtn]}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },

  inputRow: {
    flexDirection: "row",
    gap: 12,
  },

  inputGroup: {
    flex: 1,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    height: 44, // comfortable but not huge
  },

  paidWrapper: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
  },

  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "right",
    paddingVertical: 0,
  },

  paidInput: {
    fontSize: 18,
    color: "#166534",
  },

  percent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748b",
  },

  discountInfo: {
    fontSize: 11,
    color: "#dc2626",
    fontWeight: "600",
    textAlign: "right",
    marginTop: 4,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  subLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
  },
  subValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },

  totalBox: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2563eb",
  },

  dueText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
    textAlign: "right",
  },

  checkoutBtn: {
    backgroundColor: "#2563eb",
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  checkoutText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.5,
  },

  disabledBtn: {
    backgroundColor: "#e2e8f0",
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: "#94a3b8",
  },
});