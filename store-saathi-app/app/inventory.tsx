import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  ToastAndroid,
  Alert,
} from "react-native";
import { useMemo, useState, useCallback,useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import InventoryHeader from "../components/inventory/InventoryHeader";
import InventoryRow from "@/components/inventory/InventoryRow";
import AddProductModal from "@/components/inventory/AddProductModal";
import QuickAddProductModal from "@/components/inventory/QuickAddProductModal";
import BarcodeScanner from "@/components/billing/BarcodeScanner";
import PageLoader from "../components/PageLoader";

import { useInventory } from "../hooks/useInventory";
import { getProductByBarcode } from "../constants/inventory.api";

export default function InventoryPage() {
  const { products, loading, refresh } = useInventory();
  const insets = useSafeAreaInsets();

  /* ---------------- UI STATES ---------------- */
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<"ALL" | "LOW" | "HIGH" | "OUT">("ALL");

  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
const scanningLockedRef = useRef(false);

  const [lastScannedBarcode, setLastScannedBarcode] =
    useState<string | null>(null);
  const [productNotFound, setProductNotFound] =
    useState(false);

  /* ---------------- REFRESH ---------------- */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  /* ---------------- FILTER LOGIC ---------------- */
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name?.toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case "LOW":
        return list.filter(
          (p) => p.quantity > 0 && p.quantity <= 5
        );
      case "HIGH":
        return list.filter((p) => p.quantity > 5);
      case "OUT":
        return list.filter((p) => p.quantity === 0);
      default:
        return list;
    }
  }, [products, search, filter]);

  /* ---------------- BARCODE SCAN HANDLER ---------------- */
  const handleScan = async (barcode: string) => {
  if (scanningLockedRef.current) return;
  scanningLockedRef.current = true;

  setLastScannedBarcode(barcode);

  try {
    const res = await getProductByBarcode(barcode);
    const product = res?.data?.product;

    if (product) {
      Alert.alert("Notice", "Product already exists");
      setShowScanner(false);
      scanningLockedRef.current = false;
      return;
    }
  } catch (e: any) {
    if (e?.response?.status === 404) {
      setShowScanner(false);

      // ⏳ wait for scanner to unmount
      setTimeout(() => {
        setProductNotFound(true);
        scanningLockedRef.current = false;
      }, 150);
    }
  }
};


  if (loading && !refreshing) {
    return <PageLoader />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* ================= HEADER ================= */}
        <InventoryHeader
          onAddProduct={() => setShowAdd(true)}
          onQuickEntry={() => setShowScanner(true)}
        />

        {/* ================= SEARCH + FILTER ================= */}
        <View style={styles.topActions}>
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#94a3b8"
            />
            <TextInput
              placeholder="Search inventory by name..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color="#cbd5e1"
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterRow}>
            {(["ALL", "LOW", "OUT"] as const).map((type) => {
              const isActive = filter === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setFilter(type)}
                  style={[
                    styles.pill,
                    isActive && styles.pillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      isActive && styles.pillTextActive,
                    ]}
                  >
                    {type === "ALL"
                      ? "All Items"
                      : type === "LOW"
                      ? "Low Stock"
                      : "Out of Stock"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ================= INVENTORY LIST ================= */}
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
              colors={["#2563eb"]}
              tintColor="#2563eb"
            />
          }
          renderItem={({ item }) => (
            <InventoryRow
              product={item}
              onRefresh={refresh}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Ionicons
                  name="cube-outline"
                  size={40}
                  color="#94a3b8"
                />
              </View>
              <Text style={styles.emptyText}>
                No products found
              </Text>
              <Text style={styles.emptySubText}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
        />

        {/* ================= MODALS ================= */}
        <AddProductModal
          visible={showAdd}
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            refresh(true);
          }}
        />

        {productNotFound && lastScannedBarcode && (
          <QuickAddProductModal
  visible={productNotFound}
  barcode={lastScannedBarcode}
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

        )}

        {/* ================= BARCODE SCANNER (FORCED TOP LAYER) ================= */}
        {showScanner && (
  <Modal visible transparent animationType="fade">
    <View style={styles.scannerWrapper}>
      <BarcodeScanner
        onScan={handleScan}
        onClose={() => {
          setShowScanner(false);
          scanningLockedRef.current = false;
        }}
      />
    </View>
  </Modal>
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
    backgroundColor: "#F1F5F9",
  },
  scannerWrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999, // Ensure it sits above all UI elements
    elevation: Platform.OS === 'android' ? 10 : 0,
  },
  topActions: {
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 16,
    backgroundColor: "#fff",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "500",
    color: "#1E293B",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  pillTextActive: {
    color: "#FFF",
  },
  listContent: {
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
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
    color: "#475569",
    fontSize: 18,
    fontWeight: "700",
  },
  emptySubText: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
});