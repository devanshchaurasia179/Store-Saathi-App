import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { formatRupee } from "../../utils/formatCurrency";
import { LANGUAGE_TEXT_BILL_SUMMARY } from "../../constants/language_billing";
import { useLanguage } from "../../providers/LanguageProvider";

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

type DiscountMode = "flat" | "percent";

const PRIMARY_BLUE = "#1e3a8a";

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
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_BILL_SUMMARY[language] || LANGUAGE_TEXT_BILL_SUMMARY.en;

  const [discountMode, setDiscountMode] = useState<DiscountMode>("flat");
  const [isCreating, setIsCreating] = useState(false);

  const [internalDiscount, setInternalDiscount] = useState("");
  const [internalPaid, setInternalPaid] = useState("");

  useEffect(() => {
    if (totalAmount >= 0) {
      setPaidAmount(totalAmount);
      setInternalPaid(totalAmount > 0 ? String(totalAmount) : "");
    }
  }, [totalAmount]);

  const handleDiscountChange = (text: string) => {
    const cleanText = text.replace(/[^0-9.]/g, "");
    setInternalDiscount(cleanText);
    
    const value = parseFloat(cleanText) || 0;
    if (discountMode === "percent") {
      setDiscount(Math.round((subTotal * Math.min(value, 100)) / 100));
    } else {
      setDiscount(Math.min(value, subTotal));
    }
  };

  const handlePaidChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    setInternalPaid(cleanText);
    setPaidAmount(Number(cleanText) || 0);
  };

  const toggleDiscountMode = () => {
    setDiscountMode((prev) => (prev === "flat" ? "percent" : "flat"));
    setInternalDiscount("");
    setDiscount(0);
  };

  // ✅ HANDLER TO PREVENT MULTIPLE BILLS
  const handlePress = async () => {
    if (isCreating || disabled) return;

    try {
      setIsCreating(true);
      await onCheckout();
      // Note: Usually router.replace follows in the parent, 
      // so we don't necessarily set isCreating to false here 
      // unless the process fails or stays on the same page.
    } catch (error) {
      console.error("Checkout Error:", error);
      setIsCreating(false); // Re-enable button on error
    }
  };

  const dueAmount = Math.max(totalAmount - paidAmount, 0);

  return (
    <View style={styles.container}>
      {/* 1. INPUT SECTION */}
      <View style={styles.inputGrid}>
        {/* Discount Box */}
        <View style={styles.cardInput}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>{t.discount}</Text>
            <TouchableOpacity onPress={toggleDiscountMode} style={styles.pillToggle}>
              <Text style={styles.pillText}>{discountMode === "percent" ? "%" : "₹"}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#94a3b8"
            value={internalDiscount}
            onChangeText={handleDiscountChange}
            style={styles.mainInput}
          />
        </View>

        {/* Received Box */}
        <View style={[styles.cardInput, styles.paidBorder]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: "#059669" }]}>{t.received}</Text>
            <MaterialCommunityIcons name="cash-multiple" size={14} color="#059669" />
          </View>
          <View style={styles.row}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#94a3b8"
              value={internalPaid}
              onChangeText={handlePaidChange}
              style={[styles.mainInput, { color: "#059669" }]}
            />
          </View>
        </View>
      </View>

      {/* 2. STATS BAR */}
      <View style={styles.summaryBar}>
        <View style={styles.leftStats}>
          <Text style={styles.subtotalText}>{t.subtotal}: {formatRupee(subTotal)}</Text>
          {discount > 0 && (
            <Text style={styles.discountBadge}>-{formatRupee(discount)}</Text>
          )}
        </View>
        
        <View style={styles.rightStats}>
          <Text style={styles.totalLabel}>{t.total.toUpperCase()}</Text>
          <Text style={styles.totalValue}>{formatRupee(totalAmount)}</Text>
          {dueAmount > 0 && (
            <View style={styles.dueTag}>
              <Text style={styles.dueText}>{t.due}: {formatRupee(dueAmount)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 3. ACTION BUTTON (ENHANCED) */}
      <TouchableOpacity
        disabled={disabled || isCreating}
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.checkoutBtn, 
          (disabled || isCreating) && styles.disabledBtn
        ]}
      >
        {isCreating ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.checkoutText}>Processing...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.checkoutText}>
              {disabled ? t.cartEmpty : t.completeBill}
            </Text>
            {!disabled && <Ionicons name="arrow-forward" size={20} color="#fff" />}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingTop: 12,
    gap: 16,
  },
  inputGrid: {
    flexDirection: "row",
    gap: 12,
  },
  cardInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  paidBorder: {
    borderColor: "#bcf0da",
    backgroundColor: "#f0fdf4",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pillToggle: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY_BLUE, // Using Enhanced Blue
  },
  pillText: {
    fontSize: 12,
    fontWeight: "900",
    color: PRIMARY_BLUE, // Using Enhanced Blue
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
    marginRight: 2,
  },
  mainInput: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    padding: 0,
    minHeight: 30,
  },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  leftStats: {
    gap: 4,
  },
  subtotalText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },
  discountBadge: {
    fontSize: 12,
    color: "#d97706",
    fontWeight: "700",
    backgroundColor: "#fffbeb",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  rightStats: {
    alignItems: "flex-end",
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
  },
  totalValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
  },
  dueTag: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  dueText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "800",
  },
  checkoutBtn: {
    backgroundColor: PRIMARY_BLUE, // Enhanced Blue
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: PRIMARY_BLUE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  loadingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  disabledBtn: {
    backgroundColor: "#e2e8f0",
    elevation: 0,
  },
  checkoutText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
});