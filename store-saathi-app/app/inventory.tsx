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
} from "react-native";
import { useMemo, useState, useCallback, useRef } from "react";
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

  const scanningLockedRef = useRef(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [productNotFound, setProductNotFound] = useState(false);

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

    setShowScanner(false); // Hide scanner immediately
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
          {/* ... search and filter unchanged ... */}
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

        {/* BARCODE SCANNER - Always mounted */}
        <View style={[
          styles.scannerContainer,
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

        {/* DARK OVERLAY ONLY BELOW THE SCANNER */}
        {showScanner && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={closeScanner}
            style={styles.darkOverlayBelowScanner}
          />
        )}

        {/* INVENTORY LIST */}
        <View style={[
          styles.listContainer,
          showScanner && styles.listDimmed // Optional: slightly dim the list
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

        {/* MODALS */}
        <AddProductModal
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            refresh(true);
          }}
        />

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
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
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

  // SCANNER
  scannerContainer: {
    height: 220,
    backgroundColor: "#020617",
    position: "relative",
    zIndex: 1000, // Above everything
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
    zIndex: 1001,
  },
  scanText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  // DARK OVERLAY - ONLY BELOW SCANNER
  darkOverlayBelowScanner: {
    position: "absolute",
    top: 220 + (StatusBar.currentHeight || 0) + 150, // Approx position below header + search + scanner
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 999,
  },

  // LIST
  listContainer: {
    flex: 1,
    zIndex: 1,
  },
  listDimmed: {
    opacity: 0.6, // Optional subtle dimming
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