import { api } from "./api";

/* ---------------- CREATE BILL ---------------- */
export const createBill = (data: {
  items: any[];
  discount: number;
  paidAmount: number;
  paymentMode: string;
  customerId?: string | null;
}) => {
  return api.post("/bills", data);
};

/* ---------------- GET BILLS ---------------- */
export const getBills = () => {
  return api.get("/bills");
};
