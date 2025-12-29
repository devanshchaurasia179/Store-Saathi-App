import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

import { getDashboard } from "../constants/dashboard.api";
import { formatRupee } from "./formatCurrency";
import { formatDate } from "./formatDate";

export async function shareBillPdf(bill: any) {
  if (!bill) return;

  /* =========================
     1️⃣ FETCH DASHBOARD (REAL)
  ========================= */
  let shopName = "Store";
  let upiId: string | null = null;

  try {
    const res = await getDashboard();
    const shop = res?.data?.dashboard?.shop;

    if (shop) {
      shopName = shop.shopName || shopName;
      upiId = shop.upiId || null;
    }
  } catch (err) {
    console.warn("Dashboard API failed, using fallback");
  }

  /* =========================
     2️⃣ AMOUNT & TIME
  ========================= */
  const outstandingAmount = Math.max(
    bill.totalAmount - bill.paidAmount,
    0
  );

  const billTime = new Date(bill.createdAt).toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" }
  );

  /* =========================
     3️⃣ UPI LINK + QR IMAGE
  ========================= */
  let upiLink = "";
  let qrCodeUrl = "";

  if (upiId && outstandingAmount > 0) {
    upiLink =
      `upi://pay?pa=${upiId}` +
      `&pn=${encodeURIComponent(shopName)}` +
      `&am=${outstandingAmount}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent(`Bill #${bill.dailyBillNumber}`)}`;

    qrCodeUrl =
      `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=` +
      encodeURIComponent(upiLink);
  }

  /* =========================
     4️⃣ HTML → PDF
  ========================= */
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body {
    font-family: Arial, sans-serif;
    background: #f8fafc;
    padding: 24px;
    color: #0f172a;
  }
  .card {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px;
  }
  .header {
    text-align: center;
    border-bottom: 1px dashed #e2e8f0;
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  .shop {
    font-size: 22px;
    font-weight: 800;
    color: #4f46e5;
  }
  .powered {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }
  .bill {
    margin-top: 8px;
    font-weight: 700;
  }
  .meta {
    font-size: 13px;
    margin-bottom: 12px;
    color: #475569;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
  }
  th, td {
    padding: 12px 10px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 14px;
  }
  th {
    background: #f1f5f9;
    text-transform: uppercase;
    font-size: 12px;
    text-align: left;
  }
  .right { text-align: right; }
  .summary {
    margin-top: 20px;
    background: #020617;
    color: white;
    border-radius: 14px;
    padding: 16px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .total {
    font-size: 18px;
    font-weight: 900;
    border-top: 1px solid rgba(255,255,255,0.2);
    padding-top: 10px;
    margin-top: 10px;
  }
  .qr {
    margin-top: 28px;
    text-align: center;
  }
  .qr img {
    width: 180px;
    height: 180px;
  }
  .qr-note {
    font-size: 12px;
    color: #475569;
    margin-top: 8px;
  }
  .footer {
    margin-top: 24px;
    text-align: center;
    font-size: 12px;
    color: #64748b;
  }
</style>
</head>

<body>
  <div class="card">
    <div class="header">
      <div class="shop">${shopName}</div>
      <div class="powered">Powered by Store Saathi</div>
      <div class="bill">Bill #${bill.dailyBillNumber}</div>
    </div>

    <div class="meta">
      <strong>Date:</strong> ${formatDate(bill.createdAt)}<br/>
      <strong>Time:</strong> ${billTime}<br/>
      <strong>Customer:</strong> ${bill.customerId?.name || "Walk-in Guest"}
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="right">Qty</th>
          <th class="right">Price</th>
          <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${bill.items
          .map(
            (item: any) => `
          <tr>
            <td>${item.name}</td>
            <td class="right">${item.quantity}</td>
            <td class="right">${formatRupee(item.price)}</td>
            <td class="right">${formatRupee(item.total)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <div class="summary">
      <div class="row"><span>Subtotal</span><span>${formatRupee(bill.subTotal)}</span></div>
      <div class="row"><span>Paid</span><span>${formatRupee(bill.paidAmount)}</span></div>
      <div class="row total"><span>Total</span><span>${formatRupee(bill.totalAmount)}</span></div>
    </div>

    ${
      qrCodeUrl
        ? `
      <div class="qr">
        <a href="${upiLink}">
          <img src="${qrCodeUrl}" />
        </a>
        <div class="qr-note">
          Scan or tap QR to pay ₹${outstandingAmount}
        </div>
      </div>`
        : ""
    }

    <div class="footer">
      Thank you for your shopping 🙏
    </div>
  </div>
</body>
</html>
`;

  /* =========================
     5️⃣ CREATE PDF
  ========================= */
  const { uri } = await Print.printToFileAsync({ html });

  const filePath =
    FileSystem.documentDirectory +
    `Bill_${bill.dailyBillNumber}.pdf`;

  await FileSystem.moveAsync({
    from: uri,
    to: filePath,
  });

  /* =========================
     6️⃣ SHARE
  ========================= */
  await Sharing.shareAsync(filePath, {
    mimeType: "application/pdf",
    dialogTitle: "Share Bill",
  });
}
export const printBillPdf = shareBillPdf;