import MembershipPlan from "../models/MembershipPlan.js";

/* ================= CREATE PLAN ================= */
export async function createPlan(req, res) {
  try {
    const { name, price, duration, billingCycle, isActive } = req.body;

    // Validation: Check for required fields including the new 'duration'
    if (!name || price === undefined || duration === undefined) {
      return res.status(400).json({ 
        message: "Name, price, and duration are required" 
      });
    }

    const plan = await MembershipPlan.create({
      name,
      price,
      duration,
      billingCycle: billingCycle?.toUpperCase(), // Ensure uppercase to match enum
      isActive,
    });

    res.status(201).json({ success: true, plan });
  } catch (error) {
    console.error("Create Plan Error:", error);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}

/* ================= GET ALL PLANS ================= */
export async function getAllPlans(req, res) {
  try {
    const { onlyActive } = req.query;
    // If onlyActive is true, we filter out inactive plans
    const filter = onlyActive === "true" ? { isActive: true } : {};

    const plans = await MembershipPlan.find(filter).sort({ price: 1 });
    res.status(200).json({ success: true, plans });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch plans" });
  }
}

/* ================= UPDATE PLAN ================= */
export async function updatePlan(req, res) {
  try {
    const { id } = req.params;
    
    // If billingCycle is being updated, ensure it's uppercase
    if (req.body.billingCycle) {
      req.body.billingCycle = req.body.billingCycle.toUpperCase();
    }

    const updatedPlan = await MembershipPlan.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.status(200).json({ success: true, plan: updatedPlan });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
}

/* ================= SOFT DELETE (TOGGLE ACTIVE) ================= */
// Renamed to 'togglePlanStatus' to better reflect safe deletion practices
export async function togglePlanStatus(req, res) {
  try {
    const { id } = req.params;
    
    const plan = await MembershipPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    // Flip the isActive boolean
    plan.isActive = !plan.isActive;
    await plan.save();

    res.status(200).json({ 
      success: true, 
      message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: plan.isActive 
    });
  } catch (error) {
    res.status(500).json({ message: "Action failed" });
  }
}

/* ================= HARD DELETE (USE WITH CAUTION) ================= */
export async function deletePlanPermanent(req, res) {
  try {
    const { id } = req.params;
    const plan = await MembershipPlan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.status(200).json({ success: true, message: "Plan permanently removed" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
}