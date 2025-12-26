import Bill from "../models/Bill.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import LedgerEntry from "../models/LedgerEntry.js";

/* --------------------------------------------------
   UTILS
-------------------------------------------------- */
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function generateDailyBillNumber(shopId) {
  const { start, end } = getTodayRange();

  const lastBill = await Bill.findOne({
    shopId,
    createdAt: { $gte: start, $lte: end },
  })
    .sort({ dailyBillNumber: -1 })
    .select("dailyBillNumber");

  return lastBill ? lastBill.dailyBillNumber + 1 : 1;
}

/* --------------------------------------------------
   CREATE BILL
   POST /api/bills
-------------------------------------------------- */
export async function createBill(req, res) {
  try {
    const shopId = req.user._id;

    const {
      items = [],
      discount = 0,
      customerId = null,
      paidAmount = 0,
      paymentMode = "NONE",
    } = req.body;

    /* -----------------------------
       1️⃣ VALIDATION
    ----------------------------- */
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Bill items are required" });
    }

    if (paidAmount < 0 || discount < 0) {
      return res.status(400).json({ message: "Invalid payment values" });
    }

    /* -----------------------------
       2️⃣ CALCULATE TOTALS
    ----------------------------- */
    let subTotal = 0;

    const billItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (
        !item.productId ||
        !item.name ||
        quantity <= 0 ||
        price < 0
      ) {
        throw new Error("Invalid bill item data");
      }

      const total = quantity * price;
      subTotal += total;

      return {
        productId: item.productId,
        name: item.name,
        quantity,
        price,
        total,
      };
    });

    const totalAmount = Math.max(subTotal - discount, 0);

    /* -----------------------------
       3️⃣ PAYMENT STATUS
    ----------------------------- */
    let paymentStatus = "PAID";
    if (paidAmount === 0) paymentStatus = "UNPAID";
    else if (paidAmount < totalAmount) paymentStatus = "PARTIAL";

    /* -----------------------------
       4️⃣ DAILY BILL NUMBER
    ----------------------------- */
    const dailyBillNumber = await generateDailyBillNumber(shopId);

    /* -----------------------------
       5️⃣ CREATE BILL
    ----------------------------- */
    const bill = await Bill.create({
      shopId,
      dailyBillNumber,
      customerId,
      items: billItems,
      subTotal,
      discount,
      totalAmount,
      paidAmount,
      paymentStatus,
      paymentMode,
    });

    /* -----------------------------
       6️⃣ STOCK ADJUSTMENT
       - skips non-trackable products
       - never blocks billing
    ----------------------------- */
    for (const item of billItems) {
      const product = await Product.findOne({
        _id: item.productId,
        shopId,
        isActive: true,
      });

      if (!product) continue;
      if (product.isTrackable === false) continue;

      product.quantity = Math.max(
        product.quantity - item.quantity,
        0
      );

      await product.save();
    }

    /* -----------------------------
       7️⃣ LEDGER + CUSTOMER BALANCE
    ----------------------------- */
    if (customerId) {
      const difference = totalAmount - paidAmount;

      // Customer owes money
      if (difference > 0) {
        await LedgerEntry.create({
          shopId,
          customerId,
          type: "DEBIT",
          amount: difference,
          billId: bill._id,
          note: "Bill due",
        });

        await Customer.findByIdAndUpdate(customerId, {
          $inc: { totalPending: difference },
        });
      }

      // Customer paid advance
      if (difference < 0) {
        const advance = Math.abs(difference);

        await LedgerEntry.create({
          shopId,
          customerId,
          type: "CREDIT",
          amount: advance,
          billId: bill._id,
          note: "Advance payment",
        });

        await Customer.findByIdAndUpdate(customerId, {
          $inc: { totalPending: -advance },
        });
      }
    }

    return res.status(201).json({
      success: true,
      bill,
    });
  } catch (error) {
    console.error("Create Bill Error:", error.message);
    return res.status(500).json({
      message: "Failed to create bill",
    });
  }
}

/* --------------------------------------------------
   GET ALL BILLS
   GET /api/bills
-------------------------------------------------- */
export async function getBills(req, res) {
  try {
    const shopId = req.user._id;

    const bills = await Bill.find({ shopId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      bills,
    });
  } catch (error) {
    console.error("Get Bills Error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch bills",
    });
  }
}

/* --------------------------------------------------
   GET BILL BY ID
   GET /api/bills/:billId
-------------------------------------------------- */
export async function getBillById(req, res) {
  try {
    const shopId = req.user._id;
    const { billId } = req.params;

    const bill = await Bill.findOne({
  _id: billId,
  shopId,
}).populate("customerId", "name mobileNumber");


    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    return res.status(200).json({
      success: true,
      bill,
    });
  } catch (error) {
    console.error("Get Bill By Id Error:", error.message);
    return res.status(500).json({
      message: "Failed to fetch bill",
    });
  }
}
