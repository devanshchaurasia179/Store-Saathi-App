import { Linking, Alert, Platform } from "react-native";

export async function sendWhatsAppMessage(
  mobileNumber: string,
  message: string
) {
  if (!mobileNumber) {
    Alert.alert("Error", "Phone number not available");
    return;
  }

  // Remove all non-digits
  let phone = mobileNumber.replace(/\D/g, "");

  // ✅ Add India country code if missing
  if (phone.length === 10) {
    phone = "91" + phone;
  }

  // ❌ WhatsApp rejects numbers < 11 digits
  if (phone.length < 11) {
    Alert.alert("Invalid Number", "Please include country code");
    return;
  }

  // 🔥 Use universal WhatsApp URL (works better than whatsapp://)
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  const canOpen = await Linking.canOpenURL(url);

  if (!canOpen) {
    Alert.alert("WhatsApp not installed");
    return;
  }

  await Linking.openURL(url);
}
