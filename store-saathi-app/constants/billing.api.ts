import { api } from "./api";

/* ---------------- CREATE BILL ---------------- */
export const createBill = (data: {
  items: {
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    price: number;
  }[];
  discount: number;
  taxPercentage: number;
  paidAmount: number;
  paymentMode: "CASH" | "UPI" | "NONE";
  customerId?: string | null;
}) => {
  return api.post("/bills", data);
};

/* ---------------- GET BILLS ---------------- */
export const getBills = () => {
  return api.get("/bills");
};
