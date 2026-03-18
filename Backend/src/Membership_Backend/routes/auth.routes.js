import express from "express";
import Business from "../models/Business.js";

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



router.get("/me", protectRoute, async (req, res) => {
  try {
    const business = await Business.findById(req.user._id)
      .select("+analyticsPin"); // ✅ CRITICAL FIX

    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const businessObj = business.toObject();

    // 🔒 Remove sensitive fields
    delete businessObj.otp;
    delete businessObj.otpExpiresAt;
    delete businessObj.analyticsPin; // still remove from response
    delete businessObj.secretKey;
    delete businessObj.analyticsPinOtpAttempts;
    delete businessObj.analyticsPinOtpBlockedUntil;

    res.status(200).json({
      success: true,
      shop: {
        ...businessObj,
        hasAnalyticsPin: !!business.analyticsPin, // ✅ NOW TRUE
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load profile" });
  }
});

export default router;
