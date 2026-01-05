import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

/* COMPONENTS */
import InventoryHeader from "../components/inventory/InventoryHeader";
import InventoryRow from "@/components/inventory/InventoryRow";
import AddProductModal from "@/components/inventory/AddProductModal";
import QuickAddProductModal from "@/components/inventory/QuickAddProductModal";
import BarcodeScanner from "@/components/billing/BarcodeScanner";
import PageLoader from "../components/PageLoader";

/* API & HOOKS */
import { useInventory } from "../hooks/useInventory";
import { getProductByBarcode } from "../constants/inventory.api";

/* LANGUAGE */
import { LANGUAGE_TEXT_INVENTORY_PAGE } from "../constants/language_inventory";
import { useLanguage } from "../providers/LanguageProvider";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export default function InventoryPage() {
  const { products, loading, refresh } = useInventory();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_INVENTORY_PAGE[language] || LANGUAGE_TEXT_INVENTORY_PAGE.en;

  /* UI STATES */
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "LOW" | "HIGH" | "OUT" | "EXPIRY">("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  /* ANIMATION STATE FOR TOP MODAL */
  const slideAnim = useRef(new Animated.Value(-SCREEN_HEIGHT)).current;
  const scanningLockedRef = useRef(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [productNotFound, setProductNotFound] = useState(false);

  /* TRIGGER TOP SLIDE ANIMATION */
  useEffect(() => {
    if (productNotFound) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [productNotFound]);

  /* REFRESH */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  /* FILTER LOGIC */
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name?.toLowerCase().includes(q));
    }

    // Expiry thresholds
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(today.getDate() + 15);
    fifteenDaysFromNow.setHours(23, 59, 59, 999);

    switch (filter) {
      case "LOW":
        return list.filter((p) => p.quantity > 0 && p.quantity <= 5);
      case "HIGH":
        return list.filter((p) => p.quantity > 5);
      case "OUT":
        return list.filter((p) => p.quantity === 0);
      case "EXPIRY":
        return list.filter((p) => {
          if (!p.expiryDate) return false;
          const expiry = new Date(p.expiryDate);
          return expiry <= fifteenDaysFromNow;
        });
      default:
        return list;
    }
  }, [products, search, filter]);

  /* BARCODE SCAN HANDLER */
  const handleScan = async (barcode: string) => {
    if (scanningLockedRef.current) return;
    scanningLockedRef.current = true;

    setShowScanner(false);
    setLastScannedBarcode(barcode);

    try {
      const res = await getProductByBarcode(barcode);
      const product = res?.data?.product;

      if (product) {
        Alert.alert(t.notice || "Notice", t.alreadyExists || "This product already exists in inventory.");
        scanningLockedRef.current = false;
      }
    } catch (e: any) {
      if (e?.response?.status === 404) {
        setTimeout(() => {
          setProductNotFound(true);
          scanningLockedRef.current = false;
        }, 300);
      } else {
        scanningLockedRef.current = false;
        console.error("Scan API Error:", e);
      }
    }
  };

  /* SCANNER CONTROLS */
  const openScanner = () => {
    scanningLockedRef.current = false;
    setLastScannedBarcode(null);
    setProductNotFound(false);
    setShowScanner(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
    scanningLockedRef.current = false;
  };

  /* RENDER HELPER FOR DROPDOWN ITEM */
  const FilterOption = ({ type, label, icon }: { type: typeof filter, label: string, icon: string }) => (
    <TouchableOpacity 
      style={[styles.dropdownItem, filter === type && styles.dropdownItemActive]} 
      onPress={() => {
        setFilter(type);
        setShowFilterDropdown(false);
      }}
    >
      <MaterialCommunityIcons 
        name={icon as any} 
        size={22} 
        color={filter === type ? "#1e3a8a" : "#64748b"} 
      />
      <Text style={[styles.dropdownText, filter === type && styles.dropdownTextActive]}>
        {label}
      </Text>
      {filter === type && (
        <Ionicons name="checkmark-circle" size={18} color="#1e3a8a" />
      )}
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return <PageLoader />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        
        {/* HEADER */}
        <InventoryHeader
          onAddProduct={() => setShowAdd(true)}
          onQuickEntry={openScanner}
        />

        {/* SEARCH + FILTER ICON SECTION */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#94a3b8" />
            <TextInput
              placeholder={t.searchPlace}
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
          </View>

          <TouchableOpacity 
            style={[styles.filterIconButton, filter !== "ALL" && styles.filterIconButtonActive]} 
            onPress={() => setShowFilterDropdown(true)}
          >
            <Ionicons 
              name={filter === "ALL" ? "filter-outline" : "filter"} 
              size={22} 
              color={filter !== "ALL" ? "#fff" : "#1e3a8a"} 
            />
            {filter !== "ALL" && <View style={styles.activeFilterDot} />}
          </TouchableOpacity>
        </View>

        {/* FILTER DROPDOWN MODAL */}
        <Modal
          visible={showFilterDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowFilterDropdown(false)}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowFilterDropdown(false)}
          >
            <View style={[styles.dropdownContainer, { top: insets.top + 120 }]}>
              <Text style={styles.dropdownHeader}>Filter Inventory</Text>
              <FilterOption type="ALL" label={t.allItems} icon="layers-outline" />
              <FilterOption type="LOW" label={t.lowStock} icon="trending-down" />
              <FilterOption type="OUT" label={t.outOfStock} icon="alert-circle-outline" />
              <FilterOption type="EXPIRY" label="Near Expiry" icon="calendar-clock" />
            </View>
          </Pressable>
        </Modal>

        {/* BARCODE SCANNER SECTION */}
        {showScanner && (
          <View style={styles.scannerWrapper}>
            <BarcodeScanner onScan={handleScan} onClose={closeScanner} />
            <View style={styles.scanHint}>
              <Ionicons name="scan" size={14} color="#fff" />
              <Text style={styles.scanText}>Align barcode within frame</Text>
            </View>
          </View>
        )}

        {/* INVENTORY LIST */}
        <View
          style={[
            styles.listContainer,
            (showScanner || productNotFound || showFilterDropdown) && styles.listDimmed,
          ]}
        >
          {/* Active Filter Badge indicator */}
          {filter !== "ALL" && (
             <View style={styles.activeFilterIndicator}>
                <Text style={styles.activeFilterLabel}>
                  Showing: <Text style={{fontWeight: '800'}}>{filter === "EXPIRY" ? "Near Expiry" : filter}</Text>
                </Text>
                <TouchableOpacity onPress={() => setFilter("ALL")}>
                   <Ionicons name="close-circle" size={16} color="#1e3a8a" />
                </TouchableOpacity>
             </View>
          )}

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 100 },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#1e3a8a"]}
                tintColor="#1e3a8a"
              />
            }
            renderItem={({ item }) => (
              <InventoryRow product={item} onRefresh={refresh} />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBg}>
                  <Ionicons name="cube-outline" size={40} color="#94a3b8" />
                </View>
                <Text style={styles.emptyText}>{t.noProducts}</Text>
                <Text style={styles.emptySubText}>{t.noProductsSub}</Text>
              </View>
            }
          />
        </View>

        {/* FULL SCREEN OVERLAY FOR TOP MODAL */}
        {productNotFound && (
          <TouchableOpacity
            activeOpacity={1}
            style={styles.fullScreenOverlay}
            onPress={() => setProductNotFound(false)}
          />
        )}

        {/* QUICK ADD MODAL - SLIDING FROM TOP */}
        <Animated.View
          style={[
            styles.topModalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={[styles.topModalContent, { paddingTop: insets.top }]}>
            <QuickAddProductModal
              visible={productNotFound}
              barcode={lastScannedBarcode || ""}
              onClose={() => {
                setProductNotFound(false);
                setLastScannedBarcode(null);
              }}
              onSuccess={() => {
                setProductNotFound(false);
                setLastScannedBarcode(null);
                refresh();
              }}
            />
            <View style={styles.modalHandle} />
          </View>
        </Animated.View>

        {/* STANDARD MODAL */}
        <AddProductModal
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            refresh(true);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 12,
    zIndex: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },
  filterIconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterIconButtonActive: {
    backgroundColor: "#1e3a8a",
    borderColor: "#1e3a8a",
  },
  activeFilterDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: "#1e3a8a",
  },

  /* DROPDOWN MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  dropdownContainer: {
    position: "absolute",
    right: 16,
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  dropdownHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94a3b8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 12,
  },
  dropdownItemActive: {
    backgroundColor: "#F1F5F9",
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  dropdownTextActive: {
    color: "#1e3a8a",
    fontWeight: "700",
  },

  /* ACTIVE FILTER INDICATOR */
  activeFilterIndicator: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: 'flex-start',
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  activeFilterLabel: {
    fontSize: 12,
    color: "#1e3a8a",
    fontWeight: "600",
  },

  /* SCANNER */
  scannerWrapper: {
    height: 220,
    backgroundColor: "#020617",
    zIndex: 20,
  },
  scanHint: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  scanText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  /* TOP MODAL STYLES */
  topModalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  topModalContent: {
    width: "100%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10,
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9998,
  },

  /* OVERLAYS & LIST */
  listContainer: {
    flex: 1,
  },
  listDimmed: {
    opacity: 0.4,
  },
  listContent: {
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyText: {
    color: "#1e293b",
    fontSize: 18,
    fontWeight: "800",
  },
  emptySubText: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "500",
  },
});