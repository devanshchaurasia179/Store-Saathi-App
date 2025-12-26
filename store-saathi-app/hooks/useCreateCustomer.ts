// hooks/useCreateCustomer.ts
import { useState } from "react";
import { api } from "../constants/api";

type CreateCustomerPayload = {
  name: string;
  mobileNumber?: string;
  isSupplier?: boolean;
};

export const useCreateCustomer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCustomer = async (
    payload: CreateCustomerPayload
  ) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.post("/customers", payload);

      // ✅ return customer object for further use
      return res.data.customer;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add customer";

      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    createCustomer,
    loading,
    error,
  };
};
