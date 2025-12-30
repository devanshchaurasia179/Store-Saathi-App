import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_INVENTORY_HEADER } from "../../constants/language_inventory";
import { useLanguage } from "../../providers/LanguageProvider";

type Props = {
  onAddProduct: () => void;
  onQuickEntry: () => void;
  onBack?: () => void;
};

export default function InventoryHeader({
  onAddProduct,
  onQuickEntry,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_INVENTORY_HEADER[language] || LANGUAGE_TEXT_INVENTORY_HEADER.en;

  return (
    <View
      style={[
        styles.container,
        // Reduced from +12 to +4 for a tighter top fit
        { paddingTop: insets.top + 4 },
      ]}
    >
      {/* Top Navigation Row */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack ?? (() => router.back())}
          activeOpacity={0.7}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actions}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.whiteBtn}
            onPress={onAddProduct}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircleBlue}>
              <Ionicons name="add" size={20} color="#2563eb" />
            </View>
            <Text style={styles.whiteText}>{t.addProduct}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.blueBtn}
            onPress={onQuickEntry}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircleLight}>
              <Ionicons name="flash" size={16} color="#fff" />
            </View>
            <Text style={styles.blueText}>{t.quickEntry}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.darkBtn}
          onPress={() => router.push("/barcode-sheet")}
          activeOpacity={0.8}
        >
          <Ionicons name="barcode-outline" size={20} color="#fff" />
          <Text style={styles.blueText}>{t.barcodeSheet}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e3a8a", 
    // Reduced paddingBottom from 30 to 20
    paddingBottom: 20,
    paddingHorizontal: 16,
    // Slightly smaller radius for more content space
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 10,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // Reduced marginBottom from 24 to 12
    marginBottom: 12,
  },
  backBtn: {
    width: 40, // Reduced from 44
    height: 40, // Reduced from 44
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  searchIconBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 18, // Reduced from 22
    fontWeight: "900",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#bfdbfe",
    fontSize: 12, // Reduced from 13
    marginTop: 0, // Reduced from 2
    fontWeight: "600",
    opacity: 0.9,
  },
  actions: {
    gap: 8, // Reduced from 12
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10, // Reduced from 12
  },
  whiteBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16, // Reduced from 20
    paddingVertical: 10, // Reduced from 14
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
  },
  iconCircleBlue: {
    width: 24, // Reduced from 28
    height: 24, // Reduced from 28
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  blueBtn: {
    flex: 1,
    backgroundColor: "#1d4ed8", 
    borderRadius: 16, // Reduced from 20
    paddingVertical: 10, // Reduced from 14
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  iconCircleLight: {
    width: 24, // Reduced from 28
    height: 24, // Reduced from 28
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  darkBtn: {
    backgroundColor: "rgba(0, 0, 0, 0.2)", 
    borderRadius: 16, // Reduced from 20
    paddingVertical: 12, // Reduced from 15
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  whiteText: {
    color: "#1e3a8a",
    fontWeight: "800",
    fontSize: 13, // Reduced from 14
  },
  blueText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13, // Reduced from 14
  },
});