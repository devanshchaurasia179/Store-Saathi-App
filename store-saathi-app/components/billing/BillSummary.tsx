import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { formatRupee } from "../../utils/formatCurrency";
import { LANGUAGE_TEXT_BILL_SUMMARY } from "../../constants/language_billing";
import { useLanguage } from "../../providers/LanguageProvider";

type Props = {
  subTotal: number;
  discount: number;
  setDiscount: (v: number) => void;
  taxPercentage: number;
  setTaxPercentage: (v: number) => void;
  paidAmount: number;
  setPaidAmount: (v: number) => void;
  totalAmount: number;
  onCheckout: () => Promise<void> | void;
  disabled?: boolean;
};

type DiscountMode = "flat" | "percent";

const PRIMARY_BLUE = "#1e3a8a";
const SUCCESS_GREEN = "#059669";
const GST_OPTIONS = [0, 5, 12, 18, 28];

export default function BillSummary({
  subTotal,
  discount,
  setDiscount,
  taxPercentage,
  setTaxPercentage,
  paidAmount,
  setPaidAmount,
  totalAmount,
  onCheckout,
  disabled = false,
}: Props) {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_BILL_SUMMARY[language] || LANGUAGE_TEXT_BILL_SUMMARY.en;

  const [discountMode, setDiscountMode] = useState<DiscountMode>("flat");
  const [isManualGst, setIsManualGst] = useState(false);

  const [internalDiscount, setInternalDiscount] = useState("");
  const [internalPaid, setInternalPaid] = useState("");
  const [internalTax, setInternalTax] = useState("");

  // Sync internal display values when parent props change
  useEffect(() => {
    if (discountMode === "flat") {
      setInternalDiscount(
        discount > 0 ? discount.toFixed(2).replace(/\.?0+$/, "") : ""
      );
    }

    setInternalTax(
      taxPercentage > 0
        ? taxPercentage.toFixed(2).replace(/\.?0+$/, "")
        : ""
    );

    // Show paid amount nicely — remove trailing .00 when whole number
    if (paidAmount > 0) {
      const str =
        paidAmount % 1 === 0
          ? Math.round(paidAmount).toString()
          : paidAmount.toFixed(2);
      setInternalPaid(str);
    } else {
      setInternalPaid("");
    }
  }, [discount, taxPercentage, paidAmount, discountMode]);

  // Auto-fill paid amount when total changes (convenience for the user)
  useEffect(() => {
    if (totalAmount > 0 && (paidAmount === 0 || paidAmount === totalAmount)) {
      setPaidAmount(totalAmount);

      const display =
        totalAmount % 1 === 0
          ? Math.round(totalAmount).toString()
          : totalAmount.toFixed(2);

      setInternalPaid(display);
    }
  }, [totalAmount]);

  const handleDiscountChange = useCallback(
    (text: string) => {
      let clean = text.replace(/[^0-9.]/g, "");
      const parts = clean.split(".");
      if (parts.length > 2) {
        clean = parts[0] + "." + parts.slice(1).join("");
      }
      if (parts[1] && parts[1].length > 2) {
        clean = parts[0] + "." + parts[1].slice(0, 2);
      }

      setInternalDiscount(clean);

      const val = parseFloat(clean) || 0;
      if (discountMode === "percent") {
        const perc = Math.min(val, 100);
        setDiscount((subTotal * perc) / 100);
      } else {
        setDiscount(Math.min(val, subTotal));
      }
    },
    [discountMode, subTotal, setDiscount]
  );

  const toggleDiscountMode = () => {
    const nextMode = discountMode === "flat" ? "percent" : "flat";
    setDiscountMode(nextMode);
    setInternalDiscount("");
    setDiscount(0);
  };

  const handleGstSelect = (val: number) => {
    setIsManualGst(false);
    setTaxPercentage(val);
    setInternalTax(val.toString());
  };

  const handleManualTaxChange = (text: string) => {
    let clean = text.replace(/[^0-9.]/g, "");
    const parts = clean.split(".");
    if (parts.length > 2) {
      clean = parts[0] + "." + parts.slice(1).join("");
    }
    if (parts[1] && parts[1].length > 2) {
      clean = parts[0] + "." + parts[1].slice(0, 2);
    }

    const val = Math.min(parseFloat(clean) || 0, 100);
    setInternalTax(clean);
    setTaxPercentage(val);
  };

  const handlePaidChange = (text: string) => {
    let clean = text.replace(/[^0-9.]/g, "");

    // Prevent multiple dots
    const parts = clean.split(".");
    if (parts.length > 2) {
      clean = parts[0] + "." + parts.slice(1).join("");
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      clean = parts[0] + "." + parts[1].slice(0, 2);
    }

    setInternalPaid(clean);

    const numericValue = parseFloat(clean) || 0;
    setPaidAmount(numericValue);
  };

  const due = Math.max(0, totalAmount - paidAmount);
  const change = Math.max(0, paidAmount - totalAmount);

  return (
    <View style={styles.container}>
      {/* Mini Badges for Due/Change - Moved up to save vertical space */}
      {(due > 0 || change > 0) && (
        <View style={styles.dueChangeRow}>
          {due > 0 && (
            <View style={[styles.badge, styles.dueBadge]}>
              <Text style={[styles.badgeText, { color: "#b91c1c" }]}>
                {t.due}: {formatRupee(due)}
              </Text>
            </View>
          )}
          {change > 0 && (
            <View style={[styles.badge, styles.changeBadge]}>
              <Text style={[styles.badgeText, { color: SUCCESS_GREEN }]}>
                {t.change}: {formatRupee(change)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Inputs Row */}
      <View style={styles.inputRow}>
        <View style={styles.miniCard}>
          <View style={styles.miniHeader}>
            <Text style={styles.miniLabel}>{t.discount}</Text>
            <TouchableOpacity onPress={toggleDiscountMode} style={styles.togglePill}>
              <Text style={styles.toggleText}>
                {discountMode === "percent" ? "%" : "₹"}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.compactInput}
            keyboardType="decimal-pad"
            placeholder="0"
            value={internalDiscount}
            onChangeText={handleDiscountChange}
            editable={!disabled}
          />
        </View>

        <View style={[styles.miniCard, { flex: 1.5 }]}>
          <Text style={styles.miniLabel}>GST %</Text>
          {isManualGst ? (
            <View style={styles.manualGstBox}>
              <TextInput
                style={styles.manualInput}
                keyboardType="decimal-pad"
                value={internalTax}
                onChangeText={handleManualTaxChange}
                autoFocus
                editable={!disabled}
              />
              <TouchableOpacity onPress={() => setIsManualGst(false)}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gstScroll}
            >
              {GST_OPTIONS.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.gstChip,
                    taxPercentage === val && styles.activeGstChip,
                    disabled && styles.disabledChip,
                  ]}
                  onPress={() => !disabled && handleGstSelect(val)}
                >
                  <Text
                    style={[
                      styles.gstChipText,
                      taxPercentage === val && styles.activeGstChipText,
                    ]}
                  >
                    {val}%
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.gstChip}
                onPress={() => !disabled && setIsManualGst(true)}
              >
                <Ionicons name="create-outline" size={14} color="#64748b" />
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Final Summary Bar */}
      <View style={styles.darkSummaryBar}>
        <View style={styles.totalBlock}>
          <Text style={styles.darkLabel}>{t.total}</Text>
          <Text style={styles.totalDisplay}>{formatRupee(totalAmount)}</Text>
        </View>

        <View style={styles.receivedBlock}>
          <View style={styles.receivedHeader}>
            <Text style={styles.receivedLabel}>{t.received}</Text>
            <MaterialCommunityIcons name="cash-check" size={12} color={SUCCESS_GREEN} />
          </View>
          <View style={styles.receivedInputWrapper}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.receivedInput}
              keyboardType="decimal-pad"
              value={internalPaid}
              onChangeText={handlePaidChange}
              editable={!disabled}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.3)"
              returnKeyType="done"
            />
          </View>
        </View>
      </View>

      {/* Checkout Button */}
      <TouchableOpacity
        style={[styles.checkoutBtn, disabled && styles.checkoutBtnDisabled]}
        onPress={onCheckout}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text style={styles.checkoutText}>
          {disabled ? t.cartEmpty : t.completeBill}
        </Text>
        {!disabled && <Ionicons name="arrow-forward" size={18} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingTop: 4,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    gap: 8,
    maxHeight: 280,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 4,
  },
  miniCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  miniHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
  },
  togglePill: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PRIMARY_BLUE,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: "900",
    color: PRIMARY_BLUE,
  },
  compactInput: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    paddingVertical: 0,
  },
  gstScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gstChip: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    minWidth: 40,
    alignItems: "center",
  },
  activeGstChip: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },
  disabledChip: {
    opacity: 0.5,
  },
  gstChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  activeGstChipText: {
    color: "#ffffff",
  },
  manualGstBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  manualInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: PRIMARY_BLUE,
    borderBottomWidth: 1,
    borderColor: PRIMARY_BLUE,
    padding: 0,
  },
  darkSummaryBar: {
    flexDirection: "row",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 4,
  },
  totalBlock: {
    flex: 1,
  },
  darkLabel: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "700",
  },
  totalDisplay: {
    fontSize: 22,
    fontWeight: "900",
    color: "#ffffff",
  },
  receivedBlock: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    padding: 6,
    width: "45%",
  },
  receivedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receivedLabel: {
    fontSize: 9,
    color: SUCCESS_GREEN,
    fontWeight: "800",
  },
  receivedInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencyPrefix: {
    color: SUCCESS_GREEN,
    fontSize: 16,
    fontWeight: "800",
    marginRight: 2,
  },
  receivedInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    padding: 0,
    textAlign: "right",
  },
  dueChangeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dueBadge: { backgroundColor: "#fee2e2" },
  changeBadge: { backgroundColor: "#d1fae5" },
  badgeText: { fontSize: 11, fontWeight: "800" },
  checkoutBtn: {
    backgroundColor: PRIMARY_BLUE,
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 4,
  },
  checkoutBtnDisabled: {
    backgroundColor: "#cbd5e1",
  },
  checkoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});