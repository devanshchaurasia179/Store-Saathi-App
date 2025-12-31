import Product from "../models/Product.js";
import Bill from "../models/Bill.js";
import Customer from "../models/Customer.js";

/* -------------------------------
   PROFILE COMPLETION
-------------------------------- */
function calculateProfileCompletion(shop) {
  let score = 0;
  if (shop.shopName) score += 20;
  if (shop.ownerName) score += 20;
  if (shop.storeCategory) score += 20;
  if (shop.upiId) score += 20;
  if (shop.location) score += 20;
  return score;
}

/* -------------------------------
   GET DASHBOARD
-------------------------------- */
export async function getDashboard(req, res) {
  try {
    const shop = req.user;
    const shopId = shop._id;

    /* -------------------------------
       PROFILE
    -------------------------------- */
    const profileCompletion = calculateProfileCompletion(shop);

    /* -------------------------------
       ✅ TOP DEBTOR (CUSTOMERS ONLY)
    -------------------------------- */
    const topDebtor = await Customer.findOne({
      shopId,
      isSupplier: { $ne: true }, // ✅ CRITICAL FIX
      totalPending: { $gt: 0 },
    })
      .sort({ totalPending: -1 })
      .select("_id name totalPending mobileNumber isSupplier");

    /* -------------------------------
       LOW STOCK (trackable only)
       🆕 INCLUDE UNIT
    -------------------------------- */
    const lowStock = await Product.find({
      shopId,
      isActive: true,
      isTrackable: true,
      quantity: { $lte: 5 },
    })
      .limit(5)
      .select("name quantity unit"); // 🆕 FIX HERE

    /* -------------------------------
       MOST SOLD PRODUCTS
    -------------------------------- */
    const mostSold = await Bill.aggregate([
      { $match: { shopId } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalSold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: "$_id",
          totalSold: 1,
        },
      },
    ]);

    /* -------------------------------
       RECENT BILLS
    -------------------------------- */
    const recentBills = await Bill.find({ shopId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id dailyBillNumber totalAmount createdAt");

    /* -------------------------------
       RESPONSE
    -------------------------------- */
    res.status(200).json({
      success: true,
      dashboard: {
        shop: {
          ownerName: shop.ownerName,
          shopName: shop.shopName,
          upiId: shop.upiId,
          profileCompletion,
        },

        // ✅ SAFE RESPONSE
        topDebtor: topDebtor
          ? {
              customerId: topDebtor._id,
              name: topDebtor.name,
              amount: topDebtor.totalPending,
              mobileNumber: topDebtor.mobileNumber,
              isSupplier: topDebtor.isSupplier,
            }
          : null,

        lowStock, // 🆕 NOW HAS unit
        mostSold,
        recentBills,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
}
