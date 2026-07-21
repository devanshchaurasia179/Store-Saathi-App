import { Slot } from "expo-router";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../providers/AuthProvider";
import { LanguageProvider } from "../providers/LanguageProvider";
import { BillingTabsProvider } from "../providers/BillingTabsProvider";
import AuthGate from "../providers/AuthGate";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          {/* Wrap EVERYTHING in AuthGate. 
              Inside AuthGate, we will handle the redirection logic.
          */}
          <AuthGate>
            <BillingTabsProvider>
              <Slot />
              <Toast />
            </BillingTabsProvider>
          </AuthGate>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}