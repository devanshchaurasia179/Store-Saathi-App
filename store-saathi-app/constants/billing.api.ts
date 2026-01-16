import { api } from "./api";

/* ---------------- CREATE BILL ---------------- */
type CreateBillPayload = {
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
  }[];
  discount: number;
  taxPercentage: number;
  paidAmount: number;
  paymentMode: "CASH" | "UPI";
  customerId?: string | null;
};

export function createBill(payload: CreateBillPayload) {
  return api.post("/bills", payload);
}


/* ---------------- GET BILLS ---------------- */
export const getBills = () => {
  return api.get("/bills");
};
