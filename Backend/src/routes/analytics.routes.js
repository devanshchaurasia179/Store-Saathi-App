import express from "express";
import {
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getYearlyAnalytics,
} from "../controllers/analytics.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js"; // Make sure path is correct

const router = express.Router();

// All analytics routes are protected
router.get("/daily", protectRoute, getDailyAnalytics);
router.get("/weekly", protectRoute, getWeeklyAnalytics);
router.get("/monthly", protectRoute, getMonthlyAnalytics);
router.get("/yearly", protectRoute, getYearlyAnalytics);

export default router;