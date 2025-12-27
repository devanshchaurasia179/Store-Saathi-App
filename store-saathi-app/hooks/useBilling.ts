import { useRef, useState } from "react";
import { Alert } from "react-native";

import { getProductByBarcode } from "../constants/inventory.api";
import { createBill } from "../constants/billing.api";

type BillItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export const useBilling = () => {
  /* ---------------- STATE ---------------- */
  const [items, setItems] = useState<BillItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] =
    useState<"CASH" | "UPI">("CASH");

  // 🔥 product-not-found flow
  const [productNotFound, setProductNotFound] =
    useState<boolean>(false);
  const [lastScannedBarcode, setLastScannedBarcode] =
    useState<string | null>(null);

  // 🔒 prevent infinite scan firing
  const scanLockRef = useRef<string | null>(null);

  /* ---------------- SCAN ---------------- */
  const handleScan = async (barcode: string) => {
    if (!barcode) return;

    // prevent repeated scan spam
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

      setItems(prev => {
        const existing = prev.find(
          i => i.productId === product._id
        );

        if (existing) {
          return prev.map(i =>
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
            price: product.price.sellingPrice,
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
      // unlock scan after short delay
      setTimeout(() => {
        scanLockRef.current = null;
      }, 800);
    }
  };

  /* ---------------- TOTALS ---------------- */
  const subTotal = items.reduce(
    (sum, i) => sum + i.quantity * i.price,
    0
  );

  const totalAmount = Math.max(subTotal - discount, 0);

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
        paidAmount,
        paymentMode,
        customerId,
      });

      // ✅ IMPORTANT:
      // DO NOT reset state here
      // navigation must happen first
      return res.data; // backend returns bill directly
    } catch (err) {
      Alert.alert("Error", "Failed to create bill");
      throw err;
    }
  };

  return {
    // bill items
    items,
    setItems,

    // amounts
    discount,
    setDiscount,
    paidAmount,
    setPaidAmount,
    paymentMode,
    setPaymentMode,
    subTotal,
    totalAmount,

    // actions
    handleScan,
    checkout,

    // product-not-found flow
    productNotFound,
    setProductNotFound,
    lastScannedBarcode,
  };
};
