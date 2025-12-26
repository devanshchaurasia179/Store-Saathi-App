import express from "express";
import {
  sendOtp,
  verifyOtp,
  onboard,
  logout,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/onboarding", protectRoute, onboard);
router.post("/logout", logout);

router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, shop: req.user });
});

export default router;
