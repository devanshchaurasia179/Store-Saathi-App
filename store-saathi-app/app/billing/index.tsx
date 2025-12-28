import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import BarcodeScanner from "../../components/billing/BarcodeScanner";
import BillItemsList from "../../components/billing/BillItemsList";
import BillSummary from "../../components/billing/BillSummary";
import QuickAddProductModal from "../../components/inventory/QuickAddProductModal";
import AddCustomerModal from "../../components/ledger/AddCustomerModal"; // ← Added import

import { useBilling } from "../../hooks/useBilling";
import { getProducts } from "../../constants/inventory.api";
import { getLedgerCustomers } from "../../constants/ledger.api";

/* ================= PAGE ================= */
export default function BillingPage() {
  /* ---------------- BILLING HOOK ---------------- */
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

  /* ---------------- CUSTOMER STATES ---------------- */
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false); // ← New state

  /* ---------------- PRODUCT STATES ---------------- */
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productOpen, setProductOpen] = useState(false);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    getLedgerCustomers()
      .then((res) => {
        const all = res.data.customers || [];
        // Exclude suppliers
        const onlyCustomers = all.filter((c: any) => !c.isSupplier);
        setCustomers(onlyCustomers);
      })
      .catch(() => {});

    getProducts()
      .then((res) => setProducts(res.data.products || []))
      .catch(() => {});
  }, []);

  /* ---------------- FILTERS ---------------- */
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.mobileNumber?.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 30);
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) || p.barcode?.includes(productSearch)
    );
  }, [products, productSearch]);

  const selectedCustomer =
    customers.find((c) => c._id === customerId)?.name || "Walk-in Customer";

  /* ---------------- ADD PRODUCT ---------------- */
  const addProductToBill = (product: any) => {
    const productId = product._id || product.id;

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);

      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      return [
        ...prev,
        {
          productId: productId,
          name: product.name,
          price: product.price.sellingPrice,
          quantity: 1,
        },
      ];
    });

    setProductOpen(false);
    setProductSearch("");
  };

  /* ---------------- CHECKOUT ---------------- */
  const handleCheckout = async () => {
    try {
      const res = await checkout(customerId || null);

      const bill = res?.bill;

      if (!bill?._id) {
        console.warn("Invalid bill returned", res);
        return;
      }

      router.replace(`/bills/${bill._id}`);
    } catch (err) {
      console.error("Checkout failed", err);
    }
  };

  /* ================= UI ================= */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} />
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>New Bill</Text>
          <Text style={styles.subtitle}>TERMINAL ACTIVE</Text>
        </View>

        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => setProductOpen(true)}
        >
          <Text style={styles.searchBtnText}>Search Product</Text>
        </TouchableOpacity>
      </View>

      {/* SCANNER */}
      <View style={styles.scanner}>
        <BarcodeScanner onScan={handleScan} />
        <View style={styles.scanHint}>
          <Ionicons name="scan" size={12} color="#fff" />
          <Text style={styles.scanText}>Align Barcode</Text>
        </View>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        {/* CUSTOMER */}
        <TouchableOpacity
          style={styles.customerBox}
          onPress={() => setCustomerOpen(true)}
        >
          <Ionicons name="person" size={16} />
          <Text style={styles.customerText}>{selectedCustomer}</Text>
          <Ionicons
            name="search"
            size={14}
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        {/* ITEMS */}
        <View style={{ flex: 1 }}>
          {items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="add-circle-outline" size={32} />
              <Text style={styles.emptyText}>Scanner Ready</Text>
            </View>
          ) : (
            <BillItemsList items={items} setItems={setItems} />
          )}
        </View>

        {/* SUMMARY */}
        <View style={styles.summary}>
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

      {/* CUSTOMER SEARCH WITH ADD OPTION */}
      <SearchOverlay
        visible={customerOpen}
        title="Search Customer"
        value={customerSearch}
        onChange={setCustomerSearch}
        onClose={() => {
          setCustomerOpen(false);
          setCustomerSearch("");
        }}
        items={filteredCustomers}
        onSelect={(c: any) => {
          setCustomerId(c._id || "");
          setCustomerOpen(false);
          setCustomerSearch("");
        }}
        walkInOption
        renderItem={(c: any) => (
          <>
            <Text style={styles.itemTitle}>{c.name}</Text>
            <Text style={styles.itemSub}>{c.mobileNumber || "No mobile"}</Text>
          </>
        )}
        extraTopOption={
          <TouchableOpacity
            style={styles.addNewOption}
            onPress={() => {
              setCustomerOpen(false);
              setAddCustomerModalVisible(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#2563eb" />
            <Text style={styles.addNewText}>Add New Customer</Text>
          </TouchableOpacity>
        }
      />

      {/* PRODUCT SEARCH */}
      <SearchOverlay
        visible={productOpen}
        title="Search Product"
        value={productSearch}
        onChange={setProductSearch}
        onClose={() => setProductOpen(false)}
        items={filteredProducts}
        onSelect={addProductToBill}
        renderItem={(p: any) => (
          <View style={styles.productRow}>
            <View>
              <Text style={styles.itemTitle}>{p.name}</Text>
              <Text style={styles.itemSub}>{p.barcode}</Text>
            </View>
            <Text style={styles.price}>₹{p.price.sellingPrice}</Text>
          </View>
        )}
      />

      {/* QUICK ADD PRODUCT */}
      {productNotFound && lastScannedBarcode && (
        <QuickAddProductModal
          barcode={lastScannedBarcode}
          onClose={() => setProductNotFound(false)}
          onSuccess={(newProduct) => {
            addProductToBill(newProduct);
          }}
        />
      )}

      {/* ADD NEW CUSTOMER MODAL */}
      <AddCustomerModal
        visible={addCustomerModalVisible}
        isSupplier={false}
        onClose={() => setAddCustomerModalVisible(false)}
        onAdded={() => {
          // Refresh customer list after adding a new one
          getLedgerCustomers()
            .then((res) => {
              const all = res.data.customers || [];
              const onlyCustomers = all.filter((c: any) => !c.isSupplier);
              setCustomers(onlyCustomers);
            })
            .catch(() => {});
        }}
      />
    </SafeAreaView>
  );
}

/* ================= SEARCH OVERLAY ================= */
function SearchOverlay({
  visible,
  title,
  value,
  onChange,
  onClose,
  items,
  onSelect,
  renderItem,
  walkInOption,
  extraTopOption, // ← New prop
}: any) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.searchHeader}>
            <Ionicons name="search" size={14} />
            <TextInput
              autoFocus
              placeholder={title}
              value={value}
              onChangeText={onChange}
              style={styles.input}
            />
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={16} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {/* Add New Customer Option */}
            {extraTopOption}

            {/* Walk-in Option */}
            {walkInOption && (
              <TouchableOpacity
                onPress={() => onSelect({ _id: "" })}
                style={styles.walkIn}
              >
                <Text style={styles.walkInText}>Walk-in customer</Text>
              </TouchableOpacity>
            )}

            {/* Customer/Product List */}
            {items.map((item: any) => (
              <TouchableOpacity
                key={item._id}
                onPress={() => onSelect(item)}
                style={styles.listItem}
              >
                {renderItem(item)}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    gap: 12,
  },

  title: { fontSize: 14, fontWeight: "700" },
  subtitle: {
    fontSize: 9,
    color: "#2563eb",
    fontWeight: "700",
  },

  searchBtn: {
    marginLeft: "auto",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  searchBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563eb",
  },

  scanner: { height: "22%", backgroundColor: "#020617" },
  scanHint: {
    position: "absolute",
    top: 8,
    alignSelf: "center",
    flexDirection: "row",
    gap: 4,
  },
  scanText: { fontSize: 8, color: "#fff", fontWeight: "700" },

  body: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
  },

  customerBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    margin: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
    borderColor: "#eee",
  },

  customerText: { fontSize: 12, fontWeight: "700" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyText: { fontSize: 12, fontWeight: "700" },

  summary: {
    borderTopWidth: 1,
    borderColor: "#eee",
    padding: 16,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    paddingTop: 80,
  },

  sheet: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "70%",
  },

  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  input: { flex: 1, fontSize: 12 },

  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },

  itemTitle: { fontWeight: "700", fontSize: 12 },
  itemSub: { fontSize: 10, color: "#64748b" },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  price: { fontWeight: "700", color: "#2563eb" },

  walkIn: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  walkInText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
  },

  // New styles for Add New Customer option
  addNewOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
    backgroundColor: "#eff6ff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  addNewText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563eb",
  },
});