// utils/thermalPrinter.ts

import { Alert } from "react-native";
import {
  BluetoothEscposPrinter,
  BluetoothManager,
} from "@vardrz/react-native-bluetooth-escpos-printer";
import { getDashboard } from "../constants/dashboard.api";
import { setConnectedPrinter } from "./printerManager";

/**
 * Connect to a Bluetooth thermal printer
 * Safely handles both normal and ",1" channel methods without crashing
 */
export const connectPrinter = async (address: string, name?: string): Promise<void> => {
  try {
    const isEnabled = await BluetoothManager.isBluetoothEnabled();
    if (!isEnabled) {
      Alert.alert("Bluetooth Off", "Please turn on Bluetooth and try again.");
      return;
    }

    let connected = false;

    // Step 1: Try normal connection first
    try {
      await BluetoothManager.connect(address);
      connected = true;
      console.log("Connected successfully (normal):", address);
    } catch (err: any) {
      console.log("Normal connection failed:", err.message || "Unknown error");
      // Do NOT throw yet — we will try the hack next
    }

    // Step 2: Only try ",1" hack if normal failed
    if (!connected) {
      try {
        // Some printers require channel 1 — but appending ",1" can crash if not supported
        await BluetoothManager.connect(address + ",1");
        connected = true;
        console.log("Connected successfully using channel 1 hack:", address);
      } catch (err: any) {
        console.log("Channel 1 hack failed (expected on some devices):", err.message || err);
        // This is OK — many devices don't support ",1"
      }
    }

    // Final result
    if (connected) {
      await setConnectedPrinter(address, name);
      console.log("Printer connected and saved:", name || address);
      return; // Success
    }

    // If we reach here: both methods failed
    Alert.alert(
      "Cannot Connect to Printer",
      "Connection failed using both standard and alternate methods.\n\n" +
        "Please try these steps:\n" +
        "1. Turn printer completely off and on\n" +
        "2. Hold FEED button while powering on (enter pairing mode)\n" +
        "3. Go to phone Bluetooth settings → forget the printer → re-pair it\n" +
        "4. Then come back and try connecting again",
      [{ text: "OK" }]
    );

    throw new Error("Failed to connect using available methods");
  } catch (error: any) {
    console.error("Connection failed:", error);
    throw error; // Let UI handle it
  }
};

/**
 * Print full bill — unchanged and safe
 */
export const printBill = async (bill: any): Promise<void> => {
  try {
    const dashboardResponse = await getDashboard();
    const shop = dashboardResponse.data.dashboard.shop;
    const shopName = shop.shopName || "Our Shop";
    const upiId = shop.upiId || "yourupi@bank";

    const subTotal = bill.subTotal || bill.totalAmount || 0;
    const discount = bill.discount || 0;
    const totalAmount = bill.totalAmount || 0;
    const paidAmount = bill.paidAmount || 0;
    const remaining = totalAmount - paidAmount;

    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.setBlob(0);

    await BluetoothEscposPrinter.printText(`${shopName.toUpperCase()}\n\r`, {});
    await BluetoothEscposPrinter.printText("Amritsar, Punjab\n\r", {});
    await BluetoothEscposPrinter.printText("Phone: +91 98765 43210\n\r", {});
    await BluetoothEscposPrinter.printText("================================\n\r", {});

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(`Bill No: #${bill.dailyBillNumber || "N/A"}\n\r`, {});

    const dateObj = new Date(bill.createdAt);
    const formattedDate = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    await BluetoothEscposPrinter.printText(`Date: ${formattedDate}\n\r`, {});

    await BluetoothEscposPrinter.printText(`Customer: ${bill.customerId?.name || "Walk-in"}\n\r`, {});
    if (bill.customerId?.mobileNumber) {
      await BluetoothEscposPrinter.printText(`Mobile: ${bill.customerId.mobileNumber}\n\r`, {});
    }
    await BluetoothEscposPrinter.printText("================================\n\r", {});

    await BluetoothEscposPrinter.printColumn(
      [18, 6, 8],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
      ["Item", "Qty", "Amount"],
      {}
    );
    await BluetoothEscposPrinter.printText("--------------------------------\n\r", {});

    for (const item of bill.items || []) {
      let name = item.name || "Item";
      if (name.length > 17) name = name.substring(0, 16) + ".";
      const qty = (item.quantity || 1).toString();
      const amount = `Rs.${item.total || 0}`;

      await BluetoothEscposPrinter.printColumn(
        [18, 6, 8],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
        [name, qty, amount],
        {}
      );
    }
    await BluetoothEscposPrinter.printText("================================\n\r", {});

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.RIGHT);
    await BluetoothEscposPrinter.printText(`Sub Total:    Rs.${subTotal}\n\r`, {});
    if (discount > 0) {
      await BluetoothEscposPrinter.printText(`Discount:     -Rs.${discount}\n\r`, {});
    }
    await BluetoothEscposPrinter.printText(`Total:        Rs.${totalAmount}\n\r`, {});
    await BluetoothEscposPrinter.printText(`Paid:         Rs.${paidAmount}\n\r`, {});
    if (remaining > 0) {
      await BluetoothEscposPrinter.printText(`Balance Due:  Rs.${remaining}\n\r`, {});
    }

    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText("\n\r", {});
    await BluetoothEscposPrinter.printText(
      bill.paymentStatus === "PAID" ? "*** PAID IN FULL ***\n\r" : "*** PARTIAL PAYMENT ***\n\r",
      {}
    );

    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${totalAmount}&cu=INR`;
    await BluetoothEscposPrinter.printText("\n\rScan QR to Pay:\n\r", {});
    await BluetoothEscposPrinter.printQRCode(upiLink, 140, BluetoothEscposPrinter.ERROR_CORRECTION.L);

    await BluetoothEscposPrinter.printText("\n\r\n\r", {});
    await BluetoothEscposPrinter.printText("Thank you for your visit!\n\r", {});
    await BluetoothEscposPrinter.printText("Visit again 😊\n\r\n\r\n\r\n\r", {});
    await BluetoothEscposPrinter.cutOnePoint();

    Alert.alert("Success!", "Bill printed perfectly!");
  } catch (error: any) {
    console.error("Print error:", error);
    Alert.alert("Print Failed", error?.message || "Check printer power and connection.");
    throw error;
  }
};

/**
 * Test print
 */
export const printTestBill = async (): Promise<void> => {
  const dummyBill = {
    dailyBillNumber: "TEST001",
    subTotal: 235,
    totalAmount: 225,
    discount: 10,
    paidAmount: 200,
    paymentStatus: "PARTIAL",
    createdAt: new Date().toISOString(),
    customerId: { name: "Test Customer", mobileNumber: "1234567890" },
    items: [{ name: "Thermal rolls", quantity: 1, total: 235 }],
  };
  await printBill(dummyBill);
};