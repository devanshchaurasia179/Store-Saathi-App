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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import auth from "@react-native-firebase/auth";
import WelcomeHeader from "../components/WelcomeHeader";
import { useAuth } from "../providers/AuthProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { LANGUAGE_TEXT } from "../constants/language";

const { width } = Dimensions.get("window");

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();

  const text = LANGUAGE_TEXT[language] || LANGUAGE_TEXT.en;

  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (mobileNumber.length !== 10) {
      Toast.show({
        type: "error",
        text1: text.invalidMobile,
      });
      return;
    }

    setLoading(true);
    try {
      // Firebase sends the SMS OTP directly to the user's phone
      const confirmation = await auth().signInWithPhoneNumber(`+91${mobileNumber}`);

      Toast.show({
        type: "success",
        text1: text.otpSentSuccess,
      });

      // Pass the confirmation object via global store so verify-otp can use it
      global.__firebaseConfirmation = confirmation;

      router.push({
        pathname: "/verify-otp",
        params: { mobileNumber },
      });
    } catch (error: any) {
      console.error("Firebase sendOtp error:", error);
      Toast.show({
        type: "error",
        text1: error?.message || text.somethingWentWrong,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSecretLogin = () => {
    router.push("/login-secret");
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
          <View style={styles.topSection}>
            {!isAuthenticated && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace("/")}
              >
                <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
                <Text style={styles.backText}>{text.back || "Back"}</Text>
              </TouchableOpacity>
            )}

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

          <View style={styles.loginCard}>
            <Text style={styles.cardTitle}>{text.loginTitle}</Text>

            <View style={styles.separatorContainer}>
              <View style={styles.line} />
              <Text style={styles.secureText}>{text.secureLabel || "SECURE"}</Text>
              <View style={styles.line} />
            </View>

            <Text style={styles.label}>{text.mobileNumberLabel || "MOBILE NUMBER"}</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                placeholder={text.mobilePlaceholder}
                keyboardType="number-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                style={styles.input}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={loading}
              style={[styles.button, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{text.sendOtp}</Text>
              )}
            </TouchableOpacity>

            {/* --- Enhanced OR Separator --- */}
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            {/* Login via Secret Key Link */}
            <TouchableOpacity
              onPress={handleSecretLogin}
              style={styles.secretLoginContainer}
            >
              <Text style={styles.secretLoginText}>
                {text.loginWithSecretKey || "Login using Secret Key"}
              </Text>
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
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    backgroundColor: '#F8FAFC',
    paddingBottom: 10,
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
    height: width * 0.5,
  },
  illustration: {
    width: "75%",
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
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countryCode: {
    fontSize: 16,
    color: "#475569",
    marginRight: 10,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "500",
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
  // --- New OR Separator Styles ---
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  orText: {
    marginHorizontal: 15,
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  secretLoginContainer: {
    marginTop: 15,
    alignItems: "center",
  },
  secretLoginText: {
    color: "#1E3A8A",
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "none", // Underline removed
  },
});