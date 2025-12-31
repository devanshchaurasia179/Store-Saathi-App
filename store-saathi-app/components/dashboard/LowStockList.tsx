import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_LOW_STOCK } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

export default function LowStockList({ items }: any) {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_LOW_STOCK[language] || LANGUAGE_TEXT_LOW_STOCK.en;

  // Logic: Do not render if there are no low stock items
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.cardContainer}>
      {/* 1. Header with Language Support */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={20}
            color="#f97316"
          />
          <Text style={styles.headerText}>{t.lowStock}</Text>
        </View>
        <Text style={styles.qtyLabel}>{t.qtyLeft}</Text>
      </View>

      {/* 2. List of Items */}
      {items.map((item: any, index: number) => {
        const unit = item.unit || "unit"; // 🆕 SAFE FALLBACK

        return (
          <View key={index} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemQuantity}>
              {item.quantity} {unit}
            </Text>
          </View>
        );
      })}

      {/* 3. Action Link with Language Support */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={() => router.push("/inventory")}
        activeOpacity={0.7}
      >
        <Text style={styles.footerText}>{t.updateInventory} →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  qtyLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff5f5", // Light alert red
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 15,
    color: "#444",
    fontWeight: "500",
    flex: 1,
    marginRight: 10,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: "800",
    color: "#d32f2f",
  },
  footerButton: {
    marginTop: 6,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  footerText: {
    color: "#1e4de4",
    fontSize: 14,
    fontWeight: "700",
  },
});
