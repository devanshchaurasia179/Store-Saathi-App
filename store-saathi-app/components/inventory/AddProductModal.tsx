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

import ProductForm from "./ProductForm";

type Props = {
  visible: boolean;
  onClose: () => void;
  onAdded?: () => void;
};

export default function AddProductModal({
  visible,
  onClose,
  onAdded,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide" // Slide is better for bottom sheets
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Close the modal when clicking the backdrop */}
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
              { paddingBottom: insets.bottom + 20 }
            ]}
          >
            {/* DRAG HANDLE */}
            <View style={styles.dragHandle} />

            {/* HEADER */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Add New Product</Text>
                <Text style={styles.subtitle}>Fill in details to expand your catalog</Text>
              </View>
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.closeCircle}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* FORM SECTION - Important: Use flexGrow: 1 */}
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
              />
            </ScrollView>
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
    justifyContent: "flex-end", // Firmly anchors to bottom
  },
  keyboardView: {
    width: "100%",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    // Set a dynamic height so it doesn't float in the middle
    maxHeight: "90%", 
    minHeight: "50%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 24,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  closeCircle: {
    backgroundColor: "#f1f5f9",
    padding: 6,
    borderRadius: 20,
  },
  formContent: {
    paddingBottom: 40, // More space at the bottom for scrolling
    flexGrow: 1,
  }
});