import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import your ProductForm component
import ProductForm from "./ProductForm"; 

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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.outerContainer}>
          {/* HEADER SECTION */}
          <View 
            style={[
              styles.header, 
              { paddingTop: Platform.OS === 'android' ? insets.top + 20 : 20 }
            ]}
          >
            <View>
              <Text style={styles.title}>Edit Product</Text>
              <Text style={styles.subtitle}>Update inventory and pricing details</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* FORM SECTION */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContainer,
              { paddingBottom: insets.bottom + 20 }
            ]}
          >
            {/* We pass the product as initialData. 
               ProductForm already contains the logic to prefill fields 
               and call the update API if initialData exists.
            */}
            <ProductForm 
              initialData={product} 
              onSuccess={() => {
                onSaved(); // Triggers refresh in parent list
                onClose(); // Closes the modal
              }} 
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  title: { 
    fontSize: 24, 
    fontWeight: "800", 
    color: "#1e293b" 
  },
  subtitle: { 
    fontSize: 14, 
    color: "#64748b", 
    marginTop: 2 
  },
  closeBtn: {
    backgroundColor: "#f1f5f9",
    padding: 6,
    borderRadius: 12,
  },
});