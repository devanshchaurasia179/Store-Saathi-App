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
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function InventoryPage() {
  const { products, loading, refresh } = useInventory();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_INVENTORY_PAGE[language] || LANGUAGE_TEXT_INVENTORY_PAGE.en;

  /* UI STATES */
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "LOW" | "HIGH" | "OUT">("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name?.toLowerCase().includes(q));
    }

    switch (filter) {
      case "LOW":
        return list.filter((p) => p.quantity > 0 && p.quantity <= 5);
      case "HIGH":
        return list.filter((p) => p.quantity > 5);
      case "OUT":
        return list.filter((p) => p.quantity === 0);
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

  if (loading && !refreshing) {
    return <PageLoader />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>

        {/* HEADER */}
        <InventoryHeader
          onAddProduct={() => setShowAdd(true)}
          onQuickEntry={openScanner}
        />

        {/* SEARCH + FILTER */}
        <View style={styles.topActions}>
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
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterRow}>
            {(["ALL", "LOW", "OUT"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setFilter(type)}
                style={[styles.pill, filter === type && styles.pillActive]}
              >
                <Text style={[styles.pillText, filter === type && styles.pillTextActive]}>
                  {type === "ALL" ? t.allItems : type === "LOW" ? t.lowStock : t.outOfStock}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* BARCODE SCANNER SECTION */}
        <View style={[
          styles.scannerWrapper,
          !showScanner && styles.scannerHidden
        ]}>
          <BarcodeScanner
            onScan={handleScan}
            onClose={closeScanner}
          />
          {showScanner && (
            <View style={styles.scanHint}>
              <Ionicons name="scan" size={14} color="#fff" />
              <Text style={styles.scanText}>Align barcode within frame</Text>
            </View>
          )}
        </View>

        {/* INVENTORY LIST */}
        <View style={[
          styles.listContainer,
          (showScanner || productNotFound) && styles.listDimmed
        ]}>
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
            { transform: [{ translateY: slideAnim }] }
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
              {/* Optional: Add a small handle at the bottom of the modal */}
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

        {/* SCANNER OVERLAY (IF OPEN) */}
        {showScanner && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeScanner}
            style={styles.darkOverlayBelowScanner}
          />
        )}
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
  topActions: {
    paddingTop: 5,
    paddingHorizontal: 16,
    gap: 16,
    backgroundColor: "#fff",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    zIndex: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
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
  filterRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillActive: {
    backgroundColor: "#1e3a8a",
    borderColor: "#1e3a8a",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  pillTextActive: {
    color: "#FFF",
  },

  /* SCANNER */
  scannerWrapper: {
    height: 220,
    backgroundColor: "#020617",
    zIndex: 20,
  },
  scannerHidden: {
    height: 0,
    overflow: "hidden",
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
    zIndex: 9999, // Ensure it's above everything
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
  darkOverlayBelowScanner: {
    position: "absolute",
    top: 220 + 150, 
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 15,
  },
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