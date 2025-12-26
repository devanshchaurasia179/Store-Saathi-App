import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Ionicons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router } from "expo-router";
import { sendWhatsAppMessage } from "../../utils/whatsapp";
import { callCustomer } from "../../utils/call";

export default function TopDebtorCard({ debtor }: any) {
  if (!debtor || debtor.isSupplier) return null;

  const { name, amount, mobileNumber, _id } = debtor;

  const formattedAmount = amount?.toLocaleString("en-IN") || "0";
  const hasMobile = Boolean(mobileNumber);

  return (
    <View style={styles.cardContainer}>
      {/* Header */}
      <View style={styles.headerRow}>
        <MaterialCommunityIcons
          name="lightning-bolt-outline"
          size={20}
          color="#FFC107"
        />
        <Text style={styles.headerText}>Top Debtor</Text>
      </View>

      {/* Info */}
      <View style={styles.infoBox}>
        <View style={styles.debtorDetails}>
          <Text style={styles.debtorName}>{name}</Text>
          <Text style={styles.debtorAmount}>₹{formattedAmount}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            disabled={!hasMobile}
            style={[
              styles.iconButton,
              styles.whatsappBg,
              !hasMobile && styles.disabled,
            ]}
            onPress={() =>
              sendWhatsAppMessage(
                mobileNumber,
                `Hello ${name}, your pending amount is ₹${formattedAmount}.`
              )
            }
          >
            <FontAwesome name="whatsapp" size={20} color="#25D366" />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!hasMobile}
            style={[
              styles.iconButton,
              styles.phoneBg,
              !hasMobile && styles.disabled,
            ]}
            onPress={() => callCustomer(mobileNumber)}
          >
            <Ionicons name="call-outline" size={18} color="#1e4de4" />
          </TouchableOpacity>
        </View>
      </View>

      {/* OPEN LEDGER */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={() => router.push(`/ledger`)}
      >
        <Text style={styles.footerText}>See ledger →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  infoBox: {
    backgroundColor: "#f8f9fb",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  debtorDetails: {
    flex: 1,
  },
  debtorName: {
    fontSize: 15,
    color: "#555",
    marginBottom: 4,
  },
  debtorAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  whatsappBg: {
    backgroundColor: "#e8f9ef",
    borderColor: "#d1f2de",
  },
  phoneBg: {
    backgroundColor: "#eef2ff",
    borderColor: "#e0e7ff",
  },
  disabled: {
    opacity: 0.4,
  },
  footerButton: {
    marginTop: 12,
  },
  footerText: {
    color: "#1e4de4",
    fontSize: 14,
    fontWeight: "600",
  },
});
