import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createBill,
  getBills,
  getBillById,
  deleteBill,
} from "../controllers/bill.controller.js";

const router = express.Router();

router.post("/", protectRoute, createBill);
router.get("/", protectRoute, getBills);
router.get("/:billId", protectRoute, getBillById);
router.delete("/:billId", deleteBill);
export default router;
