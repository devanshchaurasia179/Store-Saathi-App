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
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { loginWithSecretKey } from "../constants/auth.api";
import { useAuth } from "../providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function LoginSecretPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [mobileNumber, setMobileNumber] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const cleanMobile = mobileNumber.trim();
    const cleanSecret = secretKey.trim().toUpperCase();

    if (cleanMobile.length !== 10 || cleanSecret.length < 6) {
      Toast.show({
        type: "error",
        text1: "Enter valid mobile number and secret key",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithSecretKey(cleanMobile, cleanSecret);

      if (res?.data?.success) {
        await login(res.data.token);
        Toast.show({
          type: "success",
          text1: "Login successful",
        });
        router.replace("/dashboard");
      } else {
        throw new Error("Login failed");
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.message || "Invalid credentials",
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
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Header */}
          <View style={styles.topSection}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#1E3A8A" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <Text style={styles.title}>Secret Key Login</Text>
              <Text style={styles.subtitle}>Enter your credentials to access your account</Text>
            </View>

            {/* Added Image Here */}
            <View style={styles.imageContainer}>
              <Image
                source={require("../assets/images/login.png")}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Bottom Card Style */}
          <View style={styles.loginCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MOBILE NUMBER</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  keyboardType="number-pad"
                  maxLength={10}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholder="Enter 10 digit number"
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>SECRET KEY</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="key-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  value={secretKey}
                  onChangeText={setSecretKey}
                  placeholder="SS-XXXXXXX"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  spellCheck={false}
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>VERIFY & LOGIN</Text>
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
  headerInfo: {
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E3A8A",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600",
  },
  button: {
    marginTop: 10,
    backgroundColor: "#1E3A8A",
    height: 60,
    borderRadius: 14,
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