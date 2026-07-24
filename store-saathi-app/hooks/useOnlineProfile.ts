import { useCallback, useEffect, useState } from "react";
import {
  getOnlineProfile,
  updateOnlineProfile,
  toggleStoreStatus,
  createOnlineProfile,
} from "../constants/onlineProfile.api";

export type OnlineProfileData = {
  _id?: string;
  storeName: string;
  ownerName: string;
  storeDescription: string;
  storeLogo: string;
  storeBanner: string;
  mobileNumber: string;
  whatsappNumber: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
  };
  deliveryCharges: number;
  freeDeliveryAbove: number;
  minimumOrderAmount: number;
  deliveryRadius: number;
  estimatedDeliveryTime: string;
  deliverySlots: Array<{
    _id?: string;
    label: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>;
  isOnlineOrderingEnabled: boolean;
  isDeliveryAvailable: boolean;
  isPickupAvailable: boolean;
  acceptedPaymentMethods: string[];
  upiId: string;
  businessHours: {
    openTime: string;
    closeTime: string;
    offDays: string[];
  };
  isProfileComplete: boolean;
  isStoreOnline: boolean;
};

export type ProfileDefaults = {
  storeName: string;
  ownerName: string;
  mobileNumber: string;
  upiId: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
  };
};

export function useOnlineProfile() {
  const [profile, setProfile] = useState<OnlineProfileData | null>(null);
  const [defaults, setDefaults] = useState<ProfileDefaults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getOnlineProfile();

      if (res.data?.success) {
        setProfile(res.data.profile || null);
        setDefaults(res.data.defaults || null);
      }
    } catch (err: any) {
      console.error("Fetch Online Profile Error:", err);
      setError("Failed to load online profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const saveProfile = async (data: Record<string, any>) => {
    try {
      setSaving(true);
      setError(null);

      let res;
      if (profile) {
        // Update existing
        res = await updateOnlineProfile(data);
      } else {
        // Create new
        res = await createOnlineProfile({
          storeName: data.storeName || defaults?.storeName || "",
          mobileNumber: data.mobileNumber || defaults?.mobileNumber || "",
          ...data,
        });
      }

      if (res.data?.success) {
        setProfile(res.data.profile);
        return { success: true };
      }

      return { success: false, message: res.data?.message || "Failed to save" };
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to save profile";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setSaving(false);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      setSaving(true);
      const res = await toggleStoreStatus();

      if (res.data?.success && profile) {
        setProfile({
          ...profile,
          isStoreOnline: res.data.isStoreOnline,
        });
        return { success: true, isStoreOnline: res.data.isStoreOnline };
      }

      return { success: false };
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to toggle status";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    defaults,
    loading,
    error,
    saving,
    refetch: fetchProfile,
    saveProfile,
    toggleOnlineStatus,
  };
}
