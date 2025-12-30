import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_LEDGER_MAIN_HEADER } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

export default function LedgerHeader() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();

  // Get current translation
  const t = LANGUAGE_TEXT_LEDGER_MAIN_HEADER[language] || LANGUAGE_TEXT_LEDGER_MAIN_HEADER.en;

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
        { paddingTop: insets.top + 10 }
      ]}
    >
      {/* Back Button */}
      <TouchableOpacity 
        onPress={handleBack} 
        style={[styles.backBtn, { top: insets.top + 10 }]}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Content Section */}
      <View style={styles.center}>
        <View style={styles.titleRow}>
          <Ionicons name="book" size={20} color="#bfdbfe" style={styles.bookIcon} />
          <Text style={styles.title}>
            {t.ledgerTitle}
          </Text>
        </View>
        <Text style={styles.subtitle}>
          {t.tagline}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e3a8a",
    paddingBottom: 85, 
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    elevation: 12,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 10,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.18)", 
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    alignItems: "center",
    marginTop: 5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookIcon: {
    marginTop: 2,
  },
  title: {
    fontSize: 26, 
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#dbeafe",
    opacity: 0.9,
    letterSpacing: 0.3,
    fontStyle: "italic", // Gives the tagline a unique feel
  },
});