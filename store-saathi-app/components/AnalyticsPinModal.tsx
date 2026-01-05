import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import {
  setAnalyticsPin,
  verifyAnalyticsPin,
  sendAnalyticsPinResetOtp,
  resetAnalyticsPinWithOtp,
} from "../constants/auth.api";

type Props = {
  visible: boolean;
  mode: "set" | "verify";
  onSuccess: () => void;
  onClose: () => void;
};

export default function AnalyticsPinModal({
  visible,
  mode,
  onSuccess,
  onClose,
}: Props) {
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"pin" | "otp" | "newPin">("pin");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Focus management: Ensure keyboard opens on mount and on step changes
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300); // Increased delay for better reliability with Modal transitions
      return () => clearTimeout(timer);
    }
  }, [visible, step]);

  useEffect(() => {
    if (visible) {
      setPin("");
      setOtp("");
      setStep("pin");
      setLoading(false);
    }
  }, [visible]);

  const handleAction = async () => {
    if (loading) return;

    try {
      setLoading(true);

      if (step === "pin") {
        if (pin.length !== 4) {
          Toast.show({ type: "error", text1: "Enter 4-digit PIN" });
          return;
        }

        if (mode === "set") {
          await setAnalyticsPin(pin);
          Toast.show({ type: "success", text1: "PIN Created" });
          onSuccess();
          onClose();
          return;
        }

        await verifyAnalyticsPin(pin);
        Toast.show({ type: "success", text1: "Access Granted" });
        onSuccess();
        onClose();
        return;
      }

      if (step === "otp") {
        if (otp.length !== 6) {
          Toast.show({ type: "error", text1: "Enter 6-digit OTP" });
          return;
        }
        setPin("");
        setStep("newPin");
        return;
      }

      if (step === "newPin") {
        if (pin.length !== 4) {
          Toast.show({ type: "error", text1: "Enter 4-digit PIN" });
          return;
        }

        await resetAnalyticsPinWithOtp(otp, pin);
        Toast.show({ type: "success", text1: "PIN Reset Successful" });
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPinDisplay = () => {
    const value = step === "otp" ? otp : pin;
    const totalDigits = step === "otp" ? 6 : 4;

    return (
      <Pressable
        style={[
          styles.pinContainer,
          step === "otp" && { paddingHorizontal: 0 } // Use full width for 6 digits
        ]}
        onPress={() => inputRef.current?.focus()}
      >
        {Array.from({ length: totalDigits }).map((_, index) => {
          const char = value[index];
          const isCurrent = index === value.length && isFocused;
          return (
            <View
              key={index}
              style={[
                styles.pinBox,
                step === "otp" && styles.pinBoxOtp, // Smaller boxes for OTP
                char ? styles.pinBoxFilled : null,
                isCurrent ? styles.pinBoxActive : null,
              ]}
            >
              {char ? (
                <View style={styles.dot} />
              ) : isCurrent ? (
                <View style={styles.cursor} />
              ) : null}
            </View>
          );
        })}
      </Pressable>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => {
          Keyboard.dismiss();
          onClose();
        }} />

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={
                step === "otp"
                  ? "mail-open-outline"
                  : step === "newPin"
                  ? "refresh-circle-outline"
                  : mode === "set"
                  ? "lock-closed-outline"
                  : "shield-checkmark-outline"
              }
              size={32}
              color="#1E3A8A"
            />
          </View>

          <Text style={styles.title}>
            {step === "otp"
              ? "Verify OTP"
              : step === "newPin"
              ? "Set New PIN"
              : mode === "set"
              ? "Secure Analytics"
              : "Privacy Protected"}
          </Text>

          <Text style={styles.subtitle}>
            {step === "otp"
              ? "Enter the 6-digit code sent to your email"
              : step === "newPin"
              ? "Create a new 4-digit access PIN"
              : mode === "set"
              ? "Create a 4-digit PIN to hide sensitive data"
              : "Enter your 4-digit PIN to view analytics"}
          </Text>

          <TextInput
            ref={inputRef}
            keyboardType="number-pad"
            maxLength={step === "otp" ? 6 : 4}
            value={step === "otp" ? otp : pin}
            onChangeText={(text) =>
              step === "otp" ? setOtp(text) : setPin(text)
            }
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={styles.hiddenInput}
            caretHidden
            autoFocus={false} 
          />

          {renderPinDisplay()}

          {mode === "verify" && step === "pin" && (
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={async () => {
                try {
                  setLoading(true);
                  await sendAnalyticsPinResetOtp();
                  Toast.show({ type: "success", text1: "OTP sent to registered email" });
                  setStep("otp");
                  setPin("");
                } catch {
                  Toast.show({ type: "error", text1: "Failed to send OTP" });
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Text style={styles.forgotText}>Forgot PIN?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.btn,
              (loading || (step === "otp" ? otp.length < 6 : pin.length < 4)) &&
                styles.btnDisabled,
            ]}
            onPress={handleAction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>
                {step === "otp"
                  ? "Verify OTP"
                  : step === "newPin"
                  ? "Reset PIN"
                  : mode === "set"
                  ? "Create PIN"
                  : "Unlock Analytics"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={styles.cancelBtn}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Not now, keep hidden</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: "center",
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    marginBottom: 24,
  },
  pinBox: {
    width: 54,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  pinBoxOtp: {
    width: 42, // Narrower boxes to fit 6 in a row
    height: 56,
    gap: 6,
  },
  pinBoxFilled: {
    borderColor: "#1E3A8A",
    backgroundColor: "#fff",
  },
  pinBoxActive: {
    borderColor: "#1E3A8A",
    borderWidth: 2,
    backgroundColor: "#fff",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1E3A8A",
  },
  cursor: {
    width: 2,
    height: 20,
    backgroundColor: "#1E3A8A",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  forgotBtn: {
    marginBottom: 20,
    padding: 4,
  },
  forgotText: {
    color: "#1E3A8A",
    fontWeight: "700",
    fontSize: 14,
  },
  btn: {
    width: "100%",
    backgroundColor: "#1E3A8A",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  btnDisabled: {
    backgroundColor: "#CBD5E1",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelBtn: {
    marginTop: 18,
  },
  cancelText: {
    color: "#94A3B8",
    fontWeight: "600",
    fontSize: 14,
  },
});