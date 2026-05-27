import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface BillingHeaderProps {
  title: string;
  subtitle: string;
  onScanPress: () => void;
}

export default function BillingHeader({ title, subtitle, onScanPress }: BillingHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={24} color="#1e293b" />
      </TouchableOpacity>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity
        style={styles.scannerToggleBtn}
        onPress={onScanPress}
      >
        <Ionicons name="barcode-outline" size={18} color="#2563eb" style={{ marginRight: 4 }} />
        <Text style={styles.searchBtnText}>Scan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 100,
    paddingBottom: 15,
    marginTop: -100,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    gap: 12,
    zIndex: 100,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 10, color: "#2563eb", fontWeight: "800" },
  scannerToggleBtn: {
    marginLeft: "auto",
    backgroundColor: "#eff6ff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchBtnText: { fontSize: 11, fontWeight: "700", color: "#2563eb" },
});
