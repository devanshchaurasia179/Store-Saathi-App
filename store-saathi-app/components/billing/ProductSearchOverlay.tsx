import React, { useState, useMemo, useCallback, memo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_WIDTH = (SCREEN_WIDTH - 44) / 2;
const THEME_BLUE = "#1e3a8a";

// --- Sub-component for individual product tiles to prevent massive re-renders ---
const ProductTile = memo(({ 
  product, 
  selectedIds, 
  onToggle 
}: { 
  product: any, 
  selectedIds: Set<string>, 
  onToggle: (key: string) => void 
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
        <MaterialCommunityIcons name="cube-outline" size={14} color="#cbd5e1" />
      </View>

      <Text style={styles.tileName} numberOfLines={2}>{product.name}</Text>

      {hasVariants ? (
        <View style={styles.variantVerticalList}>
          {product.variants.map((variant: any) => {
            const vid = variant._id || variant.id;
            const key = `${id}:${vid}`;
            const isSelected = selectedIds.has(key);
            return (
              <TouchableOpacity
                key={vid}
                style={[styles.variantVerticalPill, isSelected && styles.variantPillSelected]}
                onPress={() => onToggle(key)}
                activeOpacity={0.7}
              >
                <View style={styles.variantPillLeft}>
                  <Text style={[styles.variantName, isSelected && styles.selectedText]} numberOfLines={1}>
                    {variant.name}
                  </Text>
                  <Text style={[styles.variantPrice, isSelected && styles.selectedText]}>
                    ₹{variant.price?.sellingPrice?.toLocaleString()}
                  </Text>
                </View>
                <Ionicons 
                  name={isSelected ? "checkmark-circle" : "add-circle-outline"} 
                  size={20} 
                  color={isSelected ? "#fff" : "#94a3b8"} 
                />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.simplePriceRow, selectedIds.has(id) && styles.simplePriceRowSelected]}
          onPress={() => onToggle(id)}
          activeOpacity={0.7}
        >
          <View>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={[styles.price, selectedIds.has(id) && styles.selectedText]}>
              ₹{(product.price?.sellingPrice ?? 0).toLocaleString()}
            </Text>
          </View>
          <Ionicons 
            name={selectedIds.has(id) ? "checkmark-circle" : "add-circle"} 
            size={26} 
            color={selectedIds.has(id) ? "#fff" : THEME_BLUE} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
});

interface ProductSearchOverlayProps {
  visible: boolean;
  title: string;
  value: string;
  onChange: (text: string) => void;
  onClose: () => void;
  items: any[];
  onAddMultiple?: (products: any[]) => void;
  onAdd?: (product: any) => void;
  extraTopOption?: React.ReactNode;
}

export default function ProductSearchOverlay({
  visible,
  title,
  value,
  onChange,
  onClose,
  items,
  onAddMultiple,
  onAdd,
  extraTopOption,
}: ProductSearchOverlayProps) {
  const insets = useSafeAreaInsets();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const cats = new Set<string>(items.map((item) => item.category || "General"));
    return ["All", ...Array.from(cats).sort()];
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];
    if (activeCategory !== "All") {
      result = result.filter((item) => (item.category || "General") === activeCategory);
    }
    if (value.trim()) {
      const q = value.toLowerCase();
      result = result.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.variants?.some((v: any) => v.name?.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [items, activeCategory, value]);

  const toggleSelect = useCallback((key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedIds.size === 0) return;
    const selected: any[] = [];
    selectedIds.forEach((key) => {
      const [productId, variantId] = key.split(":");
      const product = items.find((p) => (p._id || p.id) === productId);
      if (!product) return;

      if (!variantId) {
        selected.push({ ...product, productId: product._id || product.id, variantId: null, quantity: 1 });
      } else {
        const variant = product.variants?.find((v: any) => (v._id || v.id) === variantId);
        if (variant) {
          selected.push({ 
            ...variant, 
            productId: product._id || product.id, 
            variantId: variant._id || variant.id, 
            name: `${product.name} (${variant.name})`, 
            category: product.category, 
            quantity: 1 
          });
        }
      }
    });
    if (onAddMultiple) onAddMultiple(selected);
    else selected.forEach((p) => onAdd?.(p));
    setSelectedIds(new Set());
    onClose();
  }, [selectedIds, items, onAddMultiple, onAdd, onClose]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ProductTile 
      product={item} 
      selectedIds={selectedIds} 
      onToggle={toggleSelect} 
    />
  ), [selectedIds, toggleSelect]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.modalOverlay}
      >
        <View style={[styles.sheet, { paddingTop: insets.top || 10, paddingBottom: insets.bottom || 20 }]}>
          
          <View style={styles.headerTopNav}>
            <TouchableOpacity onPress={onClose} style={styles.backButton} hitSlop={15}>
              <Ionicons name="chevron-back" size={28} color="#1e293b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title || "Select Products"}</Text>
            <View style={{ width: 28 }} /> 
          </View>

          <View style={styles.searchHeader}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor="#94a3b8"
                value={value}
                onChangeText={onChange}
                autoFocus
                returnKeyType="search"
                selectionColor={THEME_BLUE}
              />
              {value.length > 0 && (
                <TouchableOpacity onPress={() => onChange("")} hitSlop={12}>
                  <Ionicons name="close-circle" size={22} color="#cbd5e1" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.categoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredAndSortedItems}
            keyExtractor={(item) => (item._id || item.id).toString()}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={styles.gridRowLayout}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            
            // --- Performance Props ---
            removeClippedSubviews={Platform.OS === 'android'} 
            maxToRenderPerBatch={10}
            windowSize={5}
            initialNumToRender={8}
            
            ListHeaderComponent={extraTopOption ? <View style={{ marginBottom: 16 }}>{extraTopOption}</View> : null}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="cube-outline" size={40} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyText}>No Products Found</Text>
                <Text style={styles.emptySubText}>Adjust your filters or search query</Text>
              </View>
            }
          />

          {selectedIds.size > 0 && (
  <View style={[styles.confirmContainer, { bottom: insets.bottom + 10 }]}>
    <TouchableOpacity activeOpacity={0.9} style={styles.confirmButton} onPress={handleConfirm}>
      {/* Changed <div> to <View> */}
      <View style={styles.confirmLeft}> 
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{selectedIds.size}</Text>
        </View>
        <Text style={styles.confirmText}>Add to Bill</Text>
      </View>
      <Ionicons name="arrow-forward-circle" size={32} color="#fff" />
    </TouchableOpacity>
  </View>
)}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#f1f5f9",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "95%",
  },
  headerTopNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    padding: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  searchHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
  },
  categoryContainer: {
    paddingBottom: 16,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryChipActive: {
    backgroundColor: THEME_BLUE,
    borderColor: THEME_BLUE,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  categoryChipTextActive: {
    color: "#ffffff",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  gridRowLayout: {
    justifyContent: "space-between",
  },
  tile: {
    width: ITEM_WIDTH,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catBadgeContainer: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '85%',
  },
  categoryBadge: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "800",
    textTransform: "uppercase",
  },
  tileName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 12,
    lineHeight: 20,
    height: 40,
  },
  simplePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
  variantVerticalList: {
    gap: 8,
  },
  variantVerticalPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    borderLeftWidth: 4,
    borderLeftColor: '#e2e8f0',
  },
  variantPillSelected: {
    backgroundColor: THEME_BLUE,
    borderLeftColor: '#60a5fa',
  },
  variantPillLeft: {
    flex: 1,
  },
  variantName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  variantPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: THEME_BLUE,
    marginTop: 1,
  },
  selectedText: {
    color: "#ffffff",
  },
  confirmContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 99,
  },
  confirmButton: {
    backgroundColor: "#0f172a",
    borderRadius: 28,
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    elevation: 12,
    shadowColor: THEME_BLUE,
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  confirmLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  countBadge: {
    backgroundColor: THEME_BLUE,
    width: 48,
    height: 48,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  countText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
  },
  confirmText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#334155",
  },
  emptySubText: {
    marginTop: 6,
    fontSize: 14,
    color: "#94a3b8",
  },
});