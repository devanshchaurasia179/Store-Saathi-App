import { Slot } from "expo-router";
import Toast from "react-native-toast-message";
// 1. Import the Provider
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "../providers/AuthProvider";
import { LanguageProvider } from "../providers/LanguageProvider";
import AuthGate from "../providers/AuthGate";

export default function RootLayout() {
  return (
    /* 2. Wrap everything in SafeAreaProvider */
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <AuthGate>
            <Slot />
            {/* 🔔 Toast must be mounted ONCE at root */}
            <Toast />
          </AuthGate>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}