import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { formatRupee } from "../../utils/formatCurrency";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import EditCustomerModal from "./EditCustomerModal";

export default function LedgerChatHeader({ customer, onRefresh }: any) {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  if (!customer) return null;

  const pending = customer.totalPending || 0;

  let balanceText = "Settled";
  let balanceColor = "#64748b";

  if (pending > 0) {
    balanceText = `${formatRupee(pending)} Due`;
    balanceColor = "#dc2626";
  } else if (pending < 0) {
    balanceText = `${formatRupee(Math.abs(pending))} Advance`;
    balanceColor = "#16a34a";
  }

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        {/* BACK */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity>

        {/* NAME */}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.name} numberOfLines={1}>
            {customer.name}
          </Text>
          <Text style={[styles.balance, { color: balanceColor }]}>
            {balanceText}
          </Text>
        </View>

        {/* MORE */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setMenuOpen((p) => !p)}
        >
          <Ionicons name="ellipsis-vertical" size={20} />
        </TouchableOpacity>
      </View>

      {/* MENU */}
      {menuOpen && (
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              setShowEdit(true);
            }}
          >
            <Text style={styles.menuText}>Edit Customer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* EDIT MODAL */}
      <EditCustomerModal
        visible={showEdit}
        customer={customer}
        onClose={() => setShowEdit(false)}
        onSaved={() => {
          setShowEdit(false);
          onRefresh?.(); // 🔥 refresh ledger
        }}
      />
    </>
  );
}


const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 14, // Keep bottom padding consistent
    backgroundColor: "#fff",
    // Elevation for Android, Shadow for iOS
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 100,
  },
  iconButton: {
    padding: 4,
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1e293b",
  },
  balance: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 1,
  },
  menu: {
  position: "absolute",
  right: 12,
  top: 60,
  backgroundColor: "#fff",
  borderRadius: 12,
  elevation: 6,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  zIndex: 200,
},
menuItem: {
  paddingHorizontal: 16,
  paddingVertical: 12,
},
menuText: {
  fontSize: 14,
  fontWeight: "600",
},

});