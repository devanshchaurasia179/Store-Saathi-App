import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/member.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

/* ================= MEMBER ROUTES ================= */

// ✅ Create Member
router.post("/",protectRoute, createCustomer);

// ✅ Get all Members
router.get("/",protectRoute, getAllCustomers);

// ✅ Get single Member
router.get("/:id",protectRoute, getCustomer);

// ✅ Update Member
router.put("/:id",protectRoute, updateCustomer);

// ✅ Delete Member (Hard Delete)
router.delete("/:id",protectRoute, deleteCustomer);

export default router;