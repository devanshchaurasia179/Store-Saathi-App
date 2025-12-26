import { api } from "./api";

// SEND OTP
export const sendOtp = (mobileNumber) => {
  return api.post("/auth/send-otp", { mobileNumber });
};

// VERIFY OTP
export const verifyOtp = (mobileNumber, otp) => {
  return api.post("/auth/verify-otp", {
    mobileNumber,
    otp,
  });
};
