import express from "express";
import Shop from "../models/Shop.js";

import {
  sendOtp,
  verifyOtp,
  loginWithSecretKey,
  resetSecretKey,
  setAnalyticsPin,
  verifyAnalyticsPin,
  updateAnalyticsPin,
  onboard,
  logout,
} from "../controllers/auth.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

/* ================= AUTH ================= */
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// 🔑 Login via Secret Key (other devices)
router.post("/login-with-secret", loginWithSecretKey);

// 🔁 Reset / Regenerate Secret Key (via Analytics PIN)
router.post("/reset-secret", protectRoute, resetSecretKey);

/* ================= ANALYTICS PIN ================= */
router.post("/set-analytics-pin", protectRoute, setAnalyticsPin);
router.post("/update-analytics-pin", protectRoute, updateAnalyticsPin);
router.post("/verify-analytics-pin", protectRoute, verifyAnalyticsPin);

/* ================= ONBOARDING ================= */
router.post("/onboarding", protectRoute, onboard);

/* ================= SESSION ================= */
router.post("/logout", logout);

router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({
    success: true,
    shop: req.user,
  });
});

export default router;
