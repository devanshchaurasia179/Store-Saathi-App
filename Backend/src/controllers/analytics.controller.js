import Bill from "../models/Bill.js";

/* --------------------------------------------------
   UTILS
-------------------------------------------------- */
function getDateRange(dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getWeekRange(dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthRange(dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getYearRange(dateStr) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date.getFullYear(), 0, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), 11, 31);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function getMonthKey(date) {
  return date.toISOString().slice(0, 7);
}

function getDaysInRange(start, end) {
  const days = [];
  let current = new Date(start);
  while (current <= end) {
    days.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

/* --------------------------------------------------
   🔥 UNIT-SAFE ANALYTICS CORE
-------------------------------------------------- */
function computeAnalyticsFromBills(bills) {
  let totalSales = 0;
  let biggestBill = null;
  let maxBillAmount = 0;
  let totalDebt = 0;
  let totalCollected = 0;

  /**
   * KEY CHANGE:
   * productKey = productId + "::" + unit
   */
  const productSales = {};

  for (const bill of bills) {
    totalSales += bill.totalAmount;

    const debt = bill.totalAmount - bill.paidAmount;
    if (debt > 0) totalDebt += debt;
    totalCollected += bill.paidAmount;

    for (const item of bill.items) {
      const unit = item.unit || "unit";
      const productKey = `${item.productId}::${unit}`;

      if (!productSales[productKey]) {
        productSales[productKey] = {
          productId: item.productId,
          name: item.name,
          unit,
          quantity: 0,
          revenue: 0,
        };
      }

      productSales[productKey].quantity += item.quantity;
      productSales[productKey].revenue += item.total;
    }

    if (bill.totalAmount > maxBillAmount) {
      maxBillAmount = bill.totalAmount;
      biggestBill = bill;
    }
  }

  const topProducts = Object.values(productSales).sort(
    (a, b) => b.quantity - a.quantity
  );

  const topProduct = topProducts[0] || null;

  return {
    totalSales,
    topProduct,
    topProducts,
    biggestBill,
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
    res.status(401).json({
      success: false,
      message: "Unauthorized - No shop found",
    });
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
    const { start, end } = getDateRange(date);

    const bills = await Bill.find({
      shopId,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    return res.status(200).json({
      success: true,
      date: start.toISOString().split("T")[0],
      ...computeAnalyticsFromBills(bills),
    });
  } catch (error) {
    console.error("Get Daily Analytics Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch daily analytics",
    });
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
    const { start, end } = getWeekRange(date);

    const bills = await Bill.find({
      shopId,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const overall = computeAnalyticsFromBills(bills);

    const dailyMap = {};
    for (const bill of bills) {
      const day = bill.createdAt.toISOString().split("T")[0];
      if (!dailyMap[day]) dailyMap[day] = [];
      dailyMap[day].push(bill);
    }

    const days = getDaysInRange(start, end).map((day) => ({
      date: day,
      ...computeAnalyticsFromBills(dailyMap[day] || []),
    }));

    res.status(200).json({
      success: true,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      ...overall,
      days,
    });
  } catch (error) {
    console.error("Get Weekly Analytics Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch weekly analytics",
    });
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
    const { start, end } = getMonthRange(date);

    const bills = await Bill.find({
      shopId,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const weeklyMap = {};
    for (const bill of bills) {
      const week = getWeekStart(bill.createdAt);
      if (!weeklyMap[week]) weeklyMap[week] = [];
      weeklyMap[week].push(bill);
    }

    const weeks = Object.keys(weeklyMap)
      .sort()
      .map((weekStart) => ({
        weekStart,
        ...computeAnalyticsFromBills(weeklyMap[weekStart]),
      }));

    res.status(200).json({
      success: true,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      ...computeAnalyticsFromBills(bills),
      weeks,
    });
  } catch (error) {
    console.error("Get Monthly Analytics Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch monthly analytics",
    });
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
    const { start, end } = getYearRange(date);

    const bills = await Bill.find({
      shopId,
      createdAt: { $gte: start, $lte: end },
    }).lean();

    const monthlyMap = {};
    for (const bill of bills) {
      const month = getMonthKey(bill.createdAt);
      if (!monthlyMap[month]) monthlyMap[month] = [];
      monthlyMap[month].push(bill);
    }

    const months = Object.keys(monthlyMap)
      .sort()
      .map((month) => ({
        month,
        ...computeAnalyticsFromBills(monthlyMap[month]),
      }));

    res.status(200).json({
      success: true,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      ...computeAnalyticsFromBills(bills),
      months,
    });
  } catch (error) {
    console.error("Get Yearly Analytics Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch yearly analytics",
    });
  }
}
