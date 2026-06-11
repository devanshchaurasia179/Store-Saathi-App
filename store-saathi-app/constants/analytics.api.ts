import { api } from "./api";

/* ================= ANALYTICS APIs ================= */

export const getDailyAnalytics = (date?: string) => {
  return api.get("/analytics/daily", {
    params: { date },
  });
};

export const getWeeklyAnalytics = (date?: string) => {
  return api.get("/analytics/weekly", {
    params: { date },
  });
};

export const getMonthlyAnalytics = (date?: string) => {
  return api.get("/analytics/monthly", {
    params: { date },
  });
};

export const getYearlyAnalytics = (date?: string) => {
  return api.get("/analytics/yearly", {
    params: { date },
  });
};

export type ReportPeriod = "last_month" | "last_quarter" | "last_6_months" | "last_year";

export const getAnalyticsReport = (period: ReportPeriod) => {
  return api.get("/analytics/report", {
    params: { period },
  });
};