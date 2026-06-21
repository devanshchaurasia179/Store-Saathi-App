import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import WelcomeHeader from "../components/WelcomeHeader";
import { firebaseLogin } from "../constants/auth.api";
import { useAuth } from "../providers/AuthProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { LANGUAGE_TEXT } from "../constants/language";

const { width } = Dimensions.get("window");

export default function VerifyOtpPage() {
  const router = useRouter();
  const { mobileNumber } = useLocalSearchParams<{ mobileNumber: string }>();
  const { login } = useAuth();
  const { language } = useLanguage();

  const text = LANGUAGE_TEXT[language] || LANGUAGE_TEXT.en;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Toast.show({
        type: "error",
        text1: text.invalidOtp,
      });
      return;
    }

    const confirmation = global.__firebaseConfirmation as FirebaseAuthTypes.ConfirmationResult | undefined;

    if (!confirmation) {
      Toast.show({
        type: "error",
        text1: "Session expired. Please request OTP again.",
      });
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Confirm OTP with Firebase
      const userCredential = await confirmation.confirm(otp);

      // Step 2: Get Firebase ID token to send to our backend
      const firebaseIdToken = await userCredential!.user.getIdToken();

      // Step 3: Exchange Firebase token with our backend for a JWT
      const res = await firebaseLogin(firebaseIdToken);

      if (res?.data?.success) {
        // Clear the stored confirmation
        global.__firebaseConfirmation = undefined;

        Toast.show({
          type: "success",
          text1: text.loginSuccess,
        });

        await login(res.data.token);
        router.replace("/dashboard");
      }
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        text.somethingWentWrong;

      Toast.show({
        type: "error",
        text1: backendMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Section */}
          <View style={styles.topSection}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
              <Text style={styles.backText}>{text.back || "Back"}</Text>
            </TouchableOpacity>

            <View style={styles.headerSection}>
              <WelcomeHeader />
            </View>

            <View style={styles.imageContainer}>
              <Image
                source={require("../assets/images/login.png")} 
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Bottom Card */}
          <View style={styles.loginCard}>
            <Text style={styles.cardTitle}>{text.verifyOtpTitle || "Verify OTP"}</Text>

            <View style={styles.separatorContainer}>
              <View style={styles.line} />
              <Text style={styles.secureText}>{text.secureLabel || "SECURE"}</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>{text.otpSentTo || "OTP SENT TO"}: Store Saarthi Executive</Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.changeNumberText}>Edit Number</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="------"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                style={styles.otpInput}
                placeholderTextColor="#94A3B8"
                letterSpacing={Platform.OS === 'ios' ? 10 : 5}
              />
            </View>

            <TouchableOpacity
              onPress={handleVerifyOtp}
              disabled={loading}
              style={[styles.button, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{text.verifyOtpBtn || "VERIFY OTP"}</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    backgroundColor: "#F8FAFC",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: {
    color: "#1E3A8A",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 4,
  },
  headerSection: {
    alignItems: "center",
    marginTop: 10,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    height: width * 0.45,
  },
  illustration: {
    width: "70%",
    height: "100%",
  },
  loginCard: {
    backgroundColor: "#fff",
    flex: 1,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#334155",
    textAlign: "center",
    marginBottom: 20,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  secureText: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: "bold",
    color: "#94A3B8",
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1E3A8A",
  },
  changeNumberText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#EF4444", 
  },
  inputContainer: {
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    height: 60,
    justifyContent: "center",
    marginBottom: 30,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  otpInput: {
    fontSize: 22,
    color: "#1E293B",
    textAlign: "center",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#1E3A8A",
    borderRadius: 14,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});