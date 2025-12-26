import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
// Import useSafeAreaInsets to handle the bottom spacing perfectly
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import BarcodeScanner from "../../components/billing/BarcodeScanner";
import BillItemsList from "../../components/billing/BillItemsList";
import BillSummary from "../../components/billing/BillSummary";
import SearchOverlay from "../../components/SearchOverlay";
import QuickAddProductModal from "../../components/inventory/QuickAddProductModal";

import { useBilling } from "../../hooks/useBilling";
import { getProducts } from "../../constants/inventory.api";
import { getLedgerCustomers } from "../../constants/ledger.api";

export default function BillingPage() {
  const insets = useSafeAreaInsets();
  const {
    items,
    setItems,
    handleScan,
    subTotal,
    discount,
    setDiscount,
    paidAmount,
    setPaidAmount,
    totalAmount,
    checkout,
    productNotFound,
    setProductNotFound,
    lastScannedBarcode,
  } = useBilling();

  /* ---------------- STATES ---------------- */
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [customerOpen, setCustomerOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    getLedgerCustomers().then((res) => setCustomers(res.data.customers || []));
    getProducts().then((res) => setProducts(res.data.products || []));
  }, []);

  /* ---------------- FILTERS ---------------- */
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.mobileNumber?.includes(customerSearch)
    );
  }, [customerSearch, customers]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 30);
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) || p.barcode?.includes(productSearch)
    );
  }, [productSearch, products]);

  const selectedCustomer =
    customers.find((c) => c._id === customerId)?.name || "Walk-in Customer";

  /* ---------------- ADD PRODUCT ---------------- */
  const addProduct = (product: any) => {
    if (!product || !product._id) return;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);

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
          price: product.price?.sellingPrice ?? 0,
          quantity: 1,
        },
      ];
    });

    setProductOpen(false);
    setProductSearch("");
  };

  /* ---------------- CHECKOUT ---------------- */
  const handleCheckout = async () => {
    const bill = await checkout(customerId || null);
    if (bill?._id) {
      router.push(`/bills/${bill._id}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top SafeArea for Status Bar and Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }} />
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>New Bill</Text>

        <TouchableOpacity
          style={styles.searchActionBtn}
          onPress={() => setProductOpen(true)}
        >
          <Ionicons name="search" size={18} color="#fff" />
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* SCANNER SECTION */}
      <View style={styles.scannerSection}>
        <View style={styles.scannerWrapper}>
          <BarcodeScanner onScan={handleScan} onClose={() => {}} />
        </View>
      </View>

      {/* BODY CONTENT */}
      <View style={styles.body}>
        {/* CUSTOMER SELECTOR */}
        <TouchableOpacity
          style={styles.customerBox}
          onPress={() => setCustomerOpen(true)}
        >
          <View style={styles.customerInfo}>
            {/* FIXED: Changed <div> to <View> below */}
            <View style={styles.customerIconContainer}>
              <Ionicons name="person" size={18} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.label}>Customer</Text>
              <Text style={styles.customerText}>{selectedCustomer}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        {/* ITEMS LIST */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Bill Items</Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {items.length === 0 ? (
              <View style={styles.empty}>
                <View style={styles.emptyCircle}>
                  <Ionicons name="barcode-outline" size={40} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyText}>Ready to scan products</Text>
                <Text style={styles.emptySubText}>
                  Items will appear here once scanned
                </Text>
              </View>
            ) : (
              <BillItemsList items={items} setItems={setItems} />
            )}
          </ScrollView>
        </View>

        {/* SUMMARY SECTION - Adjusted with Dynamic Insets */}
        <View style={{ marginBottom: insets.bottom + 10 }}>
          <BillSummary
            subTotal={subTotal}
            discount={discount}
            setDiscount={setDiscount}
            paidAmount={paidAmount}
            setPaidAmount={setPaidAmount}
            totalAmount={totalAmount}
            onCheckout={handleCheckout}
            disabled={!items.length}
          />
        </View>
      </View>

      {/* OVERLAYS & MODALS */}
      {customerOpen && (
        <SearchOverlay
          title="Search Customer"
          value={customerSearch}
          onChange={setCustomerSearch}
          items={filteredCustomers}
          onClose={() => setCustomerOpen(false)}
          onSelect={(c: any) => {
            setCustomerId(c._id);
            setCustomerOpen(false);
          }}
          renderItem={(c: any) => (
            <View style={styles.searchItem}>
              <Text style={styles.searchItemName}>{c.name}</Text>
              <Text style={styles.searchItemSub}>{c.mobileNumber}</Text>
            </View>
          )}
          walkInOption
        />
      )}

      {productOpen && (
        <SearchOverlay
          title="Search Product"
          value={productSearch}
          onChange={setProductSearch}
          items={filteredProducts}
          onClose={() => setProductOpen(false)}
          onSelect={addProduct}
          renderItem={(p: any) => (
            <View style={styles.productRow}>
              <Text style={styles.searchItemName}>{p.name}</Text>
              <Text style={styles.priceTag}>₹{p.price.sellingPrice}</Text>
            </View>
          )}
        />
      )}

      {productNotFound && lastScannedBarcode && (
        <QuickAddProductModal
          barcode={lastScannedBarcode}
          onClose={() => setProductNotFound(false)}
          onSuccess={addProduct}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  iconBtn: {
    padding: 4,
  },
  searchActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  searchBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  scannerSection: {
    height: "25%",
    backgroundColor: "#0f172a",
    padding: 16,
    justifyContent: "center",
  },
  scannerWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  body: {
    flex: 1,
    marginTop: -24,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  customerBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    marginBottom: 20,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 2,
  },
  customerText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  emptySubText: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  searchItem: {
    paddingVertical: 2,
  },
  searchItemName: {
    fontWeight: "600",
    fontSize: 15,
    color: "#1e293b",
  },
  searchItemSub: {
    fontSize: 12,
    color: "#64748b",
  },
  priceTag: {
    fontWeight: "700",
    color: "#059669",
  },
});