import { Linking, Alert } from "react-native";

export async function callCustomer(phone: string) {
  if (!phone) {
    Alert.alert("Error", "Phone number not available");
    return;
  }

  const url = `tel:${phone}`;

  const canOpen = await Linking.canOpenURL(url);

  if (!canOpen) {
    Alert.alert("Calling not supported on this device");
    return;
  }

  await Linking.openURL(url);
}
