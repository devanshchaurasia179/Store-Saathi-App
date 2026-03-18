import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/member.controller.js";

const router = express.Router();

/* ================= MEMBER ROUTES ================= */

// ✅ Create Member
router.post("/", createCustomer);

// ✅ Get all Members
router.get("/", getAllCustomers);

// ✅ Get single Member
router.get("/:id", getCustomer);

// ✅ Update Member
router.put("/:id", updateCustomer);

// ✅ Delete Member (Hard Delete)
router.delete("/:id", deleteCustomer);

export default router;