import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

/* 🛠 UTILS */
import { formatRupee } from "../../utils/formatCurrency";
import { sendWhatsAppMessage } from "../../utils/whatsapp";
import { callCustomer } from "../../utils/call";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_DEBTOR_ROW } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

// Requested Theme Color
const PRIMARY_BLUE = "#1e3a8a";

type Props = {
  customer: any;
  shopName?: string;
  ownerName?: string;
};

export default function DebtorRow({ customer, shopName, ownerName }: Props) {
  const { language } = useLanguage();
  
  // Fallback language logic
  const t = LANGUAGE_TEXT_DEBTOR_ROW[language] || LANGUAGE_TEXT_DEBTOR_ROW.en;

  // SAFETY FALLBACKS: Ensures "Our Store" is only a last resort
  const safeShopName = shopName?.trim() || "Our Store";
  const safeOwnerName = ownerName?.trim() || "";

  const isCredit = customer.totalPending <= 0;
  const amount = Math.abs(customer.totalPending);
  const formattedAmount = formatRupee(amount);

  const isValidMobile =
    customer.mobileNumber && customer.mobileNumber.length >= 10;

  const goToLedger = () => {
    router.push(`/ledger/${customer._id}`);
  };

  return (
    <View style={styles.container}>
      {/* MAIN ROW */}
      <TouchableOpacity 
        style={styles.row} 
        onPress={goToLedger} 
        activeOpacity={0.7}
      >
        <View style={styles.infoCol}>
          <Text style={styles.name} numberOfLines={1}>
            {customer.name}
          </Text>
          <Text
            style={[
              styles.amount,
              { color: isCredit ? "#16a34a" : "#dc2626" },
            ]}
          >
            {isCredit ? "+" : ""}
            {formattedAmount}
          </Text>
        </View>

        <View style={styles.actions}>
          {/* WhatsApp Button */}
          <TouchableOpacity
            disabled={!isValidMobile}
            onPress={() =>
              sendWhatsAppMessage(
                customer.mobileNumber,
                t.whatsappMsg(
                  customer.name, 
                  amount, 
                  safeShopName, 
                  safeOwnerName
                )
              )
            }
            style={[
              styles.iconBtn,
              {
                backgroundColor: isValidMobile ? "#dcfce7" : "#f1f5f9",
              },
            ]}
          >
            <Ionicons
              name="logo-whatsapp"
              size={18}
              color={isValidMobile ? "#16a34a" : "#cbd5e1"}
            />
          </TouchableOpacity>

          {/* Call Button */}
          <TouchableOpacity
            disabled={!isValidMobile}
            onPress={() => callCustomer(customer.mobileNumber)}
            style={[
              styles.iconBtn,
              {
                backgroundColor: isValidMobile ? "#dbeafe" : "#f1f5f9",
              },
            ]}
          >
            <Ionicons
              name="call-outline"
              size={18}
              color={isValidMobile ? PRIMARY_BLUE : "#cbd5e1"}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* VIEW FULL LEDGER LINK */}
      <TouchableOpacity 
        onPress={goToLedger} 
        style={styles.viewLedger} 
        activeOpacity={0.5}
      >
        <Text style={[styles.viewLedgerText, { color: PRIMARY_BLUE }]}>
          {t.viewLedger} →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoCol: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  amount: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  viewLedger: {
    marginTop: 4,
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },
  viewLedgerText: {
    fontSize: 13,
    fontWeight: "700",
  },
});