import Membership from "../models/Membership.js";
import MembershipEntry from "../models/MembershipEntry.js";
import Customer from "../models/Customer.js";

/**
 * =====================================
 * CREATE / RENEW MEMBERSHIP
 * POST /api/memberships/:customerId
 * =====================================
 *
 * body:
 * {
 *   name: "Gold",
 *   code: "GOLD30",
 *   amount: 999,
 *   durationType: "days" | "months" | "years",
 *   durationValue: 30
 * }
 */
export async function createOrRenewMembership(req, res) {
  try {
    const shopId = req.user._id;
    const { customerId } = req.params;

    const {
      name,
      code,
      amount = 0,
      durationType,
      durationValue,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Membership name and code required" });
    }

    if (!durationType || !durationValue || durationValue <= 0) {
      return res.status(400).json({
        message: "Valid duration type and value required",
      });
    }

    if (!["days", "months", "years"].includes(durationType)) {
      return res.status(400).json({
        message: "Invalid duration type (days / months / years)",
      });
    }

    const customer = await Customer.findOne({ _id: customerId, shopId });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const now = new Date();

    let membership = await Membership.findOne({ customerId });

    // Decide base date
    let baseDate =
      membership && membership.expiryDate > now
        ? membership.expiryDate
        : now;

    let expiryDate = new Date(baseDate);

    if (durationType === "days") {
      expiryDate.setDate(expiryDate.getDate() + Number(durationValue));
    }
    if (durationType === "months") {
      expiryDate.setMonth(expiryDate.getMonth() + Number(durationValue));
    }
    if (durationType === "years") {
      expiryDate.setFullYear(expiryDate.getFullYear() + Number(durationValue));
    }

    let action = "created";

    // RENEW
    if (membership) {
      membership.name = name;
      membership.code = code;
      membership.amount = amount;
      membership.expiryDate = expiryDate;
      membership.status = "active";
      action = "renewed";
    } 
    // CREATE
    else {
      membership = await Membership.create({
        shopId,
        customerId,
        name,
        code,
        amount,
        startDate: now,
        expiryDate,
        status: "active",
      });
    }

    await membership.save();

    // 🔐 CREATE MEMBERSHIP ENTRY (LEDGER STYLE)
    await MembershipEntry.create({
      shopId,
      customerId,
      membershipId: membership._id,
      name,
      code,
      amount,
      startDate: now,
      expiryDate,
      action,
      actionDate: now,
    });

    res.status(200).json({
      success: true,
      message: `Membership ${action} successfully`,
      membership,
    });
  } catch (error) {
    console.error("Membership Create/Renew Error:", error);
    res.status(500).json({ message: "Membership operation failed" });
  }
}

/**
 * =====================================
 * CANCEL MEMBERSHIP
 * POST /api/memberships/:customerId/cancel
 * =====================================
 */
export async function cancelMembership(req, res) {
  try {
    const shopId = req.user._id;
    const { customerId } = req.params;

    const membership = await Membership.findOne({ customerId, shopId });

    if (!membership) {
      return res.status(404).json({ message: "No active membership found" });
    }

    if (membership.status === "cancelled") {
      return res.status(400).json({ message: "Membership already cancelled" });
    }

    const now = new Date();

    membership.status = "cancelled";
    membership.expiryDate = now;
    await membership.save();

    // 🔐 ENTRY
    await MembershipEntry.create({
      shopId,
      customerId,
      membershipId: membership._id,
      name: membership.name,
      code: membership.code,
      amount: membership.amount,
      startDate: membership.startDate,
      expiryDate: now,
      action: "cancelled",
      actionDate: now,
    });

    res.status(200).json({
      success: true,
      message: "Membership cancelled successfully",
      membership,
    });
  } catch (error) {
    console.error("Cancel Membership Error:", error);
    res.status(500).json({ message: "Failed to cancel membership" });
  }
}

/**
 * =====================================
 * GET MEMBERSHIP LEDGER (LIKE ACCOUNT LEDGER)
 * GET /api/memberships/entries/:customerId
 * =====================================
 */
export async function getMembershipEntries(req, res) {
  try {
    const shopId = req.user._id;
    const { customerId } = req.params;

    const entries = await MembershipEntry.find({
      shopId,
      customerId,
    }).sort({ actionDate: -1 });

    res.status(200).json({
      success: true,
      count: entries.length,
      entries,
    });
  } catch (error) {
    console.error("Get Membership Entries Error:", error);
    res.status(500).json({ message: "Failed to fetch membership entries" });
  }
}
/**
 * =====================================
 * GET ALL MEMBERSHIPS (Dashboard List)
 * GET /api/memberships
 * =====================================
 */
export async function getAllMemberships(req, res) {
  try {
    const shopId = req.user._id;

    const memberships = await Membership.find({ shopId })
      .populate("customerId", "name mobileNumber")
      .sort({ expiryDate: -1 });

    res.status(200).json({
      success: true,
      count: memberships.length,
      memberships,
    });
  } catch (error) {
    console.error("Get Memberships Error:", error);
    res.status(500).json({ message: "Failed to fetch memberships" });
  }
}

