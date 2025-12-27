import React from "react";
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
  const dueAmount = Math.max(totalAmount - paidAmount, 0);

  return (
    <View style={styles.container}>
      {/* INPUTS */}
      <View style={styles.grid}>
        {/* Discount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons
              name="pricetag-outline"
              size={12}
              color="#2563eb"
            />{" "}
            Discount (₹)
          </Text>
          <TextInput
            keyboardType="numeric"
            placeholder="0"
            value={discount ? String(discount) : ""}
            onChangeText={(v) => setDiscount(Number(v) || 0)}
            style={styles.input}
          />
        </View>

        {/* Paid Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons
              name="wallet-outline"
              size={12}
              color="#2563eb"
            />{" "}
            Paid Amount (₹)
          </Text>
          <TextInput
            keyboardType="numeric"
            placeholder="0"
            value={paidAmount ? String(paidAmount) : ""}
            onChangeText={(v) => setPaidAmount(Number(v) || 0)}
            style={styles.input}
          />
        </View>
      </View>

      {/* TOTALS */}
      <View style={styles.summaryBox}>
        <View style={styles.row}>
          <Text style={styles.subLabel}>Subtotal</Text>
          <Text style={styles.subValue}>
            ₹{subTotal.toLocaleString()}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Total Amount
          </Text>
          <Text style={styles.totalValue}>
            ₹{totalAmount.toLocaleString()}
          </Text>
        </View>

        {dueAmount > 0 && (
          <View style={styles.dueRow}>
            <Text style={styles.dueLabel}>
              Balance Due
            </Text>
            <Text style={styles.dueValue}>
              ₹{dueAmount.toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* CHECKOUT */}
      <TouchableOpacity
        disabled={disabled}
        onPress={onCheckout}
        activeOpacity={0.85}
        style={[
          styles.checkoutBtn,
          disabled && styles.disabledBtn,
        ]}
      >
        <Text
          style={[
            styles.checkoutText,
            disabled && styles.disabledText,
          ]}
        >
          COMPLETE CHECKOUT
        </Text>

        {!disabled && (
          <Ionicons
            name="arrow-forward"
            size={18}
            color="#fff"
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  grid: {
    flexDirection: "row",
    gap: 12,
  },

  inputGroup: {
    flex: 1,
  },

  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontWeight: "600",
  },

  summaryBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    gap: 8,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  subLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },

  subValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  totalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
  },

  totalValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2563eb",
  },

  dueRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dueLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fb7185",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  dueValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#e11d48",
  },

  checkoutBtn: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  checkoutText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 2,
  },

  disabledBtn: {
    backgroundColor: "#e5e7eb",
  },

  disabledText: {
    color: "#94a3b8",
  },
});
