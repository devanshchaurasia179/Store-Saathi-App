import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { useAuth } from "../providers/AuthProvider";

export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // 🔑 ROOT LOGIC
  useEffect(() => {
    if (loading) return;

    // ✅ Logged in → dashboard
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, loading]);

  // ⏳ Prevent UI flash while checking auth
  if (loading) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />

        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Image
              source={require("../assets/images/welcome_illustration.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>
              <Text style={styles.storeText}>Store </Text>
              <Text style={styles.saathiText}>Saathi</Text>
            </Text>
            <Text style={styles.subtitle}>
              Your Store’s One-Stop Solution for Billing, Inventory & Analytics
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/language")}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    marginBottom: 30,
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 42,
    fontFamily:
      Platform.OS === "ios"
        ? "Helvetica Neue"
        : "sans-serif-condensed",
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 15,
  },
  storeText: {
    color: "#64748B",
  },
  saathiText: {
    color: "#1E3A8A",
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    lineHeight: 24,
    fontFamily:
      Platform.OS === "ios" ? "System" : "sans-serif",
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  button: {
    backgroundColor: "#1E3A8A",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
