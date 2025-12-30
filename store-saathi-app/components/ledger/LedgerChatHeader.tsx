import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* 🛠 UTILS */
import { formatRupee } from "../../utils/formatCurrency";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_LEDGER_HEADER } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

/* 📦 COMPONENTS */
import EditCustomerModal from "./EditCustomerModal";

export default function LedgerChatHeader({ customer, onRefresh }: any) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_LEDGER_HEADER[language] || LANGUAGE_TEXT_LEDGER_HEADER.en;

  const [menuOpen, setMenuOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  if (!customer) return null;

  const pending = customer.totalPending || 0;

  let balanceText = t.settled;
  let balanceColor = "#64748b"; // Grey

  if (pending > 0) {
    balanceText = `${formatRupee(pending)} ${t.due}`;
    balanceColor = "#ef4444"; // Red
  } else if (pending < 0) {
    balanceText = `${formatRupee(Math.abs(pending))} ${t.advance}`;
    balanceColor = "#22c55e"; // Green
  }

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        {/* BACK BUTTON */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        {/* AVATAR + NAME GROUP */}
        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.profileContainer}
          onPress={() => setShowEdit(true)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {customer.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {customer.name}
            </Text>
            <Text style={[styles.balance, { color: balanceColor }]}>
              {balanceText}
            </Text>
          </View>
        </TouchableOpacity>

        {/* MORE MENU BUTTON */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setMenuOpen(true)}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {/* OVERLAY DROPDOWN MENU */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.menu, { top: insets.top + 50 }]}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  setShowEdit(true);
                }}
              >
                <Ionicons name="create-outline" size={18} color="#1e293b" />
                <Text style={styles.menuText}>{t.editCustomer}</Text>
              </TouchableOpacity>
              
              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  // Logic for delete can go here
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
                <Text style={[styles.menuText, { color: "#ef4444" }]}>{t.deleteCustomer}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* EDIT MODAL */}
      <EditCustomerModal
        visible={showEdit}
        customer={customer}
        onClose={() => setShowEdit(false)}
        onSaved={() => {
          setShowEdit(false);
          onRefresh?.();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 100,
  },
  backButton: {
    padding: 6,
    marginRight: 4,
  },
  profileContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e4de4",
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontWeight: "800",
    fontSize: 17,
    color: "#1e293b",
    letterSpacing: -0.3,
  },
  balance: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 0,
  },
  moreButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  menu: {
    position: "absolute",
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    minWidth: 180,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 8,
  },
});