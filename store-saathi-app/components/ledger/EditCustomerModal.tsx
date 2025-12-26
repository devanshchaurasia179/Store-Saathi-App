import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { updateCustomer } from "../../constants/ledger.api";

type Props = {
  visible: boolean;
  customer: any;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditCustomerModal({
  visible,
  customer,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(customer.name);
  const [mobile, setMobile] = useState(customer.mobileNumber || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      await updateCustomer(customer._id, {
        name,
        mobileNumber: mobile || undefined,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.message ||
          "Failed to update customer"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit Customer</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} />
            </TouchableOpacity>
          </View>

          {/* NAME */}
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            style={styles.input}
          />

          {/* MOBILE */}
          <TextInput
            value={mobile}
            onChangeText={setMobile}
            placeholder="Mobile"
            keyboardType="phone-pad"
            maxLength={10}
            style={styles.input}
          />

          {/* SAVE */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={[
              styles.saveBtn,
              loading && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.saveText}>
              {loading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
  },
});
