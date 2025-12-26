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
  onCheckout: () => Promise<void>;
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
  disabled,
}: Props) {
  const dueAmount = totalAmount - paidAmount;

  return (
    <View style={styles.container}>
      {/* INPUTS */}
      <View style={styles.grid}>
        {/* Discount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="pricetag-outline" size={12} /> Discount (₹)
          </Text>
          <TextInput
            value={discount ? String(discount) : ""}
            onChangeText={(v) => setDiscount(Number(v) || 0)}
            keyboardType="numeric"
            placeholder="0"
            style={styles.input}
          />
        </View>

        {/* Paid */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            <Ionicons name="wallet-outline" size={12} /> Paid Amount (₹)
          </Text>
          <TextInput
            value={paidAmount ? String(paidAmount) : ""}
            onChangeText={(v) => setPaidAmount(Number(v) || 0)}
            keyboardType="numeric"
            placeholder="0"
            style={styles.input}
          />
        </View>
      </View>

      {/* TOTALS */}
      <View style={styles.summaryBox}>
        <Row label="Subtotal" value={`₹${subTotal}`} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{totalAmount}</Text>
        </View>

        {dueAmount > 0 && (
          <Row
            label="Balance Due"
            value={`₹${dueAmount}`}
            danger
          />
        )}
      </View>

      {/* CHECKOUT */}
      <TouchableOpacity
        disabled={disabled}
        onPress={onCheckout}
        style={[
          styles.checkoutBtn,
          disabled && styles.disabledBtn,
        ]}
      >
        <Text style={styles.checkoutText}>
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

const Row = ({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) => (
  <View style={styles.row}>
    <Text
      style={[
        styles.rowLabel,
        danger && { color: "#e11d48" },
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        styles.rowValue,
        danger && { color: "#e11d48" },
      ]}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 10,
    fontWeight: "600",
  },
  summaryBox: {
    marginTop: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rowLabel: {
    color: "#475569",
    fontWeight: "500",
  },
  rowValue: {
    fontWeight: "700",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#2563eb",
  },
  checkoutBtn: {
    marginTop: 14,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  checkoutText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 1,
  },
  disabledBtn: {
    backgroundColor: "#cbd5f5",
  },
});
