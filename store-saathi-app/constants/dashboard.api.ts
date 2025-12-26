import { api } from "./api";

/**
 * GET DASHBOARD DATA
 * GET /api/dashboard
 */
export const getDashboard = () => {
  return api.get("/dashboard");
};
