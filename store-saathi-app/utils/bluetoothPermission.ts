import { PermissionsAndroid, Platform, Alert } from "react-native";

export const requestBluetoothPermission = async (): Promise<boolean> => {
  if (Platform.OS !== "android") {
    return true; // iOS not supported by this package yet
  }

  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE, // Optional but safe to include
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // Required for scanning on Android 11 and below
    ]);

    const allGranted =
      granted["android.permission.BLUETOOTH_SCAN"] === "granted" &&
      granted["android.permission.BLUETOOTH_CONNECT"] === "granted" &&
      granted["android.permission.ACCESS_FINE_LOCATION"] === "granted";

    if (allGranted) {
      console.log("Bluetooth permissions granted");
      return true;
    } else {
      Alert.alert(
        "Permissions Required",
        "Bluetooth and Location permissions are needed to scan and connect to thermal printers.",
        [{ text: "OK" }]
      );
      return false;
    }
  } catch (err: any) {
    console.warn("Permission error:", err);
    Alert.alert("Error", "Failed to request Bluetooth permissions");
    return false;
  }
};