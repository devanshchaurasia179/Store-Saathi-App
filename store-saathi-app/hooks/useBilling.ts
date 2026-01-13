import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Alert } from "react-native";

import { getProductByBarcode } from "../constants/inventory.api";
import { createBill } from "../constants/billing.api";

/* ---------------- TYPES ---------------- */

type BillItem = {
  productId: string;
  name: string;
  price: number;
  unit: string; // unit | kg | g | litre | ml | pack | box
  displayUnit?: string;
  quantity: number;
};

export const useBilling = () => {
  /* ---------------- STATE ---------------- */
  const [items, setItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  const [paymentMode, setPaymentMode] =
    useState<"CASH" | "UPI" | "NONE">("NONE");

  const [productNotFound, setProductNotFound] =
    useState<boolean>(false);
  const [lastScannedBarcode, setLastScannedBarcode] =
    useState<string | null>(null);

  const scanLockRef = useRef<string | null>(null);

  /* ---------------- TOTALS (Memoized) ---------------- */
  const subTotal = useMemo(() => {
    return items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return (subTotal * taxPercentage) / 100;
  }, [subTotal, taxPercentage]);

  const totalAmount = useMemo(() => {
    return Math.max(subTotal + taxAmount - discount, 0);
  }, [subTotal, taxAmount, discount]);

  /* ---------------- ✅ THE FIX ---------------- */
  /**
   * Automatically update paidAmount to match totalAmount.
   * This ensures that as you scan items, the "Amount Received" 
   * field updates in real-time.
   */
  useEffect(() => {
    setPaidAmount(totalAmount);
  }, [totalAmount]);

  /* ---------------- SCAN ---------------- */
  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode) return;
    if (scanLockRef.current === barcode) return;

    scanLockRef.current = barcode;
    setLastScannedBarcode(barcode);

    try {
      const res = await getProductByBarcode(barcode);
      const product = res.data?.product;

      if (!product) {
        setProductNotFound(true);
        return;
      }

      setProductNotFound(false);

      setItems((prev) => {
        const existing = prev.find(
          (i) => i.productId === product._id
        );

        if (existing) {
          return prev.map((i) =>
            i.productId === product._id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }

        return [
          ...prev,
          {
            productId: product._id,
            name: product.name,
            price: product.price?.sellingPrice || 0,
            unit: product.unit || "unit",
            displayUnit: undefined,
            quantity: 1,
          },
        ];
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setProductNotFound(true);
      } else {
        Alert.alert("Scan Failed", "Unable to fetch product");
      }
    } finally {
      // Debounce the lock slightly to prevent jitter scans
      setTimeout(() => {
        scanLockRef.current = null;
      }, 500);
    }
  }, []);

  /* ---------------- CHECKOUT ---------------- */
  const checkout = async (customerId: string | null) => {
    if (!items.length) {
      Alert.alert("Empty Bill", "No items in bill");
      return null;
    }

    try {
      const res = await createBill({
        items,
        discount,
        taxPercentage,
        paidAmount,
        paymentMode: paymentMode === "NONE" ? "CASH" : paymentMode,
        customerId,
      });

      return res.data;
    } catch (err) {
      Alert.alert("Error", "Failed to create bill");
      throw err;
    }
  };

  /* ---------------- RESET BILL ---------------- */
  const resetBill = () => {
    setItems([]);
    setDiscount(0);
    setTaxPercentage(0);
    setPaidAmount(0);
    setPaymentMode("NONE");
    setLastScannedBarcode(null);
    setProductNotFound(false);
  };

  return {
    // items
    items,
    setItems,

    // amounts
    discount,
    setDiscount,
    taxPercentage,
    setTaxPercentage,
    paidAmount,
    setPaidAmount,
    paymentMode,
    setPaymentMode,

    subTotal,
    totalAmount,

    // actions
    handleScan,
    checkout,
    resetBill,

    // scan flow
    productNotFound,
    setProductNotFound,
    lastScannedBarcode,
  };
};