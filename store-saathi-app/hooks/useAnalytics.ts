import { useEffect, useState } from "react";
import {
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getYearlyAnalytics,
} from "../constants/analytics.api";

type Mode = "daily" | "weekly" | "monthly" | "yearly";

export function useAnalytics(mode: Mode, date?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [mode, date]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      let res;
      if (mode === "daily") res = await getDailyAnalytics(date);
      if (mode === "weekly") res = await getWeeklyAnalytics(date);
      if (mode === "monthly") res = await getMonthlyAnalytics(date);
      if (mode === "yearly") res = await getYearlyAnalytics(date);

      setData(res?.data);
    } catch (err: any) {
      console.error("Analytics Error", err);
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}