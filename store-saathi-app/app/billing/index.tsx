import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
  Dimensions,
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

const { width } = Dimensions.get("window");
const PRIMARY_BLUE = "#1e3a8a"; // Deep professional blue

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
          unit: product.unit || "unit",
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
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.subtitle}>{t.terminalActive}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => setProductOpen(true)}
        >
          <Ionicons name="search" size={16} color={PRIMARY_BLUE} />
          <Text style={styles.searchBtnText}>{t.searchProduct}</Text>
        </TouchableOpacity>
      </View>

      {/* SCANNER CONTAINER */}
      <View style={styles.scannerContainer}>
        <BarcodeScanner onScan={handleScan} />
        <View style={styles.scanHintOverlay}>
          <Ionicons name="scan-outline" size={14} color="#fff" />
          <Text style={styles.scanText}>{t.alignBarcode}</Text>
        </View>
      </View>

      {/* BODY SECTION */}
      <View style={styles.body}>
        {/* CUSTOMER SELECTOR */}
        <TouchableOpacity
          style={styles.customerCard}
          onPress={() => setCustomerOpen(true)}
        >
          <View style={styles.customerInfo}>
            <View style={styles.customerIconCircle}>
              <Ionicons name="person" size={18} color={PRIMARY_BLUE} />
            </View>
            <View>
              <Text style={styles.customerLabel}>{t.customer}</Text>
              <Text style={styles.customerName}>{selectedCustomer}</Text>
            </View>
          </View>
          <Ionicons name="chevron-down" size={20} color="#94a3b8" />
        </TouchableOpacity>

        {/* ITEMS LIST AREA */}
        <View style={{ flex: 1 }}>
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIllustration}>
                <Ionicons name="cart-outline" size={48} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyText}>{t.scannerReady}</Text>
              <Text style={styles.emptySubText}>Scan items or use search to begin</Text>
            </View>
          ) : (
            <BillItemsList items={items} setItems={setItems} />
          )}
        </View>

        {/* BILL SUMMARY BOX */}
        <View style={styles.summaryWrapper}>
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

      {/* MODALS & OVERLAYS */}
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
          <View style={styles.itemRow}>
            <View>
              <Text style={styles.itemTitleText}>{c.name}</Text>
              <Text style={styles.itemSubText}>{c.mobileNumber || t.noPhone}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
          </View>
        )}
        extraTopOption={
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              setCustomerOpen(false);
              setAddCustomerModalVisible(true);
            }}
          >
            <View style={[styles.miniIcon, { backgroundColor: '#e0e7ff' }]}>
              <Ionicons name="person-add" size={16} color={PRIMARY_BLUE} />
            </View>
            <Text style={[styles.actionText, { color: PRIMARY_BLUE }]}>{t.addNewCustomer}</Text>
          </TouchableOpacity>
        }
      />

      <SearchOverlay
        visible={productOpen}
        title={t.searchProduct}
        value={productSearch}
        onChange={setProductSearch}
        onClose={() => setProductOpen(false)}
        items={filteredProducts}
        onSelect={addProductToBill}
        renderItem={(p: any) => (
          <View style={styles.productFlexRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitleText}>{p.name}</Text>
              <Text style={styles.itemSubText}>{p.barcode || 'No Barcode'}</Text>
            </View>
            <Text style={styles.productPriceText}>₹{p.price.sellingPrice}</Text>
          </View>
        )}
      />

      {productNotFound && lastScannedBarcode && (
        <QuickAddProductModal
          visible={productNotFound}
          barcode={lastScannedBarcode}
          onClose={() => setProductNotFound(false)}
          onSuccess={(newProduct) => addProductToBill(newProduct)}
        />
      )}

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

/* ================= COMPONENT: SEARCH OVERLAY ================= */
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
    <Modal transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Ionicons name="search" size={20} color={PRIMARY_BLUE} />
            <TextInput
              autoFocus
              placeholder={title}
              placeholderTextColor="#94a3b8"
              value={value}
              onChangeText={onChange}
              style={styles.modalInput}
            />
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close-circle" size={24} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {extraTopOption}
            
            {walkInOption && (
              <TouchableOpacity
                onPress={() => onSelect({ _id: "" })}
                style={styles.walkInRow}
              >
                <View style={[styles.miniIcon, { backgroundColor: '#f1f5f9' }]}>
                  <Ionicons name="people" size={16} color="#64748b" />
                </View>
                <Text style={styles.walkInTitle}>{walkInLabel}</Text>
              </TouchableOpacity>
            )}

            {items.map((item: any, idx: number) => (
              <TouchableOpacity
                key={item._id || idx}
                onPress={() => onSelect(item)}
                style={styles.listItemRow}
              >
                {renderItem(item)}
              </TouchableOpacity>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  
  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  backBtn: { paddingRight: 16 },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 },
  subtitle: {
    fontSize: 11,
    color: PRIMARY_BLUE,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  searchBtn: {
    marginLeft: "auto",
    backgroundColor: "#f0f4ff",
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  searchBtnText: { fontSize: 12, fontWeight: "700", color: PRIMARY_BLUE },

  /* Scanner */
  scannerContainer: { height: "22%", backgroundColor: "#000", overflow: 'hidden' },
  scanHintOverlay: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  scanText: { fontSize: 11, color: "#fff", fontWeight: "600" },

  /* Body */
  body: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -24,
    paddingTop: 8,
  },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  customerInfo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  customerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
  },
  customerLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  customerName: { fontSize: 15, fontWeight: "700", color: '#1e293b' },

  /* Empty State */
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 60 },
  emptyIllustration: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: { fontSize: 16, fontWeight: "700", color: '#475569' },
  emptySubText: { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  /* Summary */
  summaryWrapper: {
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    padding: 20,
    backgroundColor: '#fff',
  },

  /* Modal Search */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "85%",
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  modalInput: { flex: 1, fontSize: 16, color: '#1e293b', fontWeight: '600' },
  modalCloseBtn: { padding: 4 },
  
  listItemRow: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#f8fafc",
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitleText: { fontWeight: "700", fontSize: 15, color: '#1e293b' },
  itemSubText: { fontSize: 13, color: "#64748b", marginTop: 3 },
  
  productFlexRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productPriceText: { fontWeight: "800", color: PRIMARY_BLUE, fontSize: 16 },

  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 14,
    backgroundColor: "#f0f7ff",
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: 15, fontWeight: "700" },

  walkInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    gap: 14,
  },
  walkInTitle: { fontSize: 15, fontWeight: "700", color: '#475569' },
});