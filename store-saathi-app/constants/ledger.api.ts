import { api } from "./api";

/* =========================================================
   📒 LEDGER APIs
========================================================= */

/**
 * GET ALL LEDGER CUSTOMERS (CUSTOMERS + SUPPLIERS)
 * GET /customers?pending=true
 */
export const getLedgerCustomers = () => {
  return api.get("/customers?pending=true");
};

/**
 * GET SINGLE CUSTOMER LEDGER (CHAT VIEW)
 * GET /ledger/customer/:customerId
 */
export const getCustomerLedger = (customerId: string) => {
  return api.get(`/ledger/customer/${customerId}`);
};

/**
 * ADD DEBIT (CUSTOMER OWES MONEY)
 * POST /ledger/debit
 */
export const addDebit = (data: {
  customerId: string;
  amount: number;
  note?: string;
}) => {
  return api.post("/ledger/debit", data);
};

/**
 * ADD CREDIT (CUSTOMER PAID MONEY)
 * POST /ledger/credit
 */
export const addCredit = (data: {
  customerId: string;
  amount: number;
  note?: string;
}) => {
  return api.post("/ledger/credit", data);
};

/**
 * UPDATE CUSTOMER / SUPPLIER DETAILS
 * PUT /customers/:customerId
 */
export const updateCustomer = (
  customerId: string,
  data: {
    name?: string;
    mobileNumber?: string;
    isSupplier?: boolean;
  }
) => {
  return api.put(`/customers/${customerId}`, data);
};
