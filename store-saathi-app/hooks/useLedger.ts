import { useEffect, useState, useCallback } from "react";
import {
  getLedgerCustomers,
  getCustomerLedger,
  addCredit,
  addDebit,
} from "../constants/ledger.api";

/* ===============================
   LEDGER LIST (CUSTOMERS)
================================ */
export const useLedgerCustomers = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLedgerCustomers();
      setCustomers(res?.data?.customers || []);
      setShop(res?.data?.shop || null);
    } catch (e) {
      console.error("Ledger customers fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    customers,
    shop,
    loading,
    refresh,
  };
};

/* ===============================
   SINGLE CUSTOMER LEDGER (CHAT)
================================ */
export const useCustomerLedger = (customerId?: string) => {
  const [customer, setCustomer] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---------- HELPERS ---------- */
  const sortEntries = (list: any[]) =>
    list.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    );

  /* ---------- FETCH LEDGER ---------- */
  const refresh = useCallback(async () => {
    if (!customerId) return;

    try {
      // ⛔ do NOT block UI if already loaded
      if (entries.length === 0) setLoading(true);

      const res = await getCustomerLedger(customerId);

      setCustomer(res?.data?.customer || null);
      setEntries(sortEntries(res?.data?.entries || []));
    } catch (e) {
      console.error("Customer ledger fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  /* ---------- OPTIMISTIC ADD ---------- */
  const optimisticAdd = (entry: any) => {
    setEntries((prev) => sortEntries([...prev, entry]));
  };

  const rollbackAdd = (tempId: string) => {
    setEntries((prev) => prev.filter((e) => e._id !== tempId));
  };

  /* ---------- ADD CREDIT ---------- */
  const addNewCredit = async ({
    amount,
    note,
  }: {
    amount: number;
    note?: string;
  }) => {
    const tempId = `temp-${Date.now()}`;

    const optimisticEntry = {
      _id: tempId,
      type: "CREDIT",
      amount,
      note,
      createdAt: new Date().toISOString(),
    };

    optimisticAdd(optimisticEntry);
    setIsSubmitting(true);

    try {
      await addCredit({ customerId: customerId!, amount, note });
      await refresh(); // sync real data
      return { success: true };
    } catch (e: any) {
      rollbackAdd(tempId);
      console.error("Add credit error:", e);
      return {
        success: false,
        error:
          e?.response?.data?.message ||
          e?.message ||
          "Failed to add credit",
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- ADD DEBIT ---------- */
  const addNewDebit = async ({
    amount,
    note,
  }: {
    amount: number;
    note?: string;
  }) => {
    const tempId = `temp-${Date.now()}`;

    const optimisticEntry = {
      _id: tempId,
      type: "DEBIT",
      amount,
      note,
      createdAt: new Date().toISOString(),
    };

    optimisticAdd(optimisticEntry);
    setIsSubmitting(true);

    try {
      await addDebit({ customerId: customerId!, amount, note });
      await refresh();
      return { success: true };
    } catch (e: any) {
      rollbackAdd(tempId);
      console.error("Add debit error:", e);
      return {
        success: false,
        error:
          e?.response?.data?.message ||
          e?.message ||
          "Failed to add debit",
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    customer,
    entries,
    loading,
    isSubmitting,
    refresh,
    addNewCredit,
    addNewDebit,
  };
};
