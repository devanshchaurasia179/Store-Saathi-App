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