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
  sendAnalyticsPinResetOtp,
  resetAnalyticsPinWithOtp,
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

router.get("/me", protectRoute, async (req, res) => {
  try {
    const shop = await Shop.findById(req.user._id)
      .select("_id shopName ownerName isOnboarded analyticsPin");

    res.status(200).json({
      success: true,
      shop: {
        _id: shop._id,
        shopName: shop.shopName,
        ownerName: shop.ownerName,
        isOnboarded: shop.isOnboarded,
        hasAnalyticsPin: !!shop.analyticsPin, // ✅ ONLY BOOLEAN
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile" });
  }
});
router.post(
  "/analytics-pin/send-reset-otp",
  protectRoute,
  sendAnalyticsPinResetOtp
);

router.post(
  "/analytics-pin/reset-with-otp",
  protectRoute,
  resetAnalyticsPinWithOtp
);


export default router;
