import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { formatRupee } from "../../utils/formatCurrency";
import { sendWhatsAppMessage } from "../../utils/whatsapp";
import { callCustomer } from "../../utils/call";

export default function DebtorRow({ customer }: any) {
  const isCredit = customer.totalPending <= 0;
  const amount = Math.abs(customer.totalPending);

  const isValidMobile =
    customer.mobileNumber && customer.mobileNumber.length >= 10;

  const goToLedger = () => {
    router.push(`/ledger/${customer._id}`);
  };

  return (
    <View style={styles.container}>
      {/* MAIN ROW */}
      <TouchableOpacity style={styles.row} onPress={goToLedger}>
        <View>
          <Text style={styles.name}>{customer.name}</Text>
          <Text
            style={[
              styles.amount,
              { color: isCredit ? "#16a34a" : "#dc2626" },
            ]}
          >
            {isCredit ? "+" : ""}
            {formatRupee(amount)}
          </Text>
        </View>

        <View style={styles.actions}>
          {/* WhatsApp */}
          <TouchableOpacity
            disabled={!isValidMobile}
            onPress={() =>
              sendWhatsAppMessage(
                customer.mobileNumber,
                `Pending amount: ${formatRupee(amount)}`
              )
            }
            style={[
              styles.iconBtn,
              {
                backgroundColor: isValidMobile ? "#dcfce7" : "#e5e7eb",
              },
            ]}
          >
            <Ionicons
              name="logo-whatsapp"
              size={18}
              color={isValidMobile ? "#16a34a" : "#9ca3af"}
            />
          </TouchableOpacity>

          {/* Call */}
          <TouchableOpacity
            disabled={!isValidMobile}
            onPress={() => callCustomer(customer.mobileNumber)}
            style={[
              styles.iconBtn,
              {
                backgroundColor: isValidMobile ? "#dbeafe" : "#e5e7eb",
              },
            ]}
          >
            <Ionicons
              name="call-outline"
              size={18}
              color={isValidMobile ? "#2563eb" : "#9ca3af"}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* VIEW FULL LEDGER */}
      <TouchableOpacity onPress={goToLedger} style={styles.viewLedger}>
        <Text style={styles.viewLedgerText}>View full ledger →</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 6,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  amount: {
    marginTop: 2,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  viewLedger: {
    marginTop: 4,
    alignItems: "center",
    paddingVertical: 6,
  },
  viewLedgerText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
  },
});

