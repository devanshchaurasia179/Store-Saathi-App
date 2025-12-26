import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { addDebit, addCredit } from "../../constants/ledger.api";
import { useCreateCustomer } from "../../hooks/useCreateCustomer";

type Props = {
  visible: boolean;
  isSupplier: boolean;
  onClose: () => void;
  onAdded: () => void;
};

export default function AddCustomerModal({
  visible,
  isSupplier,
  onClose,
  onAdded,
}: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");
  const [balanceType, setBalanceType] = useState<"DEBIT" | "CREDIT">("DEBIT");

  const { createCustomer, loading } = useCreateCustomer();

  const reset = () => {
    setName("");
    setMobile("");
    setAmount("");
    setBalanceType("DEBIT");
  };

  const handleSubmit = async () => {
    // UX: Use Toast for validation
    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: "Name Required",
        text2: `Please enter the ${isSupplier ? "supplier" : "customer"} name`,
      });
      return;
    }

    try {
      const customer = await createCustomer({
        name,
        mobileNumber: mobile || undefined,
        isSupplier,
      });

      const openingAmount = Number(amount);
      if (openingAmount > 0) {
        if (balanceType === "DEBIT") {
          await addDebit({
            customerId: customer._id,
            amount: openingAmount,
            note: "Opening balance",
          });
        } else {
          await addCredit({
            customerId: customer._id,
            amount: openingAmount,
            note: "Opening advance",
          });
        }
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: `${name} added successfully`,
      });

      onAdded();
      reset();
      onClose();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={[
                styles.sheet,
                { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20 },
              ]}
            >
              {/* DRAG HANDLE INDICATOR */}
              <View style={styles.handle} />

              {/* HEADER */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>
                    Add New {isSupplier ? "Supplier" : "Customer"}
                  </Text>
                  <Text style={styles.subtitle}>Enter account opening details</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* INPUTS */}
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={18} color="#94a3b8" style={styles.icon} />
                  <TextInput
                    placeholder="Name"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={18} color="#94a3b8" style={styles.icon} />
                  <TextInput
                    placeholder="Mobile (optional)"
                    placeholderTextColor="#94a3b8"
                    value={mobile}
                    keyboardType="phone-pad"
                    maxLength={10}
                    onChangeText={setMobile}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="wallet-outline" size={18} color="#94a3b8" style={styles.icon} />
                  <TextInput
                    placeholder="Opening balance (optional)"
                    placeholderTextColor="#94a3b8"
                    value={amount}
                    keyboardType="numeric"
                    onChangeText={setAmount}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* TOGGLE SECTION */}
              {Number(amount) > 0 && (
                <View style={styles.toggleWrapper}>
                  <Text style={styles.label}>Balance Type</Text>
                  <View style={styles.toggle}>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        balanceType === "DEBIT" && styles.debitActive,
                      ]}
                      onPress={() => setBalanceType("DEBIT")}
                    >
                      <Text style={[styles.toggleText, balanceType === "DEBIT" && styles.activeText]}>
                        You Gave (Due)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        balanceType === "CREDIT" && styles.creditActive,
                      ]}
                      onPress={() => setBalanceType("CREDIT")}
                    >
                      <Text style={[styles.toggleText, balanceType === "CREDIT" && styles.activeText]}>
                        You Got (Adv)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* CTA */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
                style={[styles.cta, loading && { opacity: 0.6 }]}
              >
                <Text style={styles.ctaText}>
                  {loading ? "Creating Account..." : `Add ${isSupplier ? "Supplier" : "Customer"}`}
                </Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)", // Darker, more premium overlay
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 25,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
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
  form: {
    gap: 12,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
  },
  toggleWrapper: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 8,
    textTransform: "uppercase",
    marginLeft: 4,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 4,
    borderRadius: 14,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 11,
  },
  debitActive: {
    backgroundColor: "#ef4444",
  },
  creditActive: {
    backgroundColor: "#22c55e",
  },
  toggleText: {
    fontWeight: "700",
    color: "#64748b",
    fontSize: 13,
  },
  activeText: {
    color: "#fff",
  },
  cta: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});