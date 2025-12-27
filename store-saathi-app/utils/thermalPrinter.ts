import ThermalPrinterModule from "react-native-thermal-receipt-printer";

export async function printBill58mm(bill: any) {
  try {
    const printer = ThermalPrinterModule;

    // 🔵 Connect to paired printer
    await printer.connectPrinter("BT:Printer"); 
    // 👆 replace with actual device name

    const line = "-".repeat(32);

    let receipt = "";

    receipt += "\n";
    receipt += "      YOUR SHOP NAME\n";
    receipt += "   Mobile: 9XXXXXXXXX\n";
    receipt += line + "\n";

    receipt += `Bill No: ${bill.dailyBillNumber}\n`;
    receipt += `Date: ${new Date(bill.createdAt).toLocaleString()}\n`;
    receipt += line + "\n";

    receipt += "Item        Qty  Price\n";
    receipt += line + "\n";

    bill.items.forEach((item: any) => {
      const name = item.name.slice(0, 16).padEnd(16);
      const qty = `${item.quantity}x`.padEnd(4);
      const price = `${item.total}`.padStart(8);
      receipt += `${name}${qty}${price}\n`;
    });

    receipt += line + "\n";

    receipt += `Subtotal:       ${bill.subTotal}\n`;
    if (bill.discount > 0) {
      receipt += `Discount:      -${bill.discount}\n`;
    }

    receipt += line + "\n";
    receipt += `TOTAL:          ${bill.totalAmount}\n`;
    receipt += `Paid:           ${bill.paidAmount}\n`;

    const due = bill.totalAmount - bill.paidAmount;
    if (due > 0) {
      receipt += `Due:            ${due}\n`;
    }

    receipt += line + "\n";
    receipt += "   THANK YOU! VISIT AGAIN\n\n\n";

    // 🖨️ Print
    await printer.printText(receipt);
    await printer.cutPaper();

  } catch (err) {
    console.error("Print error", err);
  }
}
