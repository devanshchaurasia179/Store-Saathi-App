import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onAddCredit: (data: { amount: number; note?: string }) => Promise<any>;
  onAddDebit: (data: { amount: number; note?: string }) => Promise<any>;
  isSubmitting?: boolean;
};

export default function LedgerInputBar({
  onAddCredit,
  onAddDebit,
  isSubmitting = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const reset = () => {
    setAmount("");
    setNote("");
    setMode("CREDIT");
    setOpen(false);
  };

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    if (mode === "CREDIT") {
      await onAddCredit({ amount: value, note });
    } else {
      await onAddDebit({ amount: value, note });
    }
    reset();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[
        styles.wrapper,
        { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20 },
      ]}
    >
      {/* COLLAPSED STATE */}
      {!open && (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setOpen(true)}
          activeOpacity={0.9}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="add" size={24} color="#fff" />
          </View>
          <Text style={styles.addText}>New Entry</Text>
        </TouchableOpacity>
      )}

      {/* EXPANDED STATE */}
      {open && (
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>New Transaction</Text>
              <Text style={styles.subtitle}>Enter details below</Text>
            </View>
            <TouchableOpacity onPress={reset} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* UNIFORM WIDTH TOGGLE */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              onPress={() => setMode("CREDIT")}
              style={[
                styles.toggleBtn,
                mode === "CREDIT" && styles.creditActive,
              ]}
            >
              <Text style={[styles.toggleText, mode === "CREDIT" && styles.activeText]}>
                Payment Received
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMode("DEBIT")}
              style={[
                styles.toggleBtn,
                mode === "DEBIT" && styles.debitActive,
              ]}
            >
              <Text style={[styles.toggleText, mode === "DEBIT" && styles.activeText]}>
                Amount Due
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Ionicons name="cash-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="create-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (e.g. For Groceries)"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || !amount}
            style={[
              styles.saveBtn,
              (isSubmitting || !amount) && styles.disabledBtn,
            ]}
          >
            <Text style={styles.saveText}>
              {isSubmitting ? "Processing..." : "Confirm Entry"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  addBtn: {
    backgroundColor: "#1e3a8a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
  },
  iconCircle: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 2,
  },
  addText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  sheet: {
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontWeight: "800",
    fontSize: 18,
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: "#f1f5f9",
    padding: 4,
    borderRadius: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 4,
    borderRadius: 14,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 11,
  },
  creditActive: {
    backgroundColor: "#22c55e",
  },
  debitActive: {
    backgroundColor: "#ef4444",
  },
  toggleText: {
    fontWeight: "700",
    color: "#64748b",
    fontSize: 13,
  },
  activeText: {
    color: "#fff",
  },
  inputGroup: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "#1e3a8a",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  disabledBtn: {
    backgroundColor: "#cbd5e1",
  },
  saveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});