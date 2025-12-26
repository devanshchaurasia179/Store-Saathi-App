import { useState } from "react";
import { Alert } from "react-native";

import { getProductByBarcode } from "../constants/inventory.api";
import { createBill } from "../constants/billing.api";

export const useBilling = () => {
  const [items, setItems] = useState<any[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("CASH");

  const [productNotFound, setProductNotFound] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] =
    useState<string | null>(null);

  /* ---------------- SCAN ---------------- */
  const handleScan = async (barcode: string) => {
    if (!barcode) return;

    setLastScannedBarcode(barcode);

    try {
      const res = await getProductByBarcode(barcode);
      const product = res.data?.product;

      if (!product) {
        setProductNotFound(true);
        return;
      }

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
        return;
      }

      Alert.alert("Scan Failed", "Unable to fetch product");
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
      return;
    }

    try {
      const res = await createBill({
        items,
        discount,
        paidAmount,
        paymentMode,
        customerId,
      });

      Alert.alert("Success", "Bill created successfully");

      setItems([]);
      setDiscount(0);
      setPaidAmount(0);
      setPaymentMode("CASH");

      return res.data.bill;
    } catch {
      Alert.alert("Error", "Failed to create bill");
      throw new Error("Create bill failed");
    }
  };

  return {
    items,
    setItems,
    discount,
    setDiscount,
    paidAmount,
    setPaidAmount,
    paymentMode,
    setPaymentMode,
    subTotal,
    totalAmount,
    handleScan,
    checkout,
    productNotFound,
    setProductNotFound,
    lastScannedBarcode,
  };
};
