import Bill from "../models/Bill.js";

/* --------------------------------------------------
   TIMEZONE CONSTANT
-------------------------------------------------- */
const IST_OFFSET_MINUTES = 330; // UTC +5:30

/* --------------------------------------------------
   IST → UTC HELPERS
-------------------------------------------------- */
function getISTDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return new Date(
    Date.UTC(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      d.getHours(),
      d.getMinutes(),
      d.getSeconds(),
      d.getMilliseconds()
    )
  );
}

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

  const day = d.getDay(); // IST day
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
   GROUPING HELPERS (IST KEYS)
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
   CORE ANALYTICS
-------------------------------------------------- */
function computeAnalyticsFromBills(bills) {
  let totalSales = 0;
  let totalDebt = 0;
  let totalCollected = 0;
  let biggestBill = null;
  let maxBillAmount = 0;

  const productSales = {};

  for (const bill of bills) {
    const billTotal = Number(bill.totalAmount) || 0;
    const paid = Number(bill.paidAmount) || 0;

    totalSales += billTotal;
    totalCollected += paid;

    const debt = billTotal - paid;
    if (debt > 0) totalDebt += debt;

    for (const item of bill.items || []) {
      const unit = item.unit || "unit";
      const key = `${item.productId}::${unit}`;

      if (!productSales[key]) {
        productSales[key] = {
          productId: item.productId,
          name: item.name,
          unit,
          quantity: 0,
          revenue: 0,
        };
      }

      productSales[key].quantity += Number(item.quantity) || 0;
      productSales[key].revenue += Number(item.total) || 0;
    }

    if (billTotal > maxBillAmount) {
      maxBillAmount = billTotal;
      biggestBill = bill;
    }
  }

  const topProducts = Object.values(productSales).sort(
    (a, b) => b.quantity - a.quantity
  );

  return {
    totalSales,
    biggestBill,
    topProduct: topProducts[0] || null,
    topProducts,

    // 🔥 THIS FIXES YOUR UI
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
   DAILY ANALYTICS (IST)
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
  } catch (err) {
    res.status(500).json({ success: false });
  }
}

/* --------------------------------------------------
   WEEKLY ANALYTICS (IST)
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
  } catch (err) {
    res.status(500).json({ success: false });
  }
}

/* --------------------------------------------------
   MONTHLY ANALYTICS (IST)
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
  } catch (err) {
    res.status(500).json({ success: false });
  }
}

/* --------------------------------------------------
   YEARLY ANALYTICS (IST)
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
  } catch (err) {
    res.status(500).json({ success: false });
  }
}
