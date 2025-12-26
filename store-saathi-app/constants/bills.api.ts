import { api } from "./api";

/* =========================================================
   🧾 BILL APIs
========================================================= */

/**
 * CREATE BILL
 * POST /bills
 */
export const createBill = (data: {
  customerId?: string;
  items: any[];
  totalAmount: number;
  paidAmount?: number;
  paymentStatus?: "PAID" | "PARTIAL" | "UNPAID";
}) => {
  return api.post("/bills", data);
};

/**
 * GET ALL BILLS (HISTORY)
 * GET /bills
 */
export const getBills = () => {
  return api.get("/bills");
};

/**
 * GET SINGLE BILL (VIEW MODAL)
 * GET /bills/:billId
 */
export const getBillById = (billId: string) => {
  return api.get(`/bills/${billId}`);
};
