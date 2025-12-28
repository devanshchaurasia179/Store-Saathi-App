import { api } from "./api";

export const sendOtp = (mobileNumber: string) =>
  api.post("/auth/send-otp", { mobileNumber });

export const verifyOtp = (mobileNumber: string, otp: string) =>
  api.post("/auth/verify-otp", { mobileNumber, otp });

export const onboardShop = (data: {
  shopName: string;
  ownerName: string;
  gstNumber?: string;
  storeCategory?: string;
  upiId?: string;
  location?: string;
}) => {
  return api.post("/auth/onboarding", data);
};
export const getMe = () => {
  return api.get("/auth/me");
};