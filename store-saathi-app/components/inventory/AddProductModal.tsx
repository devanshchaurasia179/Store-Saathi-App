import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* 📦 COMPONENTS */
import ProductForm from "./ProductForm";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_ADD_PRODUCT_MODAL } from "../../constants/language_inventory";
import { useLanguage } from "../../providers/LanguageProvider";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdded?: () => void;
  categories?: string[];
};

export default function AddProductModal({
  visible,
  onClose,
  onAdded,
  categories,
}: Props) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_ADD_PRODUCT_MODAL[language] || LANGUAGE_TEXT_ADD_PRODUCT_MODAL.en;

  // Handle Android back button
  useEffect(() => {
    if (!visible) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => handler.remove();
  }, [visible, onClose]);

  // Don't render anything when not visible — instant show, no Modal overhead
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View
          style={[
            styles.sheet,
            { paddingTop: insets.top + 10 }
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.subtitle}>{t.subtitle}</Text>
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeCircle}
            >
              <Ionicons name="close" size={22} color="#1e293b" />
            </TouchableOpacity>
          </View>

          {/* FORM SECTION */}
          <ScrollView 
             showsVerticalScrollIndicator={false}
             contentContainerStyle={styles.formContent}
             keyboardShouldPersistTaps="handled"
          >
            <ProductForm
              onSuccess={() => {
                onAdded?.();
                onClose();
              }}
              categories={categories}
            />
          </ScrollView>

          {/* BOTTOM HANDLE */}
          <View style={styles.dragHandle} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-start",
    zIndex: 9999,
    elevation: 9999,
  },
  keyboardView: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 32, // Curved at the bottom
    borderBottomRightRadius: 32,
    paddingHorizontal: 20,
    maxHeight: "92%", 
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 24,
    paddingBottom: 15,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "900", // Extra bold for branding
    color: "#1e3a8a", // Theme Blue
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "600",
  },
  closeCircle: {
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderRadius: 25,
  },
  formContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
});