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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_LEDGER_INPUT } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

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
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_LEDGER_INPUT[language] || LANGUAGE_TEXT_LEDGER_INPUT.en;

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const reset = () => {
    Keyboard.dismiss();
    setAmount("");
    setNote("");
    setMode("CREDIT");
    setOpen(false);
  };

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    
    Keyboard.dismiss();
    
    if (mode === "CREDIT") {
      await onAddCredit({ amount: value, note });
    } else {
      await onAddDebit({ amount: value, note });
    }
    reset();
  };

  return (
    <View style={styles.container}>
      {/* 1. FIXED BUTTON AT BOTTOM */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setOpen(true)}
          activeOpacity={0.9}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="add" size={24} color="#fff" />
          </View>
          <Text style={styles.addText}>{t.newEntry}</Text>
        </TouchableOpacity>
      </View>

      {/* 2. TOP-DOWN MODAL */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={reset}
      >
        <View style={styles.modalOverlay}>
          {/* Tap backdrop to close */}
          <TouchableWithoutFeedback onPress={reset}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "position" : undefined}
            style={styles.keyboardView}
          >
            <View style={[styles.sheet, { paddingTop: insets.top + 10 }]}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>{t.title}</Text>
                  <Text style={styles.subtitle}>{t.subtitle}</Text>
                </View>
                <TouchableOpacity onPress={reset} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* TOGGLE SECTION */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  onPress={() => setMode("CREDIT")}
                  style={[
                    styles.toggleBtn,
                    mode === "CREDIT" && styles.creditActive,
                  ]}
                >
                  <Text style={[styles.toggleText, mode === "CREDIT" && styles.activeText]}>
                    {t.paymentReceived}
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
                    {t.amountDue}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* INPUT GROUP */}
              <View style={styles.inputGroup}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                    autoFocus={true}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="create-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder={t.notePlace}
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* SAVE BUTTON */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting || !amount}
                style={[
                  styles.saveBtn,
                  (isSubmitting || !amount) && styles.disabledBtn,
                ]}
              >
                <Text style={styles.saveText}>
                  {isSubmitting ? t.processing : t.confirm}
                </Text>
              </TouchableOpacity>

              <View style={styles.handle} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Buttons will be positioned relative to the screen bottom
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    zIndex: 99,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-start", // MODAL DROPS FROM TOP
  },
  keyboardView: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 20,
    gap: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
  },
  addBtn: {
    backgroundColor: "#1e3a8a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 18,
    gap: 12,
    elevation: 8,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconCircle: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 2,
  },
  addText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.5,
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
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "700",
    color: "#94a3b8",
    marginRight: 6,
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