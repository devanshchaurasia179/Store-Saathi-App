import { Linking, Alert } from "react-native";

export async function sendWhatsAppMessage(
  mobileNumber: string,
  message: string
) {
  if (!mobileNumber) {
    Alert.alert("Error", "Phone number not available");
    return;
  }

  // Remove spaces & ensure country code
  const formattedPhone = mobileNumber.replace(/\D/g, "");

  const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(
    message
  )}`;

  const canOpen = await Linking.canOpenURL(url);

  if (!canOpen) {
    Alert.alert("WhatsApp not installed");
    return;
  }

  await Linking.openURL(url);
}
