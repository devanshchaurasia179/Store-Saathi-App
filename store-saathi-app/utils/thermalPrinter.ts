import { Alert } from "react-native";
import {
  BluetoothEscposPrinter,
  BluetoothManager,
} from "@vardrz/react-native-bluetooth-escpos-printer";
import { getDashboard } from "../constants/dashboard.api";

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
 * Print full bill - Updated with subtotal, discount, total breakdown + QR always for full amount
 */
export const printBill = async (bill: any): Promise<void> => {
  try {
    // Fetch fresh dashboard data for shop details and UPI
    const dashboardResponse = await getDashboard();
    const shop = dashboardResponse.data.dashboard.shop;
    const shopName = shop.shopName || "Our Shop";
    const upiId = shop.upiId || "yourupi@bank";

    // Calculate values (fallback to 0 if missing)
    const subTotal = bill.subTotal || bill.totalAmount || 0;
    const discount = bill.discount || 0;
    const totalAmount = bill.totalAmount || 0;
    const paidAmount = bill.paidAmount || 0;
    const remaining = totalAmount - paidAmount;

    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.setBlob(0);

    // Shop Header
    await BluetoothEscposPrinter.printText(`${shopName.toUpperCase()}\n\r`, {});
    await BluetoothEscposPrinter.printText("Amritsar, Punjab\n\r", {});
    await BluetoothEscposPrinter.printText("Phone: +91 98765 43210\n\r", {});
    await BluetoothEscposPrinter.printText("================================\n\r", {});

    // Bill Info
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
    await BluetoothEscposPrinter.printText(`Bill No: #${bill.dailyBillNumber || "N/A"}\n\r`, {});
    
    // Clean date/time format
    const dateObj = new Date(bill.createdAt);
    const formattedDate = `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    await BluetoothEscposPrinter.printText(`Date: ${formattedDate}\n\r`, {});
    
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
    await BluetoothEscposPrinter.printText("--------------------------------\n\r", {});

    // Items
    for (const item of bill.items || []) {
      let name = item.name || "Item";
      if (name.length > 17) {
        name = name.substring(0, 16) + "."; // Truncate to fit
      }
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

    // Totals Section - Right aligned with proper breakdown
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

    // Payment Status
    await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
    await BluetoothEscposPrinter.printText("\n\r", {});
    await BluetoothEscposPrinter.printText(
      bill.paymentStatus === "PAID" ? "*** PAID IN FULL ***\n\r" : "*** PARTIAL PAYMENT ***\n\r",
      {}
    );

    // QR Code - ALWAYS print for the FULL total amount (even if fully paid)
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${totalAmount}&cu=INR`;
    await BluetoothEscposPrinter.printText("\n\rScan QR to Pay:\n\r", {});
    await BluetoothEscposPrinter.printQRCode(upiLink, 140, BluetoothEscposPrinter.ERROR_CORRECTION.L);

    // Footer
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
    subTotal: 235,
    totalAmount: 225,
    discount: 10,
    paidAmount: 200,
    paymentStatus: "PARTIAL",
    createdAt: new Date().toISOString(),
    customerId: { name: "Test Customer", mobileNumber: "1234567890" },
    items: [
      { name: "Thermal rolls", quantity: 1, total: 235 },
    ],
  };
  await printBill(dummyBill);
};