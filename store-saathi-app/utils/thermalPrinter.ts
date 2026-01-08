// utils/thermalPrinter.ts

import { Alert } from "react-native";
import {
  BluetoothEscposPrinter,
  BluetoothManager,
} from "@vardrz/react-native-bluetooth-escpos-printer";
import { getDashboard } from "../constants/dashboard.api";
import { setConnectedPrinter } from "./printerManager";

/**
 * Helper to convert long unit names to shorthand for receipt space
 */
const getUnitShorthand = (unit: string): string => {
  const lowerUnit = (unit || "").toLowerCase().trim();
  switch (lowerUnit) {
    case "liter":
    case "liters":
    case "litre":
    case "litres":
      return "ltr";
    case "dozen":
    case "dozens":
      return "dzn";
    case "kilogram":
    case "kilograms":
    case "kg":
      return "kg";
    case "piece":
    case "pieces":
      return "pcs";
    default:
      return lowerUnit || "unit";
  }
};

/**
 * Connect to a Bluetooth thermal printer
 */
export const connectPrinter = async (
  address: string,
  name?: string
): Promise<void> => {
  try {
    const isEnabled = await BluetoothManager.isBluetoothEnabled();
    if (!isEnabled) {
      Alert.alert("Bluetooth Off", "Please turn on Bluetooth and try again.");
      return;
    }

    let connected = false;

    try {
      await BluetoothManager.connect(address);
      connected = true;
    } catch (err: any) {
      console.log("Normal connection failed:", err.message);
    }

    if (!connected) {
      try {
        await BluetoothManager.connect(address + ",1");
        connected = true;
      } catch (err: any) {
        console.log("Channel 1 hack failed:", err.message);
      }
    }

    if (connected) {
      await setConnectedPrinter(address, name);
      return;
    }

    Alert.alert("Connection Failed", "Please ensure printer is on and paired.");
    throw new Error("Failed to connect");
  } catch (error: any) {
    throw error;
  }
};

/**
 * Print full bill
 */
export const printBill = async (bill: any): Promise<void> => {
  try {
    const dashboardResponse = await getDashboard();
    const shop = dashboardResponse.data.dashboard.shop;

    const shopName = shop.shopName || "Our Shop";
    const upiId = shop.upiId || "";
    const gstNumber = shop.gstNumber || "";
    const address = shop.address || "";
    const mobileNumber = shop.mobileNumber || "";

    const subTotal = bill.subTotal || bill.totalAmount || 0;
    const discount = bill.discount || 0;
    const totalAmount = bill.totalAmount || 0;
    const paidAmount = bill.paidAmount || 0;
    const remaining = totalAmount - paidAmount;

    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER
    );
    await BluetoothEscposPrinter.setBlob(0);

    // Header
    await BluetoothEscposPrinter.printText(
      `${shopName.toUpperCase()}\n\r`,
      { bold: true }
    );

    if (address) {
      await BluetoothEscposPrinter.printText(`${address}\n\r`, {});
    }

    if (mobileNumber) {
      await BluetoothEscposPrinter.printText(
        `Phone: +91 ${mobileNumber}\n\r`,
        {}
      );
    }

    if (gstNumber) {
      await BluetoothEscposPrinter.printText(`GSTIN: ${gstNumber}\n\r`, {});
    }

    await BluetoothEscposPrinter.printText(
      "================================\n\r",
      {}
    );

    // Bill Info
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.LEFT
    );
    await BluetoothEscposPrinter.printText(
      `Bill No: #${bill.dailyBillNumber || "N/A"}\n\r`,
      {}
    );

    // --- FIXED TIME FORMATTING (12-HOUR AM/PM) ---
    const dateObj = new Date(bill.createdAt);
    const datePart = dateObj.toLocaleDateString();

    const timePart = dateObj
      .toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .replace(/\u202f/g, " ");

    await BluetoothEscposPrinter.printText(
      `Date: ${datePart} ${timePart}\n\r`,
      {}
    );
    // --------------------------------------------

    await BluetoothEscposPrinter.printText(
      `Customer: ${bill.customerId?.name || "Walk-in"}\n\r`,
      {}
    );
    await BluetoothEscposPrinter.printText(
      "================================\n\r",
      {}
    );

    // Table Header
    await BluetoothEscposPrinter.printColumn(
      [14, 8, 10],
      [
        BluetoothEscposPrinter.ALIGN.LEFT,
        BluetoothEscposPrinter.ALIGN.CENTER,
        BluetoothEscposPrinter.ALIGN.RIGHT,
      ],
      ["Item", "Qty", "Amount"],
      { bold: true }
    );
    await BluetoothEscposPrinter.printText(
      "--------------------------------\n\r",
      {}
    );

    // Item Loop
    for (const item of bill.items || []) {
      let name = item.name || "Item";
      if (name.length > 13) name = name.substring(0, 12) + ".";

      const shorthand = getUnitShorthand(item.unit);
      const qtyAndUnit = `${item.quantity || 1} ${shorthand}`;
      const amount = `Rs.${item.total || 0}`;

      await BluetoothEscposPrinter.printColumn(
        [14, 8, 10],
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        [name, qtyAndUnit, amount],
        {}
      );
    }

    await BluetoothEscposPrinter.printText(
      "================================\n\r",
      {}
    );

    // Totals
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.RIGHT
    );
    await BluetoothEscposPrinter.printText(
      `Sub Total:    Rs.${subTotal}\n\r`,
      {}
    );

    if (discount > 0) {
      await BluetoothEscposPrinter.printText(
        `Discount:     -Rs.${discount}\n\r`,
        {}
      );
    }

    await BluetoothEscposPrinter.printText(
      `Total:        Rs.${totalAmount}\n\r`,
      { bold: true }
    );
    await BluetoothEscposPrinter.printText(
      `Paid:         Rs.${paidAmount}\n\r`,
      {}
    );

    if (remaining > 0) {
      await BluetoothEscposPrinter.printText(
        `Balance Due:  Rs.${remaining}\n\r`,
        { bold: true }
      );
    }

    // Status & QR
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER
    );
    await BluetoothEscposPrinter.printText("\n\r", {});
    await BluetoothEscposPrinter.printText(
      bill.paymentStatus === "PAID"
        ? "*** PAID IN FULL ***\n\r"
        : "*** PARTIAL PAYMENT ***\n\r",
      { bold: true }
    );

    if (upiId) {
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
        shopName
      )}&am=${totalAmount}&cu=INR`;
      await BluetoothEscposPrinter.printText("\n\rScan QR to Pay:\n\r", {});
      await BluetoothEscposPrinter.printQRCode(
        upiLink,
        185,
        BluetoothEscposPrinter.ERROR_CORRECTION.L
      );
    }

    await BluetoothEscposPrinter.printText(
      "\n\r\n\rThank you! Visit again\n\r\n\r\n\r\n\r",
      {}
    );
    await BluetoothEscposPrinter.cutOnePoint();

    Alert.alert("Success", "Bill printed!");
  } catch (error: any) {
    Alert.alert("Print Failed", error?.message || "Check connection.");
    throw error;
  }
};

/**
 * Test print
 */
export const printTestBill = async (): Promise<void> => {
  const dummyBill = {
    dailyBillNumber: "T-01",
    subTotal: 200,
    totalAmount: 190,
    discount: 10,
    paidAmount: 190,
    paymentStatus: "PAID",
    createdAt: new Date().toISOString(),
    items: [
      { name: "Milk", quantity: 2, unit: "liter", total: 120 },
      { name: "Eggs", quantity: 1, unit: "dozen", total: 80 },
    ],
  };
  await printBill(dummyBill);
};
