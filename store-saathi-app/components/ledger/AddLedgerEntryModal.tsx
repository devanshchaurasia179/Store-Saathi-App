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
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_LEDGER_MODAL } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

export default function AddLedgerEntryModal({
  visible,
  type,
  onSubmit,
  onClose,
  loading,
}: any) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_LEDGER_MODAL[language] || LANGUAGE_TEXT_LEDGER_MODAL.en;

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    Keyboard.dismiss(); // Ensure state is synced
    if (!amount || Number(amount) <= 0) return;
    
    onSubmit({
      amount: Number(amount),
      note,
    });
    
    // Reset state
    setAmount("");
    setNote("");
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop: Clicking outside closes the modal */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={[styles.sheet, { paddingTop: insets.top + 10 }]}>
            
            <Text style={styles.title}>
              {type === "CREDIT" ? t.addCredit : t.addDebit}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                placeholder={t.amount}
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                style={styles.amountInput}
                autoFocus={true}
                returnKeyType="next"
              />
            </View>

            <TextInput
              placeholder={t.note}
              placeholderTextColor="#94a3b8"
              value={note}
              onChangeText={setNote}
              style={styles.noteInput}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || !amount}
              activeOpacity={0.8}
              style={[
                styles.btn,
                {
                  backgroundColor: type === "CREDIT" ? "#16a34a" : "#dc2626",
                },
                (loading || !amount) && { opacity: 0.6 }
              ]}
            >
              <Text style={styles.btnText}>
                {loading ? t.saving : t.save}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onClose} 
              style={styles.cancelButton}
              disabled={loading}
            >
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>

            {/* Handle moved to bottom to indicate "Top-Down" nature */}
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
    justifyContent: "flex-start", // Pins sheet to the top
  },
  keyboardView: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32, // Curve at bottom for top-down look
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
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: "700",
    color: "#64748b",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 22,
    color: "#1e293b",
    fontWeight: "800",
  },
  noteInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
    marginBottom: 20,
  },
  btn: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 10,
  },
  cancelText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 15,
    fontWeight: "600",
  },
});