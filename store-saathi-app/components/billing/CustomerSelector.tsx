import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CustomerSelectorProps {
  customerName: string;
  customerLabel: string;
  onPress: () => void;
}

export default function CustomerSelector({ customerName, customerLabel, onPress }: CustomerSelectorProps) {
  return (
    <TouchableOpacity
      style={styles.customerBox}
      onPress={onPress}
    >
      <View style={styles.customerIconWrap}>
        <Ionicons name="person" size={16} color="#475569" />
      </View>
      <View>
        <Text style={styles.customerLabel}>{customerLabel}</Text>
        <Text style={styles.customerText}>{customerName}</Text>
      </View>
      <Ionicons name="chevron-down" size={16} color="#94a3b8" style={{ marginLeft: "auto" }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  customerBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  customerIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  customerLabel: { fontSize: 9, fontWeight: "700", color: "#94a3b8" },
  customerText: { fontSize: 12, fontWeight: "700", color: "#1e293b" },
});
