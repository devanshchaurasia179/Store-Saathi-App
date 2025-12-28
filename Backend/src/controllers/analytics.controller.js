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
  const day = date.getDay(); // 0 = Sunday
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
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

function getMonthKey(date) {
  return date.toISOString().slice(0, 7); // YYYY-MM
}

function getDaysInRange(start, end) {
  const days = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function computeTopProduct(productSales) {
  let topProduct = null;
  let maxRevenue = 0;
  for (let pid in productSales) {
    if (productSales[pid].revenue > maxRevenue) {
      maxRevenue = productSales[pid].revenue;
      topProduct = {
        productId: pid,
        ...productSales[pid],
      };
    }
  }
  return topProduct;
}

function computeAnalyticsFromBills(bills) {
  let totalSales = 0;
  let productSales = {};
  let biggestBill = null;
  let maxBillAmount = 0;
  let totalDebt = 0;
  let totalCollected = 0;

  for (let bill of bills) {
    totalSales += bill.totalAmount;
    const debt = bill.totalAmount - bill.paidAmount;
    if (debt > 0) totalDebt += debt;
    totalCollected += bill.paidAmount;

    for (let item of bill.items) {
      const pid = item.productId.toString();
      if (!productSales[pid]) {
        productSales[pid] = {
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[pid].quantity += item.quantity;
      productSales[pid].revenue += item.total;
    }

    if (bill.totalAmount > maxBillAmount) {
      maxBillAmount = bill.totalAmount;
      biggestBill = bill;
    }
  }

  const topProduct = computeTopProduct(productSales);

  return {
    totalSales,
    topProduct,
    biggestBill,
    debtVsSales: {
      totalDebt,
      totalSales,
      totalCollected,
    },
  };
}

/* --------------------------------------------------
   ANALYTICS ENDPOINTS
-------------------------------------------------- */

// Helper to validate authenticated shop
function getShopId(req, res) {
  if (!req.user || !req.user._id) {
    res.status(401).json({ success: false, message: "Unauthorized - No shop found" });
    return null;
  }
  return req.user._id;
}

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

    const analytics = computeAnalyticsFromBills(bills);

    return res.status(200).json({
      success: true,
      date: start.toISOString().split("T")[0],
      ...analytics,
    });
  } catch (error) {
    console.error("Get Daily Analytics Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch daily analytics",
    });
  }
}

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

    // Daily breakdown
    let dailySummaries = {};
    for (let bill of bills) {
      const billDate = bill.createdAt.toISOString().split("T")[0];
      if (!dailySummaries[billDate]) {
        dailySummaries[billDate] = { bills: [], productSales: {} };
      }
      dailySummaries[billDate].bills.push(bill);

      for (let item of bill.items) {
        const pid = item.productId.toString();
        if (!dailySummaries[billDate].productSales[pid]) {
          dailySummaries[billDate].productSales[pid] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        dailySummaries[billDate].productSales[pid].quantity += item.quantity;
        dailySummaries[billDate].productSales[pid].revenue += item.total;
      }
    }

    const allDays = getDaysInRange(start, end);
    const days = allDays.map((day) => {
      const dayBills = dailySummaries[day]?.bills || [];
      return {
        date: day,
        ...computeAnalyticsFromBills(dayBills),
      };
    });

    return res.status(200).json({
      success: true,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      ...overall,
      days,
    });
  } catch (error) {
    console.error("Get Weekly Analytics Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch weekly analytics",
    });
  }
}

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

    const overall = computeAnalyticsFromBills(bills);

    // Weekly breakdown
    let weeklySummaries = {};
    for (let bill of bills) {
      const weekStart = getWeekStart(bill.createdAt);
      if (!weeklySummaries[weekStart]) {
        weeklySummaries[weekStart] = { bills: [], productSales: {} };
      }
      weeklySummaries[weekStart].bills.push(bill);

      for (let item of bill.items) {
        const pid = item.productId.toString();
        if (!weeklySummaries[weekStart].productSales[pid]) {
          weeklySummaries[weekStart].productSales[pid] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        weeklySummaries[weekStart].productSales[pid].quantity += item.quantity;
        weeklySummaries[weekStart].productSales[pid].revenue += item.total;
      }
    }

    const weekKeys = Object.keys(weeklySummaries).sort();
    const weeks = weekKeys.map((weekStart) => ({
      weekStart,
      ...computeAnalyticsFromBills(weeklySummaries[weekStart].bills),
    }));

    return res.status(200).json({
      success: true,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      ...overall,
      weeks,
    });
  } catch (error) {
    console.error("Get Monthly Analytics Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly analytics",
    });
  }
}

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

    const overall = computeAnalyticsFromBills(bills);

    // Monthly breakdown
    let monthlySummaries = {};
    for (let bill of bills) {
      const monthKey = getMonthKey(bill.createdAt);
      if (!monthlySummaries[monthKey]) {
        monthlySummaries[monthKey] = { bills: [], productSales: {} };
      }
      monthlySummaries[monthKey].bills.push(bill);

      for (let item of bill.items) {
        const pid = item.productId.toString();
        if (!monthlySummaries[monthKey].productSales[pid]) {
          monthlySummaries[monthKey].productSales[pid] = {
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        monthlySummaries[monthKey].productSales[pid].quantity += item.quantity;
        monthlySummaries[monthKey].productSales[pid].revenue += item.total;
      }
    }

    const monthKeys = Object.keys(monthlySummaries).sort();
    const months = monthKeys.map((month) => ({
      month,
      ...computeAnalyticsFromBills(monthlySummaries[month].bills),
    }));

    return res.status(200).json({
      success: true,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      ...overall,
      months,
    });
  } catch (error) {
    console.error("Get Yearly Analytics Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch yearly analytics",
    });
  }
}