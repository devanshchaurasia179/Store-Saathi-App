import { api } from "./api";

/* ================= ONLINE PROFILE APIs ================= */
/* Uses /api/online-profile — requires shop owner auth */

/**
 * GET ONLINE PROFILE
 * GET /api/online-profile
 */
export const getOnlineProfile = () => {
  return api.get("/online-profile");
};

/**
 * CREATE ONLINE PROFILE
 * POST /api/online-profile
 */
export const createOnlineProfile = (data: {
  storeName: string;
  mobileNumber: string;
  ownerName?: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  whatsappNumber?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  deliveryCharges?: number;
  freeDeliveryAbove?: number;
  minimumOrderAmount?: number;
  deliveryRadius?: number;
  estimatedDeliveryTime?: string;
  deliverySlots?: Array<{
    label: string;
    startTime: string;
    endTime: string;
    isActive?: boolean;
  }>;
  isDeliveryAvailable?: boolean;
  isPickupAvailable?: boolean;
  acceptedPaymentMethods?: string[];
  upiId?: string;
  businessHours?: {
    openTime?: string;
    closeTime?: string;
    offDays?: string[];
  };
}) => {
  return api.post("/online-profile", data);
};

/**
 * UPDATE ONLINE PROFILE
 * PUT /api/online-profile
 */
export const updateOnlineProfile = (data: Record<string, any>) => {
  return api.put("/online-profile", data);
};

/**
 * TOGGLE STORE ONLINE/OFFLINE STATUS
 * PATCH /api/online-profile/toggle-status
 */
export const toggleStoreStatus = () => {
  return api.patch("/online-profile/toggle-status");
};
