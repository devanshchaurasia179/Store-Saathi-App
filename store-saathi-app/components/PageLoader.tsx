import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

export default function PageLoader() {
  return (
    <View style={styles.container}>
      {/* Spinner */}
      <ActivityIndicator size="large" color="#2563eb" />

      {/* Text */}
      <Text style={styles.waitText}>Please wait,</Text>

      <Text style={styles.brand}>
        <Text style={styles.brandGray}>Store</Text>
        <Text style={styles.brandBlue}>Saathi</Text>
      </Text>

      <Text style={styles.subText}>working for you…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eff6ff", // bg-blue-50
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  waitText: {
    marginTop: 16,
    fontSize: 14,
    color: "#4b5563", // gray-600
  },
  brand: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: "700",
    flexDirection: "row",
  },
  brandGray: {
    color: "#6b7280", // gray-500
  },
  brandBlue: {
    color: "#1E3A8A", // blue-600
  },
  subText: {
    marginTop: 6,
    fontSize: 13,
    color: "#6b7280",
  },
});
