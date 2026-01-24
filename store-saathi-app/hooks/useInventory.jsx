import { useEffect, useState, useCallback } from "react";
import { getProducts } from "../constants/inventory.api";

export const useInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const res = await getProducts();
      setProducts(res.data.products || []);
    } catch (e) {
      console.error("Inventory fetch error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  
  return {
    products,
    loading,
    refresh, // refresh(true) = silent refresh
  };
};
