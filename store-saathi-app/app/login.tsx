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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import WelcomeHeader from "../components/WelcomeHeader";
import { sendOtp } from "../constants/auth.api";
import { useAuth } from "../providers/AuthProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { LANGUAGE_TEXT } from "../constants/language";

const { width, height } = Dimensions.get("window");

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
    const res = await sendOtp(mobileNumber);

    if (res?.data?.success) {
      Toast.show({
        type: "success",
        text1: text.otpSentSuccess,
      });

      router.push({
        pathname: "/verify-otp",
        params: { mobileNumber },
      });
    } else {
      Toast.show({
        type: "error",
        text1: text.somethingWentWrong,
      });
    }
  } catch (error) {
    Toast.show({
      type: "error",
      text1: text.somethingWentWrong,
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
          {/* Top Section: Blue background area */}
          <View style={styles.topSection}>
            {!isAuthenticated && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.replace("/")}
              >
                <Ionicons name="arrow-back" size={20} color="#2b62f1" />
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

          {/* Login Card: White background area extending to bottom */}
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
                placeholderTextColor="#999"
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

            {/* Spacer to ensure the card feels full even on very tall screens */}
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
    paddingBottom: 10,
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
    height: width * 0.5,
  },
  illustration: {
    width: "75%",
    height: "100%",
  },
  loginCard: {
    backgroundColor: "#fff",
    flex: 1, // Stretches to the bottom of the ScrollView
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24, // Account for bottom area
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
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2b62f1",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fb",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 55,
    marginBottom: 30,
  },
  countryCode: {
    fontSize: 16,
    color: "#666",
    marginRight: 10,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
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