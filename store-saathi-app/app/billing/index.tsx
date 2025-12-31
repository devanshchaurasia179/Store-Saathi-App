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

/* 📦 COMPONENTS */
import BarcodeScanner from "../../components/billing/BarcodeScanner";
import BillItemsList from "../../components/billing/BillItemsList";
import BillSummary from "../../components/billing/BillSummary";
import QuickAddProductModal from "../../components/inventory/QuickAddProductModal";
import AddCustomerModal from "../../components/ledger/AddCustomerModal";

/* 🛠 HOOKS & API */
import { useBilling } from "../../hooks/useBilling";
import { getProducts } from "../../constants/inventory.api";
import { getLedgerCustomers } from "../../constants/ledger.api";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_BILLING } from "../../constants/language_billing";
import { useLanguage } from "../../providers/LanguageProvider";

export default function BillingPage() {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_BILLING[language] || LANGUAGE_TEXT_BILLING.en;

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
  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false);

  /* ---------------- PRODUCT STATES ---------------- */
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productOpen, setProductOpen] = useState(false);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    getLedgerCustomers()
      .then((res) => {
        const all = res.data.customers || [];
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
    customers.find((c) => c._id === customerId)?.name || t.walkInCustomer;

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

    // ✅ PASS UNIT FROM BACKEND
    unit: product.unit || "unit",

    // ✅ STORE QUANTITY IN BASE UNITS
    quantity:
      product.unit === "kg" || product.unit === "litre"
        ? 1 // 1kg / 1 litre
        : 1,    // unit/pcs
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
      if (!bill?._id) return;
      router.replace(`/bills/${bill._id}`);
    } catch (err) {
      console.error("Checkout failed", err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.terminalActive}</Text>
        </View>

        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => setProductOpen(true)}
        >
          <Ionicons name="search" size={14} color="#2563eb" style={{ marginRight: 4 }} />
          <Text style={styles.searchBtnText}>{t.searchProduct}</Text>
        </TouchableOpacity>
      </View>

      {/* SCANNER */}
      <View style={styles.scanner}>
        <BarcodeScanner onScan={handleScan} />
        <View style={styles.scanHint}>
          <Ionicons name="scan" size={14} color="#fff" />
          <Text style={styles.scanText}>{t.alignBarcode}</Text>
        </View>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        {/* CUSTOMER BOX */}
        <TouchableOpacity
          style={styles.customerBox}
          onPress={() => setCustomerOpen(true)}
        >
          <View style={styles.customerIconWrap}>
            <Ionicons name="person" size={16} color="#475569" />
          </View>
          <View>
             <Text style={styles.customerLabel}>{t.customer}</Text>
             <Text style={styles.customerText}>{selectedCustomer}</Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={16}
            color="#94a3b8"
            style={{ marginLeft: "auto" }}
          />
        </TouchableOpacity>

        {/* ITEMS LIST */}
        <View style={{ flex: 1 }}>
          {items.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="barcode-outline" size={40} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyText}>{t.scannerReady}</Text>
            </View>
          ) : (
            <BillItemsList items={items} setItems={setItems} />
          )}
        </View>

        {/* SUMMARY SECTION */}
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

      {/* CUSTOMER SEARCH OVERLAY */}
      <SearchOverlay
        visible={customerOpen}
        title={t.searchCustomer}
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
        walkInLabel={t.walkInCustomer}
        renderItem={(c: any) => (
          <>
            <Text style={styles.itemTitle}>{c.name}</Text>
            <Text style={styles.itemSub}>{c.mobileNumber || t.noPhone}</Text>
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
            <View style={styles.addIconCircle}>
                <Ionicons name="add" size={18} color="#2563eb" />
            </View>
            <Text style={styles.addNewText}>{t.addNewCustomer}</Text>
          </TouchableOpacity>
        }
      />

      {/* PRODUCT SEARCH OVERLAY */}
      <SearchOverlay
        visible={productOpen}
        title={t.searchProduct}
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

      {/* QUICK ADD MODAL */}
      {productNotFound && lastScannedBarcode && (
        <QuickAddProductModal
          visible={productNotFound}
          barcode={lastScannedBarcode}
          onClose={() => setProductNotFound(false)}
          onSuccess={(newProduct) => {
            addProductToBill(newProduct);
          }}
        />
      )}

      {/* ADD CUSTOMER MODAL */}
      <AddCustomerModal
        visible={addCustomerModalVisible}
        isSupplier={false}
        onClose={() => setAddCustomerModalVisible(false)}
        onAdded={() => {
          getLedgerCustomers().then((res) => {
            const all = res.data.customers || [];
            setCustomers(all.filter((c: any) => !c.isSupplier));
          });
        }}
      />
    </SafeAreaView>
  );
}

/* ================= SEARCH OVERLAY COMPONENT ================= */
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
  walkInLabel,
  extraTopOption,
}: any) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.searchHeader}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              autoFocus
              placeholder={title}
              placeholderTextColor="#94a3b8"
              value={value}
              onChangeText={onChange}
              style={styles.input}
            />
            <TouchableOpacity onPress={onClose} style={styles.closeBtnIcon}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {extraTopOption}
            {walkInOption && (
              <TouchableOpacity
                onPress={() => onSelect({ _id: "" })}
                style={styles.walkIn}
              >
                <Ionicons name="people-outline" size={18} color="#2563eb" style={{marginRight: 10}} />
                <Text style={styles.walkInText}>{walkInLabel}</Text>
              </TouchableOpacity>
            )}

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  title: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  subtitle: {
    fontSize: 10,
    color: "#2563eb",
    fontWeight: "800",
    letterSpacing: 1,
  },
  searchBtn: {
    marginLeft: "auto",
    backgroundColor: "#eff6ff",
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563eb",
  },
  scanner: { height: "24%", backgroundColor: "#020617" },
  scanHint: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  scanText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  body: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  customerBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  customerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  customerLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  customerText: { fontSize: 13, fontWeight: "700", color: '#1e293b' },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 14, fontWeight: "700", color: '#94a3b8' },
  summary: {
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    padding: 16,
    backgroundColor: '#fff'
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-start",
    paddingTop: 60,
  },
  sheet: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    maxHeight: "80%",
    elevation: 10,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  closeBtnIcon: { padding: 4 },
  input: { flex: 1, fontSize: 15, color: '#1e293b', fontWeight: '600' },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f8fafc",
  },
  itemTitle: { fontWeight: "700", fontSize: 14, color: '#1e293b' },
  itemSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: { fontWeight: "800", color: "#2563eb", fontSize: 15 },
  walkIn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  walkInText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
  },
  addNewOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    backgroundColor: "#f0f7ff",
    borderBottomWidth: 1,
    borderColor: "#dbeafe",
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
  },
});