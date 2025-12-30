import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_INVENTORY_MENU } from "../../constants/language_inventory";
import { useLanguage } from "../../providers/LanguageProvider";

interface InventoryMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

export default function InventoryMenu({ onEdit, onDelete }: InventoryMenuProps) {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_INVENTORY_MENU[language] || LANGUAGE_TEXT_INVENTORY_MENU.en;

  return (
    <View style={styles.menuContainer}>
      {/* EDIT ACTION */}
      <TouchableOpacity 
        style={styles.actionItem} 
        onPress={onEdit}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBadge, { backgroundColor: '#eff6ff' }]}>
          <Ionicons name="pencil" size={16} color="#2563eb" />
        </View>
        <Text style={[styles.actionText, { color: '#1e40af' }]}>
          {t.edit}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* DELETE ACTION */}
      <TouchableOpacity 
        style={styles.actionItem} 
        onDelete={onDelete} // Note: usually triggered via onPress
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBadge, { backgroundColor: '#fef2f2' }]}>
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
        </View>
        <Text style={[styles.actionText, { color: '#991b1b' }]}>
          {t.delete}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC", // Modern slate background
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  actionItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "800", // Bolder for high-end look
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: "#e2e8f0",
  },
});