import express from "express";
import {
  createSubscription,
  getAllSubscriptions,
  getSubscription,
  getMemberSubscriptions,
  renewSubscription,
  cancelSubscription,
} from "../controllers/subscription.controller.js";

const router = express.Router();

/* ================= CREATE ================= */
router.post("/", createSubscription);

/* ================= READ ================= */
router.get("/", getAllSubscriptions); // Get all subscriptions
router.get("/member/:memberId", getMemberSubscriptions); // Get subscriptions of a member
router.get("/:id", getSubscription); // Get single subscription

/* ================= UPDATE ================= */
router.put("/renew/:id", renewSubscription); // Renew subscription

/* ================= DELETE / CANCEL ================= */
router.put("/cancel/:id", cancelSubscription); // Cancel subscription

export default router;