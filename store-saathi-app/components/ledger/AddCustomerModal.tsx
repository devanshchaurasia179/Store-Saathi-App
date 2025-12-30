import React, { useState } from "react";
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
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

/* 🛠 API & HOOKS */
import { addDebit, addCredit } from "../../constants/ledger.api";
import { useCreateCustomer } from "../../hooks/useCreateCustomer";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_ADD_CUSTOMER } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

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
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_ADD_CUSTOMER[language] || LANGUAGE_TEXT_ADD_CUSTOMER.en;

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
    // 1. Ensure keyboard is closed so state is captured correctly
    Keyboard.dismiss();

    if (!name.trim()) {
      Toast.show({
        type: "error",
        text1: t.nameReq,
        text2: t.nameReqDetail(isSupplier),
      });
      return;
    }

    try {
      // 2. Call the hook to create the customer
      const customer = await createCustomer({
        name: name.trim(),
        mobileNumber: mobile.trim() || undefined,
        isSupplier,
      });

      // 3. Handle Opening Balance logic
      const openingAmount = Number(amount);
      if (openingAmount > 0 && customer?._id) {
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
        text1: t.success,
        text2: t.successDetail(name),
      });

      onAdded(); // Refresh the list
      reset();   // Clear fields
      onClose(); // Close modal
    } catch (e) {
      console.error("Submission Error:", e);
      Toast.show({
        type: "error",
        text1: t.error,
        text2: t.errorDetail,
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop to close modal */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={[styles.sheet, { paddingTop: insets.top + 10 }]}>
            {/* HEADER */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{t.addTitle(isSupplier)}</Text>
                <Text style={styles.subtitle}>{t.subtitle}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* FORM */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#94a3b8" style={styles.icon} />
                <TextInput
                  placeholder={t.namePlace}
                  placeholderTextColor="#94a3b8"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={18} color="#94a3b8" style={styles.icon} />
                <TextInput
                  placeholder={t.mobilePlace}
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
                  placeholder={t.balancePlace}
                  placeholderTextColor="#94a3b8"
                  value={amount}
                  keyboardType="numeric"
                  onChangeText={setAmount}
                  style={styles.input}
                />
              </View>
            </View>

            {/* BALANCE TYPE TOGGLE */}
            {Number(amount) > 0 && (
              <View style={styles.toggleWrapper}>
                <Text style={styles.label}>{t.balanceType}</Text>
                <View style={styles.toggle}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, balanceType === "DEBIT" && styles.debitActive]}
                    onPress={() => setBalanceType("DEBIT")}
                  >
                    <Text style={[styles.toggleText, balanceType === "DEBIT" && styles.activeText]}>
                      {t.youGave}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleBtn, balanceType === "CREDIT" && styles.creditActive]}
                    onPress={() => setBalanceType("CREDIT")}
                  >
                    <Text style={[styles.toggleText, balanceType === "CREDIT" && styles.activeText]}>
                      {t.youGot}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* SUBMIT BUTTON */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.cta, loading && { opacity: 0.6 }]}
            >
              <Text style={styles.ctaText}>
                {loading ? t.loading : t.cta(isSupplier)}
              </Text>
            </TouchableOpacity>

            <View style={styles.handle} />
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
    justifyContent: "flex-start",
  },
  keyboardView: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
    paddingBottom: 25,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
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
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 8,
    textTransform: "uppercase",
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
    elevation: 4,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});