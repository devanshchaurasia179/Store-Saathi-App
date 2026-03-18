import express from "express";
import {
  createSubscription,
  getAllSubscriptions,
  getSubscription,
  getMemberSubscriptions,
  renewSubscription,
  cancelSubscription,
} from "../controllers/subscription.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

/* ================= CREATE ================= */
router.post("/",protectRoute, createSubscription);

/* ================= READ ================= */
router.get("/",protectRoute, getAllSubscriptions); // Get all subscriptions
router.get("/member/:memberId",protectRoute, getMemberSubscriptions); // Get subscriptions of a member
router.get("/:id",protectRoute, getSubscription); // Get single subscription

/* ================= UPDATE ================= */
router.put("/renew/:id",protectRoute, renewSubscription); // Renew subscription

/* ================= DELETE / CANCEL ================= */
router.put("/cancel/:id",protectRoute, cancelSubscription); // Cancel subscription

export default router;