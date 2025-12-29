import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { getDashboard } from "../constants/dashboard.api";
import { formatRupee } from "./formatCurrency";
import { formatDate } from "./formatDate";

export async function printBillPdf58mm(bill: any) {
  if (!bill) return;

  /* =========================
     1️⃣ FETCH SHOP NAME FROM API
  ========================= */
  let shopName = "STORE"; // fallback

  try {
    const res = await getDashboard();
    const shop = res?.data?.dashboard?.shop;
    if (shop?.shopName) {
      shopName = shop.shopName;
    }
  } catch (err) {
    console.warn("Failed to fetch shop name, using fallback");
  }

  /* =========================
     2️⃣ TIME FORMATTING
  ========================= */
  const billTime = new Date(bill.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  /* =========================
     3️⃣ OPTIMIZED HTML FOR 58MM THERMAL
  ========================= */
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { 
    margin: 0; 
    size: 58mm auto; 
  }

  body {
    width: 100%;
    margin: 0;
    padding: 8px 6px; /* Reduced side padding — safer for thermal */
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    line-height: 1.4;
    color: #000;
  }

  .center { text-align: center; }
  .bold { font-weight: bold; }
  .shop-name { 
    font-size: 17px; /* Slightly smaller to avoid overflow */
    font-weight: bold; 
    margin-bottom: 4px;
    line-height: 1.2;
    word-wrap: break-word;
  }
  .header-info { 
    font-size: 11.5px; 
    margin-bottom: 4px; 
  }

  .divider {
    border-top: 1px dashed #000;
    margin: 10px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
  }

  td {
    padding: 2px 0;
    vertical-align: top;
  }

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

  .footer {
    margin-top: 16px;
    font-size: 12px;
    text-align: center;
    line-height: 1.5;
  }

  /* Prevent any overflow */
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

  <div class="divider"></div>

  <div class="footer">
    Thank you for shopping! 🙏<br/>
    <b>Visit Again</b>
  </div>

  <!-- Extra space for paper cut -->
  <div style="height: 40px;"></div>
</body>
</html>
`;

  try {
    const { uri } = await Print.printToFileAsync({
      html,
      // Critical: Use exact printable width in points
      // 58mm paper → actual printable ~52mm → ~147-150 points is safe
      width: 150, // Safer than 164.4 — prevents right-side clipping
      // height is auto for roll paper
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