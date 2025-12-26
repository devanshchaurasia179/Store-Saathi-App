import { useEffect, useState, useCallback } from "react";
import { getBills } from "../constants/bills.api";

export const useBills = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBills = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getBills();
      setBills(res?.data?.bills || []);
      setError(null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch bills"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  return {
    bills,
    loading,
    error,
    refresh: fetchBills,
  };
};
