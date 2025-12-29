import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { getDashboard } from "../constants/dashboard.api";
import { formatRupee } from "./formatCurrency";
import { formatDate } from "./formatDate";

export async function printBillPdf58mm(bill: any) {
  if (!bill) return;

  /* =========================
     1️⃣ FETCH SHOP DETAILS (NAME + UPI)
  ========================= */
  let shopName = "STORE";
  let upiId: string | null = null;

  try {
    const res = await getDashboard();
    const shop = res?.data?.dashboard?.shop;
    if (shop) {
      shopName = shop.shopName || shopName;
      upiId = shop.upiId || null;
    }
  } catch (err) {
    console.warn("Failed to fetch shop details, using fallback");
  }

  /* =========================
     2️⃣ CALCULATE DUE & TIME
  ========================= */
  const dueAmount = bill.totalAmount
  const billTime = new Date(bill.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  /* =========================
     3️⃣ GENERATE UPI LINK & QR (only if due > 0 and UPI exists)
  ========================= */
  let upiLink = "";
  let qrCodeUrl = "";

  if (upiId) {
    upiLink = `upi://pay?pa=${upiId}`
      + `&pn=${encodeURIComponent(shopName)}`
      + `&am=${dueAmount}`
      + `&cu=INR`
      + `&tn=${encodeURIComponent(`Bill #${bill.dailyBillNumber}`)}`;

    // Reliable, fast, free QR API — 140x140 fits perfectly on 58mm
    qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&ecc=M&data=${encodeURIComponent(upiLink)}`;
  }

  /* =========================
     4️⃣ OPTIMIZED 58MM THERMAL HTML
  ========================= */
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 0; size: 58mm auto; }

  body {
    margin: 0;
    padding: 8px 6px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    line-height: 1.4;
    color: #000;
  }

  .center { text-align: center; }
  .bold { font-weight: bold; }

  .shop-name {
    font-size: 17px;
    font-weight: bold;
    margin-bottom: 4px;
    word-wrap: break-word;
  }

  .header-info { font-size: 11.5px; margin-bottom: 4px; }

  .divider {
    border-top: 1px dashed #000;
    margin: 10px 0;
  }

  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  td { padding: 2px 0; vertical-align: top; }

  .qty { width: 18%; }
  .price { width: 40%; text-align: right; }
  .total { width: 42%; text-align: right; }

  .summary-table td {
    padding: 3px 0;
    font-size: 13px;
  }

  .total-row td {
    font-size: 15.5px;
    font-weight: bold;
    padding-top: 8px;
    border-top: 1px dashed #000;
  }

  .qr-section {
    margin: 16px 0;
    text-align: center;
  }

  .qr-section img {
    width: 50px;
    height: 50px;
    image-rendering: pixelated; /* Sharper on thermal */
  }

  .qr-note {
    font-size: 12px;
    margin-top: 6px;
    font-weight: bold;
  }

  .footer {
    margin-top: 16px;
    font-size: 12px;
    text-align: center;
    line-height: 1.5;
  }

  * { box-sizing: border-box; }
</style>
</head>

<body>
  <div class="center shop-name bold">${shopName}</div>
  <div class="center header-info">Bill #${bill.dailyBillNumber}</div>
  <div class="center header-info">${formatDate(bill.createdAt)} | ${billTime}</div>

  <div class="divider"></div>

  <table>
    ${bill.items
      .map(
        (item: any) => `
      <tr>
        <td colspan="3" class="bold">${item.name}</td>
      </tr>
      <tr>
        <td class="qty">${item.quantity} ×</td>
        <td class="price">${formatRupee(item.price)}</td>
        <td class="total">${formatRupee(item.total)}</td>
      </tr>
    `
      )
      .join("")}
  </table>

  <div class="divider"></div>

  <table class="summary-table">
    <tr>
      <td>Subtotal</td>
      <td class="total">${formatRupee(bill.subTotal)}</td>
    </tr>
    ${bill.discount > 0 ? `
    <tr>
      <td>Discount</td>
      <td class="total">-${formatRupee(bill.discount)}</td>
    </tr>` : ""}
    <tr>
      <td>Paid</td>
      <td class="total">${formatRupee(bill.paidAmount)}</td>
    </tr>
    <tr class="total-row">
      <td>NET TOTAL</td>
      <td class="total">${formatRupee(bill.totalAmount)}</td>
    </tr>
  </table>

  <!-- UPI QR Code Section -->
  ${qrCodeUrl ? `
  <div class="divider"></div>
  <div class="qr-section">
    <img src="${qrCodeUrl}" alt="UPI QR Code" />
    <div class="qr-note">Scan to Pay ₹${dueAmount}</div>
  </div>` : ""}

  <div class="divider"></div>

  <div class="footer">
    Thank you for shopping! 🙏<br/>
    <b>Visit Again</b>
  </div>

  <!-- Extra space for clean cut -->
  <div style="height: 40px;"></div>
</body>
</html>
`;

  try {
    const { uri } = await Print.printToFileAsync({
      html,
      width: 150, // Safe printable width for 58mm thermal (prevents cutting)
    });

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Print Thermal Bill (58mm)",
      UTI: "com.adobe.pdf",
    });
  } catch (error) {
    console.error("Thermal print error:", error);
  }
}