import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* 📦 COMPONENTS */
import ProductForm from "./ProductForm";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_EDIT_PRODUCT_MODAL } from "../../constants/language_inventory";
import { useLanguage } from "../../providers/LanguageProvider";

type Props = {
  visible: boolean;
  product: any;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditProductModal({
  visible,
  product,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_EDIT_PRODUCT_MODAL[language] || LANGUAGE_TEXT_EDIT_PRODUCT_MODAL.en;

  return (
    <Modal
      visible={visible}
      animationType="fade" // Consistent with your top-down flow
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop: Clicking closes modal */}
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
                initialData={product} 
                onSuccess={() => {
                  onSaved(); // Triggers refresh in parent list
                  onClose(); // Closes the modal
                }} 
              />
            </ScrollView>

            {/* BOTTOM HANDLE (Visual cue for Top-to-Bottom sheets) */}
            <View style={styles.dragHandle} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-start", // Pins sheet to the top for top-down effect
  },
  keyboardView: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 32, // Curved at the bottom to match top-down theme
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
    fontWeight: "900", // Consistent extra bold branding
    color: "#1e3a8a", 
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