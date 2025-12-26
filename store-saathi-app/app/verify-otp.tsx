import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
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
import WelcomeHeader from "../components/WelcomeHeader";
import { verifyOtp } from "../constants/auth.api";
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

  try {
    setLoading(true);
    const res = await verifyOtp(mobileNumber!, otp);

    if (res?.data?.success) {
      Toast.show({
        type: "success",
        text1: text.loginSuccess,
      });

      await login();
      router.replace("/dashboard");
    }
  } catch (error: any) {
    // ✅ BACKEND-FIRST ERROR MESSAGE
    const backendMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Section */}
          <View style={styles.topSection}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#2b62f1" />
              <Text style={styles.backText}>{text.back || "Back"}</Text>
            </TouchableOpacity>

            <View style={styles.headerSection}>
              <WelcomeHeader />
            </View>

            <View style={styles.imageContainer}>
              <Image
                source={require("../assets/images/login.png")} // Use OTP illustration if you have one
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
              <Text style={styles.label}>{text.otpSentTo || "OTP SENT TO"}: {mobileNumber}</Text>
              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.changeNumberText}>{text.changeNumber || "Edit"}</Text>
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
                placeholderTextColor="#999"
                letterSpacing={10}
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

            <View style={{ flex: 1, minHeight: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7ff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    backgroundColor: "#f0f7ff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: {
    color: "#2b62f1",
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#001a33",
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
    backgroundColor: "#eee",
  },
  secureText: {
    marginHorizontal: 10,
    fontSize: 12,
    fontWeight: "bold",
    color: "#778899",
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2b62f1",
  },
  changeNumberText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#e63946", // Distinct color for the edit action
    textDecorationLine: "underline",
  },
  inputContainer: {
    backgroundColor: "#f8f9fb",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  otpInput: {
    fontSize: 20,
    color: "#333",
    textAlign: "center",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#1e4de4",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});