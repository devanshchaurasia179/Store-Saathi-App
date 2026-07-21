import React, { useState, useMemo, useCallback, useEffect, memo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { getProducts } from "../../constants/inventory.api";
import { useLanguage } from "../../providers/LanguageProvider";
import { LANGUAGE_TEXT_BILLING } from "../../constants/language_billing";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = (SCREEN_WIDTH - 44) / 2;
const THEME_BLUE = "#1e3a8a";

/* ─────────────── PRODUCT TILE (memoized) ─────────────── */
const ProductTile = memo(({ product, selectedMap, onToggle }: {
  product: any;
  selectedMap: Map<string, number>;
  onToggle: (key: string, action: "add" | "remove") => void;
}) => {
  const id = product._id || product.id;
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;

  return (
    <View style={styles.tile}>
      <View style={styles.tileHeader}>
        <View style={styles.catBadgeContainer}>
          <Text style={styles.categoryBadge} numberOfLines={1}>
            {product.category || "General"}
          </Text>
        </View>
      </View>

      <Text style={styles.tileName} numberOfLines={2}>{product.name}</Text>

      {hasVariants ? (
        <View style={styles.variantList}>
          {product.variants.map((variant: any) => {
            const vid = variant._id || variant.id;
            const key = `${id}:${vid}`;
            const qty = selectedMap.get(key) || 0;
            const isSelected = qty > 0;
            return (
              <View key={vid} style={[styles.variantRow, isSelected && styles.variantRowSelected]}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => onToggle(key, "add")}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.variantName, isSelected && styles.selectedText]} numberOfLines={1}>
                    {variant.name}
                  </Text>
                  <Text style={[styles.variantPrice, isSelected && styles.selectedText]}>
                    ₹{variant.price?.sellingPrice?.toLocaleString() || 0}
                  </Text>
                </TouchableOpacity>
                {isSelected && (
                  <View style={styles.qtyControls}>
                    <TouchableOpacity onPress={() => onToggle(key, "remove")} style={styles.qtyBtn}>
                      <Ionicons name="remove" size={16} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <TouchableOpacity onPress={() => onToggle(key, "add")} style={styles.qtyBtn}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={[styles.simplePriceRow, (selectedMap.get(id) || 0) > 0 && styles.simplePriceRowSelected]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => onToggle(id, "add")}
            activeOpacity={0.7}
          >
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={[styles.price, (selectedMap.get(id) || 0) > 0 && styles.selectedText]}>
              ₹{(product.price?.sellingPrice ?? 0).toLocaleString()}
            </Text>
          </TouchableOpacity>
          {(selectedMap.get(id) || 0) > 0 && (
            <View style={styles.qtyControls}>
              <TouchableOpacity onPress={() => onToggle(id, "remove")} style={styles.qtyBtn}>
                <Ionicons name="remove" size={16} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{selectedMap.get(id)}</Text>
              <TouchableOpacity onPress={() => onToggle(id, "add")} style={styles.qtyBtn}>
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

/* ─────────────── MAIN PAGE ─────────────── */
export default function SelectProductsPage() {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_BILLING[language] || LANGUAGE_TEXT_BILLING.en;
  const params = useLocalSearchParams<{ existingItems?: string }>();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  // Map of key -> quantity
  const [selectedMap, setSelectedMap] = useState<Map<string, number>>(() => {
    // Initialize with existing items from billing page if available
    if (params.existingItems) {
      try {
        const existing: { productId: string; variantId: string | null; quantity: number }[] =
          JSON.parse(params.existingItems);
        const map = new Map<string, number>();
        existing.forEach(({ productId, variantId, quantity }) => {
          const key = variantId ? `${productId}:${variantId}` : productId;
          map.set(key, quantity);
        });
        return map;
      } catch {}
    }
    return new Map();
  });

  useEffect(() => {
    getProducts()
      .then((res) => setProducts(res.data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>(products.map((p) => p.category || "General"));
    return ["All", ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (activeCategory !== "All") {
      result = result.filter((p) => (p.category || "General") === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.barcode?.includes(search) ||
          p.category?.toLowerCase().includes(q) ||
          p.variants?.some((v: any) => v.name?.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [products, activeCategory, search]);

  const toggleProduct = useCallback((key: string, action: "add" | "remove") => {
    setSelectedMap((prev) => {
      const next = new Map(prev);
      const current = next.get(key) || 0;
      if (action === "add") {
        next.set(key, current + 1);
      } else {
        if (current <= 1) {
          next.delete(key);
        } else {
          next.set(key, current - 1);
        }
      }
      return next;
    });
  }, []);

  const totalSelectedCount = useMemo(() => {
    let count = 0;
    selectedMap.forEach((qty) => { count += qty; });
    return count;
  }, [selectedMap]);

  const handleCheckout = useCallback(() => {
    if (selectedMap.size === 0) return;

    // Build selection array with full item details so billing page can use them immediately
    const selections: { productId: string; variantId: string | null; quantity: number; name: string; price: number; unit: string }[] = [];
    selectedMap.forEach((qty, key) => {
      const [productId, variantId] = key.split(":");
      const product = products.find((p) => (p._id || p.id) === productId);
      if (!product) return;

      let name = product.name;
      let price = product.price?.sellingPrice ?? 0;
      const unit = product.unit || "unit";

      if (variantId) {
        const variant = product.variants?.find((v: any) => (v._id || v.id) === variantId);
        if (variant) {
          name = `${product.name} (${variant.name})`;
          price = variant.price?.sellingPrice ?? 0;
        }
      }

      selections.push({
        productId,
        variantId: variantId || null,
        quantity: qty,
        name,
        price,
        unit,
      });
    });

    router.navigate({
      pathname: "/billing",
      params: { selectedProducts: JSON.stringify(selections) },
    });
  }, [selectedMap, products]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ProductTile product={item} selectedMap={selectedMap} onToggle={toggleProduct} />
  ), [selectedMap, toggleProduct]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1e293b" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Select Products</Text>
          <Text style={styles.headerSubtitle}>Tap to add, then proceed to billing</Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="close-circle" size={22} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* CATEGORY CHIPS */}
      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* PRODUCT GRID */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME_BLUE} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => (item._id || item.id).toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={8}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No products found</Text>
              <Text style={styles.emptySubText}>Try a different search or category</Text>
            </View>
          }
        />
      )}

      {/* CHECKOUT FLOATING BUTTON */}
      {totalSelectedCount > 0 && (
        <View style={styles.checkoutBar}>
          <TouchableOpacity activeOpacity={0.9} style={styles.checkoutBtn} onPress={handleCheckout}>
            <View style={styles.checkoutLeft}>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{totalSelectedCount}</Text>
              </View>
              <Text style={styles.checkoutText}>Proceed to Billing</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}


/* ─────────────── STYLES ─────────────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
  },
  categorySection: {
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryChipActive: {
    backgroundColor: THEME_BLUE,
    borderColor: THEME_BLUE,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  listContent: {
    padding: 12,
    paddingBottom: 120,
  },
  gridRow: {
    justifyContent: "space-between",
  },
  tile: {
    width: ITEM_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  tileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  catBadgeContainer: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadge: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  tileName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 10,
    lineHeight: 19,
    height: 38,
  },
  simplePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  simplePriceRowSelected: {
    backgroundColor: THEME_BLUE,
    borderColor: THEME_BLUE,
  },
  priceLabel: {
    fontSize: 9,
    color: "#94a3b8",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  price: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  variantList: {
    gap: 6,
  },
  variantRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderLeftWidth: 3,
    borderLeftColor: "#e2e8f0",
  },
  variantRowSelected: {
    backgroundColor: THEME_BLUE,
    borderLeftColor: "#60a5fa",
  },
  variantName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  variantPrice: {
    fontSize: 11,
    fontWeight: "800",
    color: THEME_BLUE,
    marginTop: 1,
  },
  selectedText: {
    color: "#fff",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    minWidth: 20,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#334155",
    marginTop: 12,
  },
  emptySubText: {
    marginTop: 6,
    fontSize: 13,
    color: "#94a3b8",
  },
  checkoutBar: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
  checkoutBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 24,
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    elevation: 10,
    shadowColor: THEME_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  checkoutLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  countBadge: {
    backgroundColor: THEME_BLUE,
    width: 42,
    height: 42,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  countText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
