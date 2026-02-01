import { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
/* COMPONENTS */
import BillSuccessSheet from "../../components/billing/BillSuccessSheet";
import BarcodeScanner from "../../components/billing/BarcodeScanner";
import BillItemsList from "../../components/billing/BillItemsList";
import BillSummary from "../../components/billing/BillSummary";
import QuickAddProductModal from "../../components/inventory/QuickAddProductModal";
import AddCustomerModal from "../../components/ledger/AddCustomerModal";
import AddProductModal from "../../components/inventory/AddProductModal";
import ProductSearchOverlay from "../../components/billing/ProductSearchOverlay";
/* HOOKS & API */
import { useBilling } from "../../hooks/useBilling";
import { getProducts } from "../../constants/inventory.api";
import { getLedgerCustomers } from "../../constants/ledger.api";
import { getBillById } from "../../constants/bills.api";
import { printBill } from "../../utils/thermalPrinter";
import { isThermalPrinterSaved } from "../../utils/printerManager";
import { BluetoothEscposPrinter } from "@vardrz/react-native-bluetooth-escpos-printer";
import { formatRupee } from "../../utils/formatCurrency";
/* LANGUAGE */
import { LANGUAGE_TEXT_BILLING } from "../../constants/language_billing";
import { LANGUAGE_TEXT_VIEW_BILL } from "../../constants/language_viewBill";
import { useLanguage } from "../../providers/LanguageProvider";

interface BillTab {
  id: string;
  items: any[];
  customerId: string;
  customerName: string;
  displayName?: string;
}

export default function BillingPage() {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_BILLING[language] || LANGUAGE_TEXT_BILLING.en;
  const tv = LANGUAGE_TEXT_VIEW_BILL[language] || LANGUAGE_TEXT_VIEW_BILL.en;
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  /* ---------------- PARALLEL BILLING STATE ---------------- */
  const [tabs, setTabs] = useState<BillTab[]>([
    { id: "tab-1", items: [], customerId: "", customerName: "", displayName: "Bill 1" },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab-1");
  const [lastCreatedBillId, setLastCreatedBillId] = useState<string | null>(null);

  // Payment Confirmation Modal State
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Snapshot states to show in the Mini-Bill Modal after reset
  const [checkoutSnapshot, setCheckoutSnapshot] = useState<{ items: any[], total: number }>({
    items: [],
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

  const checkPrinterStatus = useCallback(async () => {
    setCheckingPrinter(true);
    try {
      const hasSaved = await isThermalPrinterSaved();
      if (!hasSaved) {
        setIsPrinterConnected(false);
        return;
      }
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      setIsPrinterConnected(true);
    } catch {
      setIsPrinterConnected(false);
    } finally {
      setCheckingPrinter(false);
    }
  }, []);

  const onConfirmPayment = async (mode: string) => {
    setIsProcessingCheckout(true);
    try {
      setCheckoutSnapshot({
        items: [...items],
        total: totalAmount
      });
      
      // We pass the mode to the checkout hook/api
      const res = await checkout(activeTab.customerId || null, mode);
      
      if (res?.bill?._id) {
        setLastCreatedBillId(res.bill._id);
        resetBill();
        setTabs((prev) =>
          prev.map((tab) =>
            tab.id === activeTabId ? { ...tab, items: [] } : tab
          )
        );
        setIsPaymentModalVisible(false);
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
    setIsPaymentModalVisible(true);
  };

  const handlePrintPress = () => {
    if (!lastCreatedBillId) return;
    if (isPrinterConnected) {
      getBillById(lastCreatedBillId)
        .then((res) => {
          if (res.data?.bill) printBill(res.data.bill);
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

      {/* TABS BAR */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab, index) => {
            const isActive = activeTabId === tab.id;
            const isEditing = editingTabId === tab.id;

            return (
              <View
                key={tab.id}
                style={[
                  styles.tabWrapper,
                  isActive && styles.activeTabWrapper,
                ]}
              >
                {isEditing ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={editTabNameValue}
                      onChangeText={setEditTabNameValue}
                      autoFocus
                      selectTextOnFocus
                      onBlur={saveTabName}
                      onSubmitEditing={saveTabName}
                      returnKeyType="done"
                      maxLength={24}
                    />
                    <TouchableOpacity onPress={cancelEditTabName} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                      <Ionicons name="close" size={18} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.tabContent}
                    onPress={() => setActiveTabId(tab.id)}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        isActive && styles.activeTabText,
                      ]}
                      numberOfLines={1}
                    >
                      {tab.displayName || tab.customerName || `Bill ${index + 1}`}
                    </Text>

                    {isActive && (
                      <TouchableOpacity
                        onPress={() => startEditingTabName(tab)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        style={styles.pencilButton}
                      >
                        <Feather name="edit-2" size={14} color={isActive ? "#ffffff" : "#64748b"} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                )}

                {tabs.length > 1 && !isEditing && (
                  <TouchableOpacity
                    onPress={() => closeTab(tab.id)}
                    style={styles.closeTabIcon}
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={isActive ? "#fff" : "#cbd5e1"}
                    />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <TouchableOpacity onPress={addNewTab} style={styles.addTabBtn}>
            <Ionicons name="add" size={20} color="#2563eb" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* SCANNER */}
      <View style={styles.scannerContainer}>
        {isFocused ? (
          <BarcodeScanner onScan={handleScan} style={StyleSheet.absoluteFillObject} />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000" }]} />
        )}
        <View style={styles.overlay}>
          <View style={styles.maskTop} />
          <View style={styles.maskRow}>
            <View style={styles.maskSide} />
            <View style={styles.scanFrame} />
            <View style={styles.maskSide} />
          </View>
          <View style={[styles.maskTop, { flex: 1 }]} />
        </View>
      </View>

      {/* BODY */}
      <View style={styles.body}>
        <TouchableOpacity
          style={styles.customerBox}
          onPress={() => setCustomerOpen(true)}
        >
          <View style={styles.customerIconWrap}>
            <Ionicons name="person" size={16} color="#475569" />
          </View>
          <View>
            <Text style={styles.customerLabel}>{t.customer}</Text>
            <Text style={styles.customerText}>{selectedCustomerName}</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#94a3b8" style={{ marginLeft: "auto" }} />
        </TouchableOpacity>

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

      {/* PAYMENT MODE CONFIRMATION MODAL */}
      <Modal 
        visible={isPaymentModalVisible} 
        transparent 
        animationType="fade"
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmHeader}>
              <Text style={styles.confirmTitle}>Confirm Payment</Text>
              <TouchableOpacity onPress={() => setIsPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.confirmAmountBox}>
              <Text style={styles.confirmAmountLabel}>Total Amount to Collect</Text>
              <Text style={styles.confirmAmountValue}>{formatRupee(totalAmount)}</Text>
            </View>

            <Text style={styles.paymentMethodLabel}>Select Payment Mode</Text>
            
            <View style={styles.paymentOptionsRow}>
              <TouchableOpacity 
                style={styles.paymentMethodBtn} 
                onPress={() => onConfirmPayment("CASH")}
                disabled={isProcessingCheckout}
              >
                <View style={[styles.paymentIconCircle, { backgroundColor: '#f0fdf4' }]}>
                  <MaterialCommunityIcons name="cash" size={24} color="#16a34a" />
                </View>
                <Text style={styles.paymentMethodText}>CASH</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.paymentMethodBtn}
                onPress={() => onConfirmPayment("UPI")}
                disabled={isProcessingCheckout}
              >
                <View style={[styles.paymentIconCircle, { backgroundColor: '#eff6ff' }]}>
                  <MaterialCommunityIcons name="qrcode-scan" size={22} color="#2563eb" />
                </View>
                <Text style={styles.paymentMethodText}>UPI</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.paymentMethodBtn}
                onPress={() => onConfirmPayment("OTHERS")}
                disabled={isProcessingCheckout}
              >
                <View style={[styles.paymentIconCircle, { backgroundColor: '#f8fafc' }]}>
                  <MaterialCommunityIcons name="dots-horizontal" size={24} color="#64748b" />
                </View>
                <Text style={styles.paymentMethodText}>OTHERS</Text>
              </TouchableOpacity>
            </View>

            {isProcessingCheckout && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.processingText}>Processing Bill...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ENHANCED SUCCESS SHEET (Mini-Bill) */}
      <BillSuccessSheet
        visible={!!lastCreatedBillId}
        billId={lastCreatedBillId}
        items={checkoutSnapshot.items}
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
  walkInLabel,
  extraTopOption,
}: any) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlayModal}>
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
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {extraTopOption}
            {walkInOption && (
              <TouchableOpacity
                onPress={() => onSelect({ _id: "", name: "Walk-in" })}
                style={styles.walkIn}
              >
                <Ionicons name="people-outline" size={18} color="#2563eb" style={{ marginRight: 10 }} />
                <Text style={styles.walkInText}>{walkInLabel}</Text>
              </TouchableOpacity>
            )}
            {items.map((item: any) => (
              <TouchableOpacity
                key={item._id || item.id || Math.random()}
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
  },
  customerLabel: { fontSize: 9, fontWeight: "700", color: "#94a3b8" },
  customerText: { fontSize: 13, fontWeight: "700", color: "#1e293b" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 14, fontWeight: "700", color: "#94a3b8" },

  summary: { borderTopWidth: 1, borderColor: "#f1f5f9", padding: 16 },

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

  // Confirmation Modal Styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  confirmBox: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  confirmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  confirmAmountBox: {
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  confirmAmountLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
  },
  confirmAmountValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
  },
  paymentMethodLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 16,
    textAlign: "center",
  },
  paymentOptionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  paymentMethodBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#f1f5f9",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1e293b",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
  }
});