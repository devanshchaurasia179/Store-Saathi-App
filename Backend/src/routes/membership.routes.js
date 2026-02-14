import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

import {
  createOrRenewMembership,
  cancelMembership,
  getMembershipEntries,
  getAllMemberships
} from "../controllers/membership.controller.js";

const router = express.Router();

/**
 * ============================
 * MEMBERSHIP ROUTES
 * Base: /api/memberships
 * ============================
 */

// 🔐 Protect all membership routes
router.use(protectRoute);

/**
 * --------------------------------
 * CREATE / RENEW MEMBERSHIP
 * --------------------------------
 * POST /api/memberships/:customerId
 */
router.post("/:customerId", createOrRenewMembership);

/**
 * --------------------------------
 * CANCEL MEMBERSHIP
 * --------------------------------
 * POST /api/memberships/:customerId/cancel
 */
router.post("/:customerId/cancel", cancelMembership);

/**
 * --------------------------------
 * MEMBERSHIP LEDGER (ENTRIES)
 * --------------------------------
 * GET /api/memberships/entries/:customerId
 */
router.get("/entries/:customerId", getMembershipEntries);

router.get("/", getAllMemberships);


export default router;
