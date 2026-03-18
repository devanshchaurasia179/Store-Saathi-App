import express from "express";
import { 
  createPlan, 
  getAllPlans, 
  updatePlan, 
  togglePlanStatus, // Recommended: Soft delete/Toggle
  deletePlanPermanent // For actual removal
} from "../controllers/membershipPlan.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

//get all Plans
router.get("/",protectRoute, getAllPlans);

// Create a new membership tier (e.g., "Silver", 500, 3, "MONTH")
router.post("/", protectRoute, createPlan); 

// Update plan details (Price, Name, etc.)
router.put("/:id", protectRoute, updatePlan);

// 🛡️ SOFT DELETE / TOGGLE 
// Instead of deleting, hide the plan from new users
router.patch("/:id/toggle", protectRoute, togglePlanStatus);

// ⚠️ HARD DELETE
// Use only if the plan was created by mistake and has no subscribers
router.delete("/:id", protectRoute, deletePlanPermanent);

export default router;