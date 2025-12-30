import { Alert } from "react-native";
import {
  BluetoothEscposPrinter,
  BluetoothManager,
} from "@vardrz/react-native-bluetooth-escpos-printer";

/**
 * Connect to a Bluetooth thermal printer
 * Hack: Some generic printers need ",1" appended to address for SPP channel
 */
export const connectPrinter = async (address: string): Promise<void> => {
  try {
    const isEnabled = await BluetoothManager.isBluetoothEnabled();
    if (!isEnabled) {
      Alert.alert("Bluetooth Disabled", "Please turn on Bluetooth and try again.");
      return;
    }

    // Try normal first, then with ,1 if fails (common fix for generic printers)
    try {
      await BluetoothManager.connect(address);
    } catch (e) {
      console.log("Normal connect failed, trying with ,1...");
      await BluetoothManager.connect(address + ",1"); // Magic fix for many cheap printers
    }

    console.log("✅ Connected successfully to:", address);
  } catch (error: any) {
    console.error("❌ Connection failed:", error);
    Alert.alert(
      "Connection Failed",
      "Tips:\n• Put printer in pairing mode (hold FEED button on power-on)\n• Try pairing in phone Bluetooth settings first\n• Restart printer and phone"
    );
    throw error;
  }
};

/**
 * Print full bill
 */
export const printBill = async (bill: any): Promise<void> => {
  try {
    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.setBlob(0);

    // Header
    await BluetoothEscposPrinter.printText("Jain Biriyani Shop\n\r", {
      widthtimes: 1,
      heigthtimes: 1,
    });
    await BluetoothEscposPrinter.printText("Amritsar, Punjab\n\r", {});
    await BluetoothEscposPrinter.printText("Phone: +91 98765 43210\n\r", {});
    await BluetoothEscposPrinter.printText("================================\n\r", {});

    // Bill Info
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(`Bill No: #${bill.dailyBillNumber || "N/A"}\n\r`, {});
    await BluetoothEscposPrinter.printText(`Date: ${new Date(bill.createdAt).toLocaleString()}\n\r`, {});
    await BluetoothEscposPrinter.printText(`Customer: ${bill.customerId?.name || "Walk-in"}\n\r`, {});
    if (bill.customerId?.mobileNumber) {
      await BluetoothEscposPrinter.printText(`Mobile: ${bill.customerId.mobileNumber}\n\r`, {});
    }
    await BluetoothEscposPrinter.printText("================================\n\r", {});

    // Items Header
    await BluetoothEscposPrinter.printColumn(
      [18, 6, 8],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
      ["Item", "Qty", "Amount"],
      {}
    );
    await BluetoothEscposPrinter.printText("================================\n\r", {});

    // Items
    for (const item of bill.items || []) {
      const name = item.name?.length > 17 ? item.name.substring(0, 16) + "." : item.name || "Item";
      const qty = (item.quantity || 1).toString();
      const amount = `₹${item.total || 0}`;

      await BluetoothEscposPrinter.printColumn(
        [18, 6, 8],
        [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.CENTER, BluetoothEscposPrinter.ALIGN.RIGHT],
        [name, qty, amount],
        {}
      );
    }

    await BluetoothEscposPrinter.printText("================================\n\r", {});

    // Totals
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.RIGHT);
    if ((bill.discount || 0) > 0) {
      await BluetoothEscposPrinter.printText(`Discount:     -₹${bill.discount}\n\r`, {});
    }
    await BluetoothEscposPrinter.printText(`Total:         ₹${bill.totalAmount || 0}\n\r`, { widthtimes: 1 });
    await BluetoothEscposPrinter.printText(`Paid:          ₹${bill.paidAmount || 0}\n\r`, {});
    if ((bill.totalAmount || 0) - (bill.paidAmount || 0) > 0) {
      await BluetoothEscposPrinter.printText(
        `Balance Due:   ₹${(bill.totalAmount || 0) - (bill.paidAmount || 0)}\n\r`,
        { widthtimes: 1 }
      );
    }

    // Status
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText("\n\r", {});
    await BluetoothEscposPrinter.printText(
      bill.paymentStatus === "PAID" ? "*** PAID IN FULL ***\n\r" : "*** PARTIAL PAYMENT ***\n\r",
      { widthtimes: 1 }
    );

    // Pending QR
    if ((bill.totalAmount || 0) - (bill.paidAmount || 0) > 0) {
      const remaining = (bill.totalAmount || 0) - (bill.paidAmount || 0);
      const upiLink = `upi://pay?pa=yourupi@bank&pn=Jain%20Biriyani%20Shop&am=${remaining}&cu=INR`;

      await BluetoothEscposPrinter.printText("\n\rScan to Pay Remaining:\n\r", {});
      await BluetoothEscposPrinter.printQRCode(upiLink, 280, BluetoothEscposPrinter.ERROR_CORRECTION.L);
    }

    // Footer + extra feeds + cut
    await BluetoothEscposPrinter.printText("\n\r\n\r", {});
    await BluetoothEscposPrinter.printText("Thank you for your visit!\n\r", {});
    await BluetoothEscposPrinter.printText("Visit again 😊\n\r\n\r\n\r\n\r", {});
    await BluetoothEscposPrinter.cutOnePoint();

    Alert.alert("🎉 Success!", "Bill printed perfectly!");
  } catch (error: any) {
    console.error("Print error:", error);
    Alert.alert("Print Failed", error?.message || "Check printer connection and try again.");
    throw error;
  }
};

/**
 * Test print
 */
export const printTestBill = async (): Promise<void> => {
  const dummyBill = {
    dailyBillNumber: "TEST001",
    totalAmount: 3950,
    subTotal: 3950,
    discount: 0,
    paidAmount: 3950,
    paymentStatus: "PAID",
    createdAt: new Date().toISOString(),
    customerId: { name: "Test Customer", mobileNumber: "9876543210" },
    items: [
      { name: "Paneer Bhurji", quantity: 1, total: 50 },
      { name: "Thermal Printer", quantity: 1, total: 3900 },
    ],
  };

  await printBill(dummyBill);
};