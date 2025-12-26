import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { useState } from "react";

export default function AddLedgerEntryModal({
  visible,
  type,
  onSubmit,
  onClose,
  loading,
}: any) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!amount) return;
    onSubmit({
      amount: Number(amount),
      note,
    });
    setAmount("");
    setNote("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>
            {type === "CREDIT" ? "Add Credit" : "Add Debit"}
          </Text>

          <TextInput
            placeholder="Amount"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={styles.input}
          />

          <TextInput
            placeholder="Note (optional)"
            value={note}
            onChangeText={setNote}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[
              styles.btn,
              {
                backgroundColor:
                  type === "CREDIT" ? "#16a34a" : "#dc2626",
              },
            ]}
          >
            <Text style={styles.btnText}>
              {loading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
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
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  btn: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 6,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
  cancel: {
    textAlign: "center",
    marginTop: 10,
    color: "#64748b",
  },
});
