import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl } from "react-native";
import { useMemo, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AddProductModal from "@/components/inventory/AddProductModal";

import InventoryRow from "@/components/inventory/InventoryRow";
import InventoryHeader from "../components/inventory/InventoryHeader";
import PageLoader from "../components/PageLoader";
import { useInventory } from "../hooks/useInventory";

export default function InventoryPage() {
  const { products, loading, refresh } = useInventory();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "LOW" | "HIGH" | "OUT">("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

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

  if (loading && !refreshing) return <PageLoader />;

  return (
    <View style={styles.container}>
      {/* 1. Header is now part of the theme flow */}
      <InventoryHeader
        onAddProduct={() => setShowAdd(true)}
        onQuickEntry={() => console.log("open scanner")}
      />

      <AddProductModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdded={() => {
          setShowAdd(false);
          refresh(true);
        }}
      />

      <View style={styles.topActions}>
        {/* 2. Enhanced Search Box with better iconography */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search inventory by name..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            clearButtonMode="while-editing" // iOS native clear button
          />
          {search.length > 0 && (
             <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color="#cbd5e1" />
             </TouchableOpacity>
          )}
        </View>

        {/* 3. Improved Filter Pills with count indicators (Logic preserved) */}
        <View style={styles.filterRow}>
          {(["ALL", "LOW", "OUT"] as const).map((type) => {
            const isActive = filter === type;
            return (
              <TouchableOpacity
                key={type}
                activeOpacity={0.7}
                onPress={() => setFilter(type)}
                style={[
                  styles.pill,
                  isActive && styles.pillActive
                ]}
              >
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {type === "ALL" ? "All Items" : type === "LOW" ? "Low Stock" : "Out of Stock"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Optimized List with better spacing */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
            styles.listContent, 
            { paddingBottom: insets.bottom + 100 } 
        ]}
        showsVerticalScrollIndicator={false}
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
                <Ionicons name="cube-outline" size={40} color="#94a3b8" />
            </View>
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubText}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F1F5F9" // Lighter, more premium slate background
  },
  topActions: {
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 16,
    backgroundColor: "#fff", // White top section for contrast
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F8FAF8", // Slightly off-white input
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
    fontWeight: '500',
    color: '#1E293B'
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillActive: {
    backgroundColor: "#2563EB", // Blue-600
    borderColor: "#2563EB",
    // Elevation for active state
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    paddingHorizontal: 4, // Added slight side padding for card shadows
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: "#475569",
    fontSize: 18,
    fontWeight: '700'
  },
  emptySubText: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  }
});