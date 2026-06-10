// utils/thermalPrinter.ts

import { Alert } from "react-native";
import {
  BluetoothEscposPrinter,
  BluetoothManager,
} from "@vardrz/react-native-bluetooth-escpos-printer";
import { getDashboard } from "../constants/dashboard.api";
import { setConnectedPrinter, getPaperSize } from "./printerManager";

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

    /* ---------------- GST (SAFE ADDITION) ---------------- */
    const taxPercentage = bill.taxPercentage || 0;
    const taxAmount = (subTotal * taxPercentage) / 100;
    const cgst = taxAmount / 2;
    const sgst = taxAmount / 2;
    /* ---------------------------------------------------- */

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

    /* ---------------- GST PRINT (SAFE) ---------------- */
    if (taxPercentage > 0 && taxAmount > 0) {
      await BluetoothEscposPrinter.printText(
        `CGST (${taxPercentage / 2}%):  Rs.${cgst}\n\r`,
        {}
      );
      await BluetoothEscposPrinter.printText(
        `SGST (${taxPercentage / 2}%):  Rs.${sgst}\n\r`,
        {}
      );
    }
    /* -------------------------------------------------- */

    await BluetoothEscposPrinter.printText(
      `Total:        Rs.${totalAmount}\n\r`,
      { bold: true }
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
   

    if (upiId) {
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
        shopName
      )}&am=${totalAmount}&cu=INR`;
      await BluetoothEscposPrinter.printText("\n\rScan QR to Pay:\n\r", {});
      await BluetoothEscposPrinter.printQRCode(
        upiLink,
        240,
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
export const printTestBill = async (paperSize: "58" | "80" = "58"): Promise<void> => {
  const dummyBill = {
    dailyBillNumber: "T-01",
    subTotal: 200,
    taxPercentage: 5,
    totalAmount: 210,
    discount: 0,
    paidAmount: 210,
    paymentStatus: "PAID",
    createdAt: new Date().toISOString(),
    items: [
      { name: "Milk", quantity: 2, unit: "liter", price: 60, total: 120 },
      { name: "Eggs", quantity: 1, unit: "dozen", price: 80, total: 80 },
    ],
  };
  
  if (paperSize === "80") {
    await printBill80mm(dummyBill);
  } else {
    await printBill(dummyBill);
  }
};

/**
 * Print bill using 80mm paper template (48 chars width)
 */
export const printBill80mm = async (bill: any): Promise<void> => {
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

    const taxPercentage = bill.taxPercentage || 0;
    const taxAmount = (subTotal * taxPercentage) / 100;
    const cgst = taxAmount / 2;
    const sgst = taxAmount / 2;

    const DIVIDER_HEAVY = "================================================\n\r"; // 48 chars
    const DIVIDER_LIGHT = "------------------------------------------------\n\r";

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

    await BluetoothEscposPrinter.printText(DIVIDER_HEAVY, {});

    // Bill Info
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.LEFT
    );
    await BluetoothEscposPrinter.printText(
      `Bill No: #${bill.dailyBillNumber || "N/A"}\n\r`,
      {}
    );

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

    await BluetoothEscposPrinter.printText(
      `Customer: ${bill.customerId?.name || "Walk-in"}\n\r`,
      {}
    );
    await BluetoothEscposPrinter.printText(DIVIDER_HEAVY, {});

    // Table Header - 4 columns for 80mm
    await BluetoothEscposPrinter.printColumn(
      [22, 10, 8, 8],
      [
        BluetoothEscposPrinter.ALIGN.LEFT,
        BluetoothEscposPrinter.ALIGN.CENTER,
        BluetoothEscposPrinter.ALIGN.RIGHT,
        BluetoothEscposPrinter.ALIGN.RIGHT,
      ],
      ["Item", "Qty", "Rate", "Amt"],
      { bold: true }
    );
    await BluetoothEscposPrinter.printText(DIVIDER_LIGHT, {});

    // Item Loop
    for (const item of bill.items || []) {
      let name = item.name || "Item";
      if (name.length > 21) name = name.substring(0, 20) + ".";

      const shorthand = getUnitShorthand(item.unit);
      const qtyAndUnit = `${item.quantity || 1} ${shorthand}`;
      const rate = `${item.price || 0}`;
      const amount = `${item.total || 0}`;

      await BluetoothEscposPrinter.printColumn(
        [22, 10, 8, 8],
        [
          BluetoothEscposPrinter.ALIGN.LEFT,
          BluetoothEscposPrinter.ALIGN.CENTER,
          BluetoothEscposPrinter.ALIGN.RIGHT,
          BluetoothEscposPrinter.ALIGN.RIGHT,
        ],
        [name, qtyAndUnit, rate, amount],
        {}
      );
    }

    await BluetoothEscposPrinter.printText(DIVIDER_HEAVY, {});

    // Totals
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.RIGHT
    );
    await BluetoothEscposPrinter.printText(
      `Sub Total:                           Rs.${subTotal}\n\r`,
      {}
    );

    if (discount > 0) {
      await BluetoothEscposPrinter.printText(
        `Discount:                           -Rs.${discount}\n\r`,
        {}
      );
    }

    if (taxPercentage > 0 && taxAmount > 0) {
      await BluetoothEscposPrinter.printText(
        `CGST (${taxPercentage / 2}%):                         Rs.${cgst}\n\r`,
        {}
      );
      await BluetoothEscposPrinter.printText(
        `SGST (${taxPercentage / 2}%):                         Rs.${sgst}\n\r`,
        {}
      );
    }

    await BluetoothEscposPrinter.printText(
      `Total:                               Rs.${totalAmount}\n\r`,
      { bold: true }
    );

    if (paidAmount > 0) {
      await BluetoothEscposPrinter.printText(
        `Paid:                                Rs.${paidAmount}\n\r`,
        {}
      );
    }

    if (remaining > 0) {
      await BluetoothEscposPrinter.printText(
        `Balance Due:                          Rs.${remaining}\n\r`,
        { bold: true }
      );
    }

    // Status & QR
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER
    );
    await BluetoothEscposPrinter.printText(DIVIDER_HEAVY, {});

    if (upiId) {
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
        shopName
      )}&am=${totalAmount}&cu=INR`;
      await BluetoothEscposPrinter.printText("\n\rScan QR to Pay:\n\r", {});
      await BluetoothEscposPrinter.printQRCode(
        upiLink,
        300, // Larger QR for 80mm
        BluetoothEscposPrinter.ERROR_CORRECTION.L
      );
    }

    await BluetoothEscposPrinter.printText(
      "Thank you! Visit again\n\r\n\r\n\r\n\r\n\r\n\r",
      {}
    );
    await BluetoothEscposPrinter.cutOnePoint();

    Alert.alert("Success", "Bill printed (80mm)!");
  } catch (error: any) {
    Alert.alert("Print Failed", error?.message || "Check connection.");
    throw error;
  }
};

/**
 * Auto-print bill using the saved paper size preference.
 * This is what billing screens should call — it reads AsyncStorage
 * and routes to the correct 58mm or 80mm template automatically.
 */
export const printBillAuto = async (bill: any): Promise<void> => {
  const size = await getPaperSize();
  if (size === "80") {
    await printBill80mm(bill);
  } else {
    await printBill(bill);
  }
};