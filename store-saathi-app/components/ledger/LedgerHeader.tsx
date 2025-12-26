import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
// 1. Import the hook for safe area
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LedgerHeader() {
  const navigation = useNavigation<any>();
  // 2. Get the top inset (status bar height)
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Dashboard");
    }
  };

  return (
    <View 
      style={[
        styles.container, 
        // 3. Apply top safe area padding dynamically
        { paddingTop: insets.top + 10 }
      ]}
    >
      {/* Back Button */}
      <TouchableOpacity 
        onPress={handleBack} 
        style={[styles.backBtn, { top: insets.top + 10 }]}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Branding */}
      <View style={styles.center}>
        <Text style={styles.title}>
          Store<Text style={styles.highlight}>Saathi</Text>
        </Text>
        <Text style={styles.subtitle}>
          Your store’s one-stop solution
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // 4. Using theme color Blue-600
    backgroundColor: "#1e3a8a",
    paddingBottom:100, // Reduced for a tighter, more professional look
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    // Add shadow for premium feel
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)", // Subtle translucent background
    borderRadius: 12,
  },
  center: {
    alignItems: "center",
  },
  title: {
    fontSize: 22, // Increased for better branding presence
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.8,
  },
  highlight: {
    color: "#bfdbfe", // Light blue tint
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: "#dbeafe",
    opacity: 0.9,
  },
});