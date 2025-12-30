import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BluetoothManager } from "@vardrz/react-native-bluetooth-escpos-printer";

const STORAGE_KEY = "@selected_thermal_printer";

type PrinterInfo = {
  address: string;
  name?: string;
};

let cachedPrinter: PrinterInfo | null = null;

/**
 * Load saved printer from storage (lazy)
 */
const loadSavedPrinter = async (): Promise<void> => {
  if (cachedPrinter !== null) return;

  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) {
      cachedPrinter = JSON.parse(saved);
      console.log("Loaded saved printer:", cachedPrinter.name || cachedPrinter.address);
    }
  } catch (error) {
    console.warn("Failed to load saved printer:", error);
  }
};

/**
 * Scan for paired and nearby thermal printers
 */
export const scanThermalPrinters = async (): Promise<Array<{ address: string; name?: string; type: "Paired" | "Nearby" }>> => {
  try {
    // Ensure Bluetooth is enabled
    const isEnabled = await BluetoothManager.isBluetoothEnabled();
    if (!isEnabled) {
      Alert.alert("Bluetooth Disabled", "Please turn on Bluetooth to scan for printers.");
      return [];
    }

    const result = await BluetoothManager.scanDevices();
    const parsed = JSON.parse(result);

    const devices = [
      ...(parsed.paired || []).map((d: any) => ({ ...d, type: "Paired" as const })),
      ...(parsed.found || []).map((d: any) => ({ ...d, type: "Nearby" as const })),
    ];

    if (devices.length === 0) {
      Alert.alert(
        "No Printers Found",
        "Tips:\n• Power on your thermal printer\n• Hold the FEED button while turning on until it beeps/flashes\n• Make sure Location permission is granted"
      );
    }

    return devices;
  } catch (error: any) {
    console.error("Scan failed:", error);
    Alert.alert("Scan Error", error?.message || "Unable to scan for printers. Try again.");
    return [];
  }
};

/**
 * Save printer after successful connection
 */
export const setConnectedPrinter = async (address: string, name?: string): Promise<void> => {
  cachedPrinter = { address, name: name || "Thermal Printer" };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedPrinter));
    console.log("Printer saved:", cachedPrinter.name || address);
  } catch (error) {
    console.warn("Failed to save printer:", error);
  }
};

/**
 * Get current printer (loads from storage if needed)
 */
export const getConnectedThermalPrinter = async (): Promise<PrinterInfo | null> => {
  await loadSavedPrinter();
  return cachedPrinter;
};

/**
 * Check if printer is connected
 */
export const isThermalPrinterConnected = async (): Promise<boolean> => {
  await loadSavedPrinter();
  return cachedPrinter !== null;
};

/**
 * Clear saved printer (for reset or switching printers)
 */
export const clearSavedPrinter = async (): Promise<void> => {
  cachedPrinter = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    Alert.alert("Printer Reset", "Saved printer cleared. You can scan and connect a new one.");
  } catch (error) {
    console.warn("Failed to clear printer:", error);
  }
};