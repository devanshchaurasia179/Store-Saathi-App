import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_MOST_SOLD } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

type Item = {
  name: string;
  totalSold: number;
};

export default function MostSoldCard({ items }: { items: Item[] }) {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_MOST_SOLD[language] || LANGUAGE_TEXT_MOST_SOLD.en;

  // Render for Empty State
  if (!items || items.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <MaterialCommunityIcons name="trending-up" size={20} color="#10b981" />
            <Text style={styles.title}>{t.title}</Text>
          </View>
        </View>
        <Text style={styles.emptyText}>{t.noData}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* 1. Header Section */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <MaterialCommunityIcons name="trending-up" size={20} color="#10b981" />
          <Text style={styles.title}>{t.title}</Text>
        </View>
        <TouchableOpacity 
          style={styles.analyticsLink}
          onPress={() => router.push("/analytics")}
          activeOpacity={0.7}
        >
          <Text style={styles.analyticsText}>{t.viewAnalytics}</Text>
          <Ionicons name="arrow-forward" size={14} color="#1e4de4" />
        </TouchableOpacity>
      </View>

      {/* 2. List of Products */}
      {items.map((item, index) => (
        <View key={index}>
          <View style={styles.row}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.qty}>
              {item.totalSold} <Text style={styles.soldLabel}>{t.sold}</Text>
            </Text>
          </View>
          
          {/* Subtle divider between items */}
          {index < items.length - 1 && <View style={styles.divider} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
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
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  analyticsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  analyticsText: {
    fontSize: 14,
    color: "#1e4de4",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  name: {
    fontSize: 14,
    color: "#444",
    flex: 1,
    fontWeight: "500",
  },
  qty: {
    fontSize: 15,
    fontWeight: "800",
    color: "#333",
  },
  soldLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: "#888",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f3f5",
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 5,
  },
});