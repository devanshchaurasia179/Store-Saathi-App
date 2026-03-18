import Subscription from "../models/Subscription.js";
import Member from "../models/Member.js";
import MembershipPlan from "../models/MembershipPlan.js";

/* ================= HELPER: CALCULATE EXPIRY ================= */
function calculateExpiry(startDate, duration, billingCycle) {
  const date = new Date(startDate);

  switch (billingCycle) {
    case "DAYS":
      date.setDate(date.getDate() + duration);
      break;
    case "MONTH":
      date.setMonth(date.getMonth() + duration);
      break;
    case "YEAR":
      date.setFullYear(date.getFullYear() + duration);
      break;
    case "LIFETIME":
      return null;
  }

  return date;
}

/* ================= CREATE SUBSCRIPTION ================= */
export async function createSubscription(req, res) {
  try {
    const { memberId, planId } = req.body;

    if (!memberId || !planId) {
      return res.status(400).json({
        message: "Member and Plan are required",
      });
    }

    // ✅ Check member
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // ✅ Check plan
    const plan = await MembershipPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({ message: "Invalid or inactive plan" });
    }

    const startDate = new Date();

    const expiryDate = calculateExpiry(
      startDate,
      plan.duration,
      plan.billingCycle
    );

    const subscription = await Subscription.create({
      member: memberId,
      plan: planId,
      startDate,
      expiryDate,
      amountPaid: plan.price,
      status: "ACTIVE",
      paymentStatus: "PAID",
    });

    res.status(201).json({
      success: true,
      subscription,
    });

  } catch (error) {
    console.error("Create Subscription Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

/* ================= GET ALL SUBSCRIPTIONS ================= */
export async function getAllSubscriptions(req, res) {
  try {
    const subscriptions = await Subscription.find()
      .populate("member")
      .populate("plan")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      subscriptions,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
}

/* ================= GET SINGLE SUBSCRIPTION ================= */
export async function getSubscription(req, res) {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id)
      .populate("member")
      .populate("plan");

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json({
      success: true,
      subscription,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscription" });
  }
}

/* ================= GET MEMBER SUBSCRIPTIONS ================= */
export async function getMemberSubscriptions(req, res) {
  try {
    const { memberId } = req.params;

    const subscriptions = await Subscription.find({ member: memberId })
      .populate("plan")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      subscriptions,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch member subscriptions" });
  }
}

/* ================= RENEW SUBSCRIPTION ================= */
export async function renewSubscription(req, res) {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id).populate("plan");

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    const now = new Date();

    // ✅ If active → extend from expiry, else from now
    const baseDate =
      subscription.expiryDate && subscription.expiryDate > now
        ? subscription.expiryDate
        : now;

    const newExpiry = calculateExpiry(
      baseDate,
      subscription.plan.duration,
      subscription.plan.billingCycle
    );

    subscription.expiryDate = newExpiry;
    subscription.status = "ACTIVE";
    subscription.paymentStatus = "PAID";
    subscription.amountPaid = subscription.plan.price;

    await subscription.save();

    res.status(200).json({
      success: true,
      subscription,
    });

  } catch (error) {
    res.status(500).json({ message: "Renewal failed" });
  }
}

/* ================= CANCEL SUBSCRIPTION ================= */
export async function cancelSubscription(req, res) {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    subscription.status = "CANCELLED";
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription cancelled",
    });

  } catch (error) {
    res.status(500).json({ message: "Cancel failed" });
  }
}

/* ================= AUTO EXPIRE (CRON USE) ================= */
export async function markExpiredSubscriptions() {
  const now = new Date();

  await Subscription.updateMany(
    {
      expiryDate: { $lt: now },
      status: "ACTIVE",
    },
    {
      status: "EXPIRED",
    }
  );
}