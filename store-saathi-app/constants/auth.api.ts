import { api } from "./api";

/* ================= OTP AUTH (ApiTxT SMS) ================= */

export const sendOtp = (mobileNumber: string) => {
  return api.post("/auth/send-otp", { mobileNumber });
};

export const verifyOtp = (mobileNumber: string, otp: string) => {
  return api.post("/auth/verify-otp", { mobileNumber, otp });
};

/* ================= SECRET KEY LOGIN ================= */

export const loginWithSecretKey = (
  mobileNumber: string,
  secretKey: string
) => {
  return api.post("/auth/login-with-secret", {
    mobileNumber,
    secretKey,
  });
};

/* ================= ANALYTICS PIN ================= */

export const setAnalyticsPin = (analyticsPin: string) => {
  return api.post("/auth/set-analytics-pin", { analyticsPin });
};

export const verifyAnalyticsPin = (analyticsPin: string) =>
  api.post("/auth/verify-analytics-pin", { analyticsPin });

export const updateAnalyticsPin = (
  oldPin: string,
  newPin: string
) => {
  return api.post("/auth/update-analytics-pin", {
    oldPin,
    newPin,
  });
};

export const sendAnalyticsPinResetOtp = () =>
  api.post("/auth/analytics-pin/send-reset-otp");

export const resetAnalyticsPinWithOtp = (otp: string, newPin: string) =>
  api.post("/auth/analytics-pin/reset-with-otp", {
    otp,
    newPin,
  });



/* ================= SECRET KEY RESET ================= */

export const resetSecretKey = (analyticsPin: string) => {
  return api.post("/auth/reset-secret", { analyticsPin });
};

/* ================= ONBOARDING ================= */

export const onboardShop = (data: {
  shopName: string;
  ownerName: string;
  gstNumber?: string;
  storeCategory?: string;
  upiId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
}) => {
  return api.post("/auth/onboarding", data);
};

/* ================= SESSION ================= */

export const getMe = () => {
  return api.get("/auth/me");
};

export const logout = () => {
  return api.post("/auth/logout");
};
