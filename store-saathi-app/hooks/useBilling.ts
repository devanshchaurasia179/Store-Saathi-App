import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Alert } from "react-native";

import { getProductByBarcode } from "../constants/inventory.api";
import { createBill } from "../constants/billing.api";

/* ---------------- TYPES ---------------- */

type BillItem = {
  productId: string;
  variantId?: string | null;
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

  /* ---------------- TOTALS ---------------- */
  const subTotal = useMemo(() => {
    return items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    return (subTotal * taxPercentage) / 100;
  }, [subTotal, taxPercentage]);

  const totalAmount = useMemo(() => {
    return Math.max(subTotal + taxAmount - discount, 0);
  }, [subTotal, taxAmount, discount]);

  /* ---------------- AUTO PAID AMOUNT ---------------- */
  useEffect(() => {
    setPaidAmount(totalAmount);
  }, [totalAmount]);

  /* ---------------- SCAN (VARIANT SAFE) ---------------- */
  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode) return;
    if (scanLockRef.current === barcode) return;

    scanLockRef.current = barcode;
    setLastScannedBarcode(barcode);

    try {
      const res = await getProductByBarcode(barcode);

      const product = res.data?.product;
      const variant = res.data?.variant || null;

      if (!product) {
        setProductNotFound(true);
        return;
      }

      setProductNotFound(false);

      setItems((prev) => {
        const existing = prev.find(
          (i) =>
            i.productId === product._id &&
            i.variantId === (variant?._id || null)
        );

        if (existing) {
          return prev.map((i) =>
            i.productId === product._id &&
            i.variantId === (variant?._id || null)
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        }

        return [
          ...prev,
          {
            productId: product._id,
            variantId: variant?._id || null,
            name: variant
              ? `${product.name} (${variant.name})`
              : product.name,
            price: variant
              ? variant.price?.sellingPrice
              : product.price?.sellingPrice || 0,
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
      setTimeout(() => {
        scanLockRef.current = null;
      }, 500);
    }
  }, []);

  /* ---------------- CHECKOUT ---------------- */
const checkout = async (
  customerId: string | null,
  mode: "CASH" | "UPI" | "CARD" | "NONE" | "OTHERS"
) => {
  if (!items.length) {
    Alert.alert("Empty Bill", "No items in bill");
    return null;
  }

  try {
    const payload = {
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || null,
        quantity: i.quantity,
      })),
      discount,
      taxPercentage,
      paidAmount,
      paymentMode: paidAmount === 0 ? "NONE" : mode,
      customerId,
    };

    const res = await createBill(payload);
    return res.data;
  } catch (err) {
    Alert.alert("Error", "Failed to create bill");
    throw err;
  }
};


  /* ---------------- RESET ---------------- */
  const resetBill = () => {
    setItems([]);
    setDiscount(0);
    setTaxPercentage(0);
    setPaidAmount(0);
    setPaymentMode("NONE");
    setLastScannedBarcode(null);
    setProductNotFound(false);
  };
const addItemByProduct = useCallback(
  (product: any, variant: any | null = null) => {
    setItems((prev) => {
      const productId = product._id;
      const variantId = variant?._id ?? null;

      const existing = prev.find(
        (i) =>
          i.productId === productId &&
          i.variantId === variantId
      );

      if (existing) {
        return prev.map((i) =>
          i.productId === productId &&
          i.variantId === variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [
        ...prev,
        {
          productId,
          variantId,
          name: variant
            ? `${product.name} (${variant.name})`
            : product.name,
          price: variant
            ? variant.price?.sellingPrice ?? 0
            : product.price?.sellingPrice ?? 0,
          unit: product.unit || "unit",
          quantity: 1,
        },
      ];
    });
  },
  []
);

  return {
    items,
    setItems,

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

    handleScan,
    checkout,
    resetBill,

    productNotFound,
    setProductNotFound,
    lastScannedBarcode,

    addItemByProduct
  };
};
