import Bill from "../models/Bill.js";

/* --------------------------------------------------
   TIMEZONE CONSTANT
-------------------------------------------------- */
const IST_OFFSET_MINUTES = 330; // UTC +5:30

/* --------------------------------------------------
   IST DAY RANGE
-------------------------------------------------- */
function getISTDayRange(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();

  const start = new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      0, 0, 0, 0
    ) - IST_OFFSET_MINUTES * 60 * 1000
  );

  const end = new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      23, 59, 59, 999
    ) - IST_OFFSET_MINUTES * 60 * 1000
  );

  return { start, end };
}

/* --------------------------------------------------
   IST WEEK RANGE (SUN → SAT)
-------------------------------------------------- */
function getISTWeekRange(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const day = d.getDay();

  const startIST = new Date(d);
  startIST.setDate(d.getDate() - day);
  startIST.setHours(0, 0, 0, 0);

  const endIST = new Date(startIST);
  endIST.setDate(startIST.getDate() + 6);
  endIST.setHours(23, 59, 59, 999);

  return {
    start: new Date(startIST.getTime() - IST_OFFSET_MINUTES * 60 * 1000),
    end: new Date(endIST.getTime() - IST_OFFSET_MINUTES * 60 * 1000),
  };
}

/* --------------------------------------------------
   IST MONTH RANGE
-------------------------------------------------- */
function getISTMonthRange(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();

  const startIST = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const endIST = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    start: new Date(startIST.getTime() - IST_OFFSET_MINUTES * 60 * 1000),
    end: new Date(endIST.getTime() - IST_OFFSET_MINUTES * 60 * 1000),
  };
}

/* --------------------------------------------------
   IST YEAR RANGE
-------------------------------------------------- */
function getISTYearRange(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();

  const startIST = new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
  const endIST = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);

  return {
    start: new Date(startIST.getTime() - IST_OFFSET_MINUTES * 60 * 1000),
    end: new Date(endIST.getTime() - IST_OFFSET_MINUTES * 60 * 1000),
  };
}

/* --------------------------------------------------
   IST GROUPING KEYS
-------------------------------------------------- */
function getISTDayKey(date) {
  const d = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return d.toISOString().split("T")[0];
}

function getISTWeekStartKey(date) {
  const d = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split("T")[0];
}

function getISTMonthKey(date) {
  const d = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* --------------------------------------------------
   ✅ VARIANT-AWARE ANALYTICS CORE – NOW SORTED BY QUANTITY
-------------------------------------------------- */
function computeAnalyticsFromBills(bills) {
  let totalSales = 0;
  let totalDebt = 0;
  let totalCollected = 0;
  let biggestBill = null;
  let maxBillAmount = 0;

  const productMap = {};
  // 🔥 PRODUCT + VARIANT SAFE
    const paymentModeStats = {
    CASH: 0,
    UPI: 0,
    OTHERS:0,
  };

  for (const bill of bills) {
    const billTotal = Number(bill.totalAmount) || 0;
    const paid = Number(bill.paidAmount) || 0;
  const mode = bill.paymentMode || "NONE";
  if (paymentModeStats[mode] !== undefined) {
    paymentModeStats[mode] += paid;
  }

    totalSales += billTotal;
    totalCollected += paid;

    const debt = billTotal - paid;
    if (debt > 0) totalDebt += debt;

    if (billTotal > maxBillAmount) {
      maxBillAmount = billTotal;
      biggestBill = bill;
    }

    for (const item of bill.items || []) {
      const productId = String(item.productId);
      const variantId = item.variantId ? String(item.variantId) : "NO_VARIANT";
      const unit = item.unit || "unit";

      if (!productMap[productId]) {
        productMap[productId] = {
          productId,
          name: item.name.split(" (")[0], // base product name
          variants: {},
        };
      }

      if (!productMap[productId].variants[variantId]) {
        productMap[productId].variants[variantId] = {
          variantId: variantId === "NO_VARIANT" ? null : variantId,
          name: item.name,
          unit,
          quantity: 0,
          revenue: 0,
        };
      }

      productMap[productId].variants[variantId].quantity += Number(item.quantity) || 0;
      productMap[productId].variants[variantId].revenue += Number(item.total) || 0;
    }
  }

  // ────────────────────────────────────────────────
  //  NEW: Prepare array + calculate product totals
  // ────────────────────────────────────────────────
  const productsArray = Object.values(productMap).map(product => {
    let totalQuantity = 0;
    let totalRevenue = 0;

    const variantsArray = Object.values(product.variants).map(variant => {
      totalQuantity += variant.quantity;
      totalRevenue += variant.revenue;
      return variant;
    });

    return {
      ...product,
      totalQuantity,
      totalRevenue,
      variants: variantsArray,
    };
  });

  // ────────────────────────────────────────────────
  //  Sort VARIANTS inside each product by quantity ↓
  // ────────────────────────────────────────────────
  productsArray.forEach(product => {
    product.variants.sort((a, b) => b.quantity - a.quantity);
  });

  // ────────────────────────────────────────────────
  //  Sort PRODUCTS themselves by total quantity ↓
  // ────────────────────────────────────────────────
  productsArray.sort((a, b) => b.totalQuantity - a.totalQuantity);

  // ────────────────────────────────────────────────
  //  Final return – now sorted
  // ────────────────────────────────────────────────
    return {
    totalSales,
    biggestBill,
    products: productsArray,
    paymentModes: paymentModeStats, // 🔥 ADDED
    debtVsSales: {
      totalDebt,
      totalSales,
      totalCollected,
    },
  };

}

/* --------------------------------------------------
   AUTH
-------------------------------------------------- */
function getShopId(req, res) {
  if (!req.user || !req.user._id) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return null;
  }
  return req.user._id;
}

/* --------------------------------------------------
   DAILY ANALYTICS
-------------------------------------------------- */
export async function getDailyAnalytics(req, res) {
  try {
    const shopId = getShopId(req, res);
    if (!shopId) return;

    const { date } = req.query;
    const { start, end } = getISTDayRange(date);

    const bills = await Bill.find({
      shopId,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    res.json({
      success: true,
      date: getISTDayKey(start),
      ...computeAnalyticsFromBills(bills),
    });
  } catch {
    res.status(500).json({ success: false });
  }
}

/* --------------------------------------------------
   WEEKLY ANALYTICS
-------------------------------------------------- */
export async function getWeeklyAnalytics(req, res) {
  try {
    const shopId = getShopId(req, res);
    if (!shopId) return;

    const { date } = req.query;
    const { start, end } = getISTWeekRange(date);

    const bills = await Bill.find({
      shopId,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const dailyMap = {};
    for (const bill of bills) {
      const key = getISTDayKey(bill.createdAt);
      if (!dailyMap[key]) dailyMap[key] = [];
      dailyMap[key].push(bill);
    }

    const days = Object.keys(dailyMap).sort().map(day => ({
      date: day,
      ...computeAnalyticsFromBills(dailyMap[day]),
    }));

    res.json({
      success: true,
      ...computeAnalyticsFromBills(bills),
      days,
    });
  } catch {
    res.status(500).json({ success: false });
  }
}

/* --------------------------------------------------
   MONTHLY ANALYTICS
-------------------------------------------------- */
export async function getMonthlyAnalytics(req, res) {
  try {
    const shopId = getShopId(req, res);
    if (!shopId) return;

    const { date } = req.query;
    const { start, end } = getISTMonthRange(date);

    const bills = await Bill.find({
      shopId,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const weekMap = {};
    for (const bill of bills) {
      const key = getISTWeekStartKey(bill.createdAt);
      if (!weekMap[key]) weekMap[key] = [];
      weekMap[key].push(bill);
    }

    const weeks = Object.keys(weekMap).sort().map(week => ({
      weekStart: week,
      ...computeAnalyticsFromBills(weekMap[week]),
    }));

    res.json({
      success: true,
      ...computeAnalyticsFromBills(bills),
      weeks,
    });
  } catch {
    res.status(500).json({ success: false });
  }
}

/* --------------------------------------------------
   YEARLY ANALYTICS
-------------------------------------------------- */
export async function getYearlyAnalytics(req, res) {
  try {
    const shopId = getShopId(req, res);
    if (!shopId) return;

    const { date } = req.query;
    const { start, end } = getISTYearRange(date);

    const bills = await Bill.find({
      shopId,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const monthMap = {};
    for (const bill of bills) {
      const key = getISTMonthKey(bill.createdAt);
      if (!monthMap[key]) monthMap[key] = [];
      monthMap[key].push(bill);
    }

    const months = Object.keys(monthMap).sort().map(month => ({
      month,
      ...computeAnalyticsFromBills(monthMap[month]),
    }));

    res.json({
      success: true,
      ...computeAnalyticsFromBills(bills),
      months,
    });
  } catch {
    res.status(500).json({ success: false });
  }
}