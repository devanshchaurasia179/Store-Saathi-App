import { FirebaseAuthTypes } from "@react-native-firebase/auth";

declare global {
  // Temporary storage for Firebase confirmation result between login and verify-otp screens
  var __firebaseConfirmation:
    | FirebaseAuthTypes.ConfirmationResult
    | undefined;
}
