import { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";

/* COMPONENTS */
import BillSuccessSheet from "../../components/billing/BillSuccessSheet";
import BillItemsList from "../../components/billing/BillItemsList";
import BillSummary from "../../components/billing/BillSummary";
import QuickAddProductModal from "../../components/inventory/QuickAddProductModal";
import AddCustomerModal from "../../components/ledger/AddCustomerModal";
import AddProductModal from "../../components/inventory/AddProductModal";
import ProductSearchOverlay from "../../components/billing/ProductSearchOverlay";
import BillingHeader from "../../components/billing/BillingHeader";
import BillingTabBar, { BillTab } from "../../components/billing/BillingTabBar";
import CustomerSelector from "../../components/billing/CustomerSelector";
import ProductsGrid from "../../components/billing/ProductsGrid";
import BarcodeScannerModal from "../../components/billing/BarcodeScannerModal";
import BillConfirmationModal from "../../components/billing/BillConfirmationModal";
import SearchOverlay from "../../components/billing/SearchOverlay";

/* HOOKS & API */
import { useBilling } from "../../hooks/useBilling";
import { getProducts } from "../../constants/inventory.api";
import { getLedgerCustomers } from "../../constants/ledger.api";
import { getBillById } from "../../constants/bills.api";
import { printBillAuto } from "../../utils/thermalPrinter";
import { isThermalPrinterSaved } from "../../utils/printerManager";

/* LANGUAGE */
import { LANGUAGE_TEXT_BILLING } from "../../constants/language_billing";
import { LANGUAGE_TEXT_VIEW_BILL } from "../../constants/language_viewBill";
import { useLanguage } from "../../providers/LanguageProvider";

export default function BillingPage() {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_BILLING[language] || LANGUAGE_TEXT_BILLING.en;
  const tv = LANGUAGE_TEXT_VIEW_BILL[language] || LANGUAGE_TEXT_VIEW_BILL.en;
  const isFocused = useIsFocused();

  /* ---------------- PARALLEL BILLING STATE ---------------- */
  const [tabs, setTabs] = useState<BillTab[]>([
    { id: "tab-1", items: [], customerId: "", customerName: "", displayName: "Bill 1" },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [lastCreatedBillId, setLastCreatedBillId] = useState<string | null>(null);

  // Combined Bill Confirmation & Payment Modal State
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<"CASH" | "UPI" | "OTHERS" | "NONE" | null>(null);

  // Snapshot states to show in the Mini-Bill Modal after reset
  const [checkoutSnapshot, setCheckoutSnapshot] = useState<{ items: any[], subTotal: number, discount: number, tax: number, total: number }>({
    items: [],
    subTotal: 0,
    discount: 0,
    tax: 0,
    total: 0
  });

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [tabs, activeTabId]
  );

  /* ---------------- BILLING HOOK ---------------- */
  const {
    items,
    setItems,
    handleScan,
    subTotal,
    discount,
    setDiscount,
    taxPercentage,
    setTaxPercentage,
    paidAmount,
    setPaidAmount,
    totalAmount,
    checkout,
    productNotFound,
    setProductNotFound,
    lastScannedBarcode,
    resetBill,
    addItemByProduct
  } = useBilling();

  useEffect(() => {
    setItems(activeTab.items ?? []);
    setDiscount(0);
    setTaxPercentage(0);
    setPaidAmount(0);
  }, [activeTabId, setItems, setDiscount, setTaxPercentage, setPaidAmount]);

  useEffect(() => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId ? { ...tab, items: [...items] } : tab
      )
    );
  }, [items, activeTabId]);

  /* ---------------- CUSTOMER & PRODUCT DATA ---------------- */
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [addCustomerModalVisible, setAddCustomerModalVisible] = useState(false);

  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productOpen, setProductOpen] = useState(false);
  const [addProductModalVisible, setAddProductModalVisible] = useState(false);

  const fetchInitialData = useCallback(() => {
    getLedgerCustomers()
      .then((res) => {
        const all = res.data.customers || [];
        setCustomers(all.filter((c: any) => !c.isSupplier));
      })
      .catch(() => {});
    getProducts()
      .then((res) => setProducts(res.data.products || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  /* ---------------- TAB MANAGEMENT ---------------- */
  const addNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const tabNumber = tabs.length + 1;
    setTabs((prev) => [
      ...prev,
      { 
        id: newId, 
        items: [], 
        customerId: "", 
        customerName: "",
        displayName: `Bill ${tabNumber}`
      },
    ]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) {
      const newId = `tab-${Date.now()}`;
      setTabs([{ 
        id: newId, 
        items: [], 
        customerId: "", 
        customerName: "",
        displayName: "Bill 1" 
      }]);
      setActiveTabId(newId);
      setItems([]);
      return;
    }

    const filtered = tabs.filter((t) => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      const nextTab = filtered[0] ?? { 
        id: "tab-1", 
        items: [], 
        customerId: "", 
        customerName: "",
        displayName: "Bill 1" 
      };
      setActiveTabId(nextTab.id);
    }
  };

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTabNameValue, setEditTabNameValue] = useState("");

  const startEditingTabName = (tab: BillTab) => {
    setEditingTabId(tab.id);
    setEditTabNameValue(tab.displayName || tab.customerName || `Bill ${tabs.indexOf(tab) + 1}`);
  };

  const saveTabName = () => {
    if (!editingTabId || !editTabNameValue.trim()) {
      setEditingTabId(null);
      return;
    }

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === editingTabId
          ? { ...tab, displayName: editTabNameValue.trim() }
          : tab
      )
    );
    setEditingTabId(null);
    setEditTabNameValue("");
  };

  const cancelEditTabName = () => {
    setEditingTabId(null);
    setEditTabNameValue("");
  };

  /* ---------------- BILLING ACTIONS ---------------- */
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
          productId,
          name: product.name,
          price: product.price?.sellingPrice || product.sellingPrice || 0,
          unit: product.unit || "unit",
          quantity: 1,
        },
      ];
    });
    setProductOpen(false);
    setProductSearch("");
  };

  const productsMap = useMemo(() => {
    const map: Record<string, any> = {};
    products.forEach((p) => {
      map[p._id] = p;
    });
    return map;
  }, [products]);

  const [isPrinterConnected, setIsPrinterConnected] = useState(false);
  const [checkingPrinter, setCheckingPrinter] = useState(false);
  
  // New state for barcode scanner modal
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  
  // New state for bill confirmation modal
  const [showBillConfirmation, setShowBillConfirmation] = useState(false);

  const checkPrinterStatus = useCallback(async () => {
    setCheckingPrinter(true);
    try {
      const hasSaved = await isThermalPrinterSaved();
      if (!hasSaved) {
        setIsPrinterConnected(false);
        return;
      }
      setIsPrinterConnected(true);
    } catch {
      setIsPrinterConnected(false);
    } finally {
      setCheckingPrinter(false);
    }
  }, []);

  const onConfirmPayment = async () => {
    if (!selectedPaymentMode) {
      Alert.alert("Error", "Please select a payment mode");
      return;
    }
    
    setIsProcessingCheckout(true);
    try {
      const taxAmount = (subTotal * taxPercentage) / 100;
      setCheckoutSnapshot({
        items: [...items],
        subTotal: subTotal,
        discount: discount,
        tax: taxAmount,
        total: totalAmount
      });
      
      // We pass the mode to the checkout hook/api
      const res = await checkout(activeTab.customerId || null, selectedPaymentMode);
      
      if (res?.bill?._id) {
        setLastCreatedBillId(res.bill._id);
        resetBill();
        setTabs((prev) =>
          prev.map((tab) =>
            tab.id === activeTabId ? { ...tab, items: [] } : tab
          )
        );
        setShowBillConfirmation(false);
        setSelectedPaymentMode("CASH");
        await checkPrinterStatus();
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Checkout failed. Please check network.");
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleCheckout = () => {
    if (!items.length) return;
    setShowBillConfirmation(true);
    setSelectedPaymentMode("CASH");
  };
  
  const handleCloseBillConfirmation = () => {
    setShowBillConfirmation(false);
    setSelectedPaymentMode("CASH");
  };

  const handlePrintPress = () => {
    if (!lastCreatedBillId) return;
    if (isPrinterConnected) {
      getBillById(lastCreatedBillId)
        .then((res) => {
          if (res.data?.bill) printBillAuto(res.data.bill);
        })
        .catch(() => Alert.alert("Error", "Could not load bill for printing"));
    } else {
      router.push("/PrintTest");
    }
  };

  const handleNextCustomer = () => {
    setLastCreatedBillId(null);
  };

  const selectedCustomerName = activeTab.customerName || t.walkInCustomer;

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.mobileNumber?.includes(customerSearch)
    );
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    // FIXED: Removed .slice(0, 40) to show the full inventory.
    // The ProductSearchOverlay component is now optimized with FlatList performance props.
    if (!productSearch) return products; 
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.barcode?.includes(productSearch) ||
        p.category?.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* HEADER */}
      <BillingHeader
        title={t.title}
        subtitle={t.terminalActive}
        onScanPress={() => setShowBarcodeScanner(true)}
      />

      {/* TABS BAR */}
      <BillingTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        editingTabId={editingTabId}
        editTabNameValue={editTabNameValue}
        onTabSelect={setActiveTabId}
        onAddTab={addNewTab}
        onCloseTab={closeTab}
        onStartEditingTabName={startEditingTabName}
        onSaveTabName={saveTabName}
        onCancelEditTabName={cancelEditTabName}
        onEditTabNameChange={setEditTabNameValue}
      />

      {/* CUSTOMER SELECTION */}
      <CustomerSelector
        customerName={selectedCustomerName}
        customerLabel={t.customer}
        onPress={() => setCustomerOpen(true)}
      />

      {/* PRODUCTS GRID */}
      <ProductsGrid
        products={products}
        onProductPress={addProductToBill}
        onSearchPress={() => setProductOpen(true)}
        onAddProductPress={() => setAddProductModalVisible(true)}
      />

      {/* BODY - SELECTED ITEMS */}
      <View style={styles.body}>
        <View style={styles.selectedItemsHeader}>
          <Text style={styles.selectedItemsTitle}>
             Seleted Items({items.length})
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          {items.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconBg}>
                <Ionicons name="cart-outline" size={40} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyText}>No items selected</Text>
              <Text style={styles.emptySubText}>Tap on products above to add them</Text>
            </View>
          ) : (
            <BillItemsList items={items} setItems={setItems} />
          )}
        </View>

        <View style={styles.summary}>
          <BillSummary
            subTotal={subTotal}
            discount={discount}
            setDiscount={setDiscount}
            taxPercentage={taxPercentage}
            setTaxPercentage={setTaxPercentage}
            paidAmount={paidAmount}
            setPaidAmount={setPaidAmount}
            totalAmount={totalAmount}
            onCheckout={handleCheckout}
            disabled={!items.length}
          />
        </View>
      </View>

      {/* BARCODE SCANNER MODAL */}
      <BarcodeScannerModal
        visible={showBarcodeScanner}
        isFocused={isFocused}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleScan}
      />

      {/* COMBINED BILL CONFIRMATION & PAYMENT MODAL */}
      <BillConfirmationModal
        visible={showBillConfirmation}
        items={items}
        customerName={selectedCustomerName}
        subTotal={subTotal}
        discount={discount}
        taxPercentage={taxPercentage}
        totalAmount={totalAmount}
        selectedPaymentMode={selectedPaymentMode}
        isProcessing={isProcessingCheckout}
        onClose={handleCloseBillConfirmation}
        onPaymentModeSelect={setSelectedPaymentMode}
        onConfirm={onConfirmPayment}
      />

      {/* ENHANCED SUCCESS SHEET (Mini-Bill) */}
      <BillSuccessSheet
        visible={!!lastCreatedBillId}
        billId={lastCreatedBillId}
        itemCount={checkoutSnapshot.items.length}
        subtotal={checkoutSnapshot.subTotal}
        discount={checkoutSnapshot.discount}
        tax={checkoutSnapshot.tax}
        totalAmount={checkoutSnapshot.total}
        onClose={() => setLastCreatedBillId(null)}
        isPrinterConnected={isPrinterConnected}
        checkingPrinter={checkingPrinter}
        onPrint={handlePrintPress}
        onNextCustomer={handleNextCustomer}
        labels={{
          paymentReceived: tv.paymentReceived,
          print: tv.print,
          setupPrint: "Setup & Print",
          nextCustomer: "Next Customer",
          itemsBought: "Mini Digital Receipt",
          total: "Grand Total"
        }}
      />

      {/* SEARCH OVERLAYS & MODALS */}
      <SearchOverlay
        visible={customerOpen}
        title={t.searchCustomer}
        value={customerSearch}
        onChange={setCustomerSearch}
        onClose={() => setCustomerOpen(false)}
        items={filteredCustomers}
        onSelect={(c: any) => {
          setTabs((prev) =>
            prev.map((t) =>
              t.id === activeTabId
                ? { ...t, customerId: c._id || "", customerName: c.name || "" }
                : t
            )
          );
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

      <ProductSearchOverlay
        visible={productOpen}
        title={t.searchProduct}
        value={productSearch}
        onChange={setProductSearch}
        onClose={() => setProductOpen(false)}
        items={filteredProducts}
        onAddMultiple={(selectedProducts) => {
          selectedProducts.forEach((p) => {
            const product = productsMap[p.productId];
            const variant = p.variantId
              ? product.variants.find((v: any) => (v._id || v.id) === p.variantId)
              : null;
            addItemByProduct(product, variant);
          });
        }}
        extraTopOption={
          <TouchableOpacity
            style={styles.addNewOption}
            onPress={() => {
              setProductOpen(false);
              setAddProductModalVisible(true);
            }}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={18} color="#2563eb" />
            </View>
            <Text style={styles.addNewText}>Add New Product</Text>
          </TouchableOpacity>
        }
      />

      {productNotFound && lastScannedBarcode && (
        <QuickAddProductModal
          visible={productNotFound}
          barcode={lastScannedBarcode}
          onClose={() => setProductNotFound(false)}
          onSuccess={(newProduct) => {
            addProductToBill(newProduct);
            fetchInitialData();
          }}
        />
      )}

      <AddProductModal
        visible={addProductModalVisible}
        onClose={() => setAddProductModalVisible(false)}
        onAdded={() => {
          getProducts().then((res) => {
            const updatedProducts = res.data.products || [];
            setProducts(updatedProducts);
            if (updatedProducts.length > 0) {
              const latestProduct = updatedProducts[0];
              addProductToBill(latestProduct);
            }
          });
        }}
      />

      <AddCustomerModal
        visible={addCustomerModalVisible}
        isSupplier={false}
        onClose={() => setAddCustomerModalVisible(false)}
        onAdded={fetchInitialData}
      />
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 100,
    paddingBottom: 15,
    marginTop:-100,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    gap: 12,
    zIndex:100,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: "800", color: "#0f172a" },
  subtitle: { fontSize: 10, color: "#2563eb", fontWeight: "800" },
  searchBtn: {
    marginLeft: "auto",
    backgroundColor: "#eff6ff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchBtnText: { fontSize: 11, fontWeight: "700", color: "#2563eb" },
  
  scannerToggleBtn: {
    marginLeft: "auto",
    backgroundColor: "#eff6ff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  tabBar: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: "#f1f5f9",zIndex:100},

  tabWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 8,
    minWidth: 100,
    maxWidth: 180,
  },
  activeTabWrapper: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    maxWidth: 120,
  },
  activeTabText: { color: "#fff" },
  pencilButton: {
    marginLeft: 6,
    padding: 2,
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  editInput: {
    minWidth: 80,
    maxWidth: 140,
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    padding: 0,
  },

  closeTabIcon: { marginLeft: 4 },
  addTabBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },

  scannerContainer: { height: "22%", backgroundColor: "transparent" },
  overlay: { ...StyleSheet.absoluteFillObject },
  maskTop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  maskRow: { flexDirection: "row", height: 120 },
  maskSide: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  scanFrame: { width: 260, height: 120 },

  body: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
  },

  customerBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  customerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  customerLabel: { fontSize: 9, fontWeight: "700", color: "#94a3b8" },
  customerText: { fontSize: 13, fontWeight: "700", color: "#1e293b" },

  productsSection: {
    maxHeight: '35%',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  productsSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  searchProductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  searchProductBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  productsGrid: {
    flex: 1,
  },
  productsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
  },
  productCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    position: 'relative',
    minHeight: 100,
  },
  productCardContent: {
    flex: 1,
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    minHeight: 32,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  addIconBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyProducts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyProductsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 12,
    marginBottom: 16,
  },
  addProductBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addProductBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  selectedItemsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  selectedItemsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 20 },
  emptyIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 14, fontWeight: "700", color: "#94a3b8", marginTop: 12 },
  emptySubText: { fontSize: 12, color: "#cbd5e1", marginTop: 4 },

  summary: { borderTopWidth: 1, borderColor: "#f1f5f9", padding: 16 },

  // Modal Overlay
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  confirmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },

  // Barcode Scanner Modal
  scannerModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  scannerModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  scannerInstructions: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannerInstructionsText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },

  // Combined Bill Confirmation & Payment Modal
  combinedBillBox: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 28,
    maxHeight: '88%',
    width: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 15,
  },
  billConfirmItems: {
    maxHeight: 500,
  },
  billConfirmScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  
  // Customer Info Card
  customerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  customerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  customerInfoText: {
    flex: 1,
  },
  billConfirmLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  billConfirmValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  
  // Items Section
  itemsSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  billConfirmItemsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  billConfirmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  billConfirmItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  billConfirmItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    lineHeight: 18,
  },
  billConfirmItemQty: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  billConfirmItemTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2563eb',
  },
  
  // Bill Summary Card
  billSummaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  billConfirmSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billConfirmSummaryLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  billConfirmSummaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 12,
  },
  billConfirmTotal: {
    marginTop: 4,
    marginBottom: 0,
  },
  billConfirmTotalLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  billConfirmTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2563eb',
  },
  
  // Payment Mode Selection Section
  paymentModeSection: {
    marginBottom: 8,
  },
  paymentModeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  paymentModesGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  paymentModeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
    minHeight: 130,
    justifyContent: 'center',
  },
  paymentModeCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentModeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  paymentModeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  paymentModeTextSelected: {
    color: '#2563eb',
    fontWeight: '800',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  
  // Action Buttons
  billConfirmActions: {
    flexDirection: 'row',
    padding: 24,
    gap: 14,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#fafbfc',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  billConfirmEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 8,
  },
  billConfirmEditText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  billConfirmPrintBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  billConfirmPrintBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  billConfirmPrintText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  confirmSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },

  overlayModal: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", paddingTop: 60 },
  sheet: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 24, maxHeight: "80%" },

  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  input: { flex: 1, fontSize: 15, color: "#1e293b", fontWeight: "600", marginLeft: 10 },

  listItem: { padding: 16, borderBottomWidth: 1, borderColor: "#f8fafc" },
  itemTitle: { fontWeight: "700", fontSize: 14, color: "#1e293b" },
  itemSub: { fontSize: 12, color: "#64748b" },

  productRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontWeight: "800", color: "#2563eb" },

  walkIn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  walkInText: { fontSize: 14, fontWeight: "700", color: "#2563eb" },

  addNewOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f0f7ff",
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  addNewText: { fontSize: 14, fontWeight: "700", color: "#2563eb", marginLeft: 12 },
});