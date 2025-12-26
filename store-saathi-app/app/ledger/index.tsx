import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLedgerCustomers } from "../../hooks/useLedger";
import LedgerHeader from "../../components/ledger/LedgerHeader";
import LedgerSummary from "../../components/ledger/LedgerSummary";
import DebtorRow from "../../components/ledger/DebtorRow";
import AddCustomerModal from "../../components/ledger/AddCustomerModal";
import PageLoader from "../../components/PageLoader";

export default function LedgerListScreen() {
  const { customers, loading, refresh } = useLedgerCustomers();
  const insets = useSafeAreaInsets();

  const [viewType, setViewType] = useState<"CUSTOMER" | "SUPPLIER">("CUSTOMER");
  const [search, setSearch] = useState("");
  const [sortType, setSortType] = useState<"DUE" | "ADVANCE">("DUE");
  const [showAdd, setShowAdd] = useState(false);

  const filteredCustomers = useMemo(() => {
    let list = customers.filter((c) =>
      viewType === "SUPPLIER" ? c.isSupplier : !c.isSupplier
    );

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.mobileNumber?.includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortType === "DUE") {
        return b.totalPending - a.totalPending;
      } else {
        return a.totalPending - b.totalPending;
      }
    });

    return list;
  }, [customers, viewType, search, sortType]);

  const youGet = filteredCustomers.reduce(
    (s, c) => (c.totalPending > 0 ? s + c.totalPending : s),
    0
  );

  const youGive = filteredCustomers.reduce(
    (s, c) => (c.totalPending < 0 ? s + Math.abs(c.totalPending) : s),
    0
  );

  if (loading) return <PageLoader />;

  return (
    <View style={styles.container}>
      <LedgerHeader />
      <LedgerSummary youGet={youGet} youGive={youGive} />

      {/* SEGMENTED TOGGLE (Blue-600 Focus) */}
      <View style={styles.toggleRow}>
        {["CUSTOMER", "SUPPLIER"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.toggleBtn, viewType === t && styles.toggleActive]}
            onPress={() => setViewType(t as any)}
          >
            <Text style={[styles.toggleText, viewType === t && styles.toggleTextActive]}>
              {t === "CUSTOMER" ? "Customers" : "Suppliers"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionRow}>
        {/* SEARCH BOX */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search by name or mobile..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {/* SORT PILLS (Blue-600 Theme) */}
        <View style={styles.filterPills}>
          <TouchableOpacity 
            style={[styles.pill, sortType === "DUE" && styles.pillActive]}
            onPress={() => setSortType("DUE")}
          >
            <Ionicons 
               name="arrow-down-circle-outline" 
               size={14} 
               color={sortType === "DUE" ? "#fff" : "#64748b"} 
            />
            <Text style={[styles.pillText, sortType === "DUE" && styles.pillTextActive]}>
              Most Due
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.pill, sortType === "ADVANCE" && styles.pillActive]}
            onPress={() => setSortType("ADVANCE")}
          >
            <Ionicons 
               name="arrow-up-circle-outline" 
               size={14} 
               color={sortType === "ADVANCE" ? "#fff" : "#64748b"} 
            />
            <Text style={[styles.pillText, sortType === "ADVANCE" && styles.pillTextActive]}>
              Most Advance
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <DebtorRow
            customer={item}
            onPress={() => router.push(`/ledger/${item._id}`)}
          />
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* THEME FAB (Blue-600) */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom > 0 ? insets.bottom + 10 : 24 }]}
        onPress={() => setShowAdd(true)}
      >
        <Ionicons name="person-add" size={22} color="#fff" />
        <Text style={styles.fabText}>
          Add {viewType === "CUSTOMER" ? "Customer" : "Supplier"}
        </Text>
      </TouchableOpacity>

      <AddCustomerModal
        visible={showAdd}
        isSupplier={viewType === "SUPPLIER"}
        onClose={() => setShowAdd(false)}
        onAdded={() => {
          setShowAdd(false);
          refresh();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  toggleRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#e2e8f0",
    borderRadius: 14,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleActive: {
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toggleText: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 14,
  },
  toggleTextActive: {
    color: "#2563eb", // blue-600
  },
  actionRow: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
    gap: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
  filterPills: {
    flexDirection: "row",
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  pillActive: {
    backgroundColor: "#2563eb", // blue-600
    borderColor: "#2563eb",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  pillTextActive: {
    color: "#fff",
  },
  fab: {
    position: "absolute",
    right: 16,
    backgroundColor: "#2563eb", // blue-600
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 32,
    elevation: 8,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    gap: 10,
  },
  fabText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});