import { api } from "./api";

/**
 * SEND OTP
 * POST /api/auth/send-otp
 */
export const sendOtp = (mobileNumber: string) => {
  return api.post("/auth/send-otp", { mobileNumber });
};

/**
 * VERIFY OTP
 * POST /api/auth/verify-otp
 */
export const verifyOtp = (mobileNumber: string, otp: string) => {
  return api.post("/auth/verify-otp", {
    mobileNumber,
    otp,
  });
};
