import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BluetoothManager } from "@vardrz/react-native-bluetooth-escpos-printer";

const STORAGE_KEY = "@selected_thermal_printer";
const PAPER_SIZE_KEY = "@printer_paper_size";

export type PaperSize = "58" | "80";

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
      console.log(
        "Loaded saved printer:",
        cachedPrinter.name || cachedPrinter.address
      );
    }
  } catch (error) {
    console.warn("Failed to load saved printer:", error);
  }
};

/**
 * Safely disconnect ONLY if we have a saved printer address
 * Prevents TurboModule crash: "disconnect called with 0 arguments"
 */
export const safeDisconnectPrinter = async (): Promise<void> => {
  if (!cachedPrinter?.address) {
    console.log("No printer saved → skipping disconnect");
    return;
  }

  try {
    await BluetoothManager.disconnect(cachedPrinter.address); // Always pass address!
    console.log("Successfully disconnected from:", cachedPrinter.address);
  } catch (error: any) {
    console.warn(
      "Disconnect failed (ignored):",
      error.message || error
    );
    // Do NOT throw or crash — disconnect failing is normal when printer is off
  }
};

/**
 * Scan for paired and nearby thermal printers
 */
export const scanThermalPrinters = async (): Promise<
  Array<{ address: string; name?: string; type: "Paired" | "Nearby" }>
> => {
  try {
    const isEnabled = await BluetoothManager.isBluetoothEnabled();
    if (!isEnabled) {
      Alert.alert(
        "Bluetooth Disabled",
        "Please turn on Bluetooth to scan for printers."
      );
      return [];
    }

    const result = await BluetoothManager.scanDevices();
    const parsed = JSON.parse(result);

    const devices = [
      ...(parsed.paired || []).map((d: any) => ({
        ...d,
        type: "Paired" as const,
      })),
      ...(parsed.found || []).map((d: any) => ({
        ...d,
        type: "Nearby" as const,
      })),
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
    Alert.alert(
      "Scan Error",
      error?.message || "Unable to scan for printers. Try again."
    );
    return [];
  }
};

/**
 * Save printer after successful connection
 */
export const setConnectedPrinter = async (
  address: string,
  name?: string
): Promise<void> => {
  cachedPrinter = { address, name: name || "Thermal Printer" };
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(cachedPrinter)
    );
    console.log("Printer saved:", cachedPrinter.name || address);
  } catch (error) {
    console.warn("Failed to save printer:", error);
  }
};

/**
 * Get current saved printer
 */
export const getConnectedThermalPrinter = async (): Promise<PrinterInfo | null> => {
  await loadSavedPrinter();
  return cachedPrinter;
};

/**
 * Check if a printer is saved (not necessarily connected)
 */
export const isThermalPrinterSaved = async (): Promise<boolean> => {
  await loadSavedPrinter();
  return cachedPrinter !== null;
};

/**
 * Clear saved printer
 */
export const clearSavedPrinter = async (): Promise<void> => {
  cachedPrinter = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    Alert.alert(
      "Printer Reset",
      "Saved printer cleared. You can scan and connect a new one."
    );
  } catch (error) {
    console.warn("Failed to clear printer:", error);
  }
};

/**
 * 🔁 Reconnect saved printer WITHOUT scanning
 * Used when user taps printer chip in header
 */
export const reconnectSavedPrinter = async (): Promise<boolean> => {
  await loadSavedPrinter();

  if (!cachedPrinter?.address) {
    console.log("No saved printer to reconnect");
    return false;
  }

  try {
    const isEnabled = await BluetoothManager.isBluetoothEnabled();
    if (!isEnabled) {
      Alert.alert(
        "Bluetooth Disabled",
        "Please turn on Bluetooth to connect printer."
      );
      return false;
    }

    await BluetoothManager.connect(cachedPrinter.address);
    console.log("Reconnected to printer:", cachedPrinter.address);
    return true;
  } catch (error: any) {
    console.warn(
      "Reconnect failed:",
      error.message || error
    );
    return false;
  }
};

/**
 * Save paper size preference (58mm or 80mm)
 */
export const setPaperSize = async (size: PaperSize): Promise<void> => {
  try {
    await AsyncStorage.setItem(PAPER_SIZE_KEY, size);
    console.log("Paper size saved:", size);
  } catch (error) {
    console.warn("Failed to save paper size:", error);
  }
};

/**
 * Get saved paper size preference (defaults to 58mm)
 */
export const getPaperSize = async (): Promise<PaperSize> => {
  try {
    const saved = await AsyncStorage.getItem(PAPER_SIZE_KEY);
    if (saved === "58" || saved === "80") return saved;
  } catch (error) {
    console.warn("Failed to load paper size:", error);
  }
  return "58"; // default fallback
};
