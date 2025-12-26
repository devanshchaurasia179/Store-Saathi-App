import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState, useRef, useEffect } from "react";

import PageLoader from "../../components/PageLoader";
import LedgerChatHeader from "../../components/ledger/LedgerChatHeader";
import LedgerChatBubble from "../../components/ledger/LedgerChatBubble";
import LedgerInputBar from "../../components/ledger/LedgerInputBar";
import ViewBillModal from "../../components/bills/ViewBillModal";

import { useCustomerLedger } from "../../hooks/useLedger";
import { formatDate } from "../../utils/formatDate";

/* ---------- group entries by date ---------- */
function groupByDate(entries: any[] = []) {
  const groups: Record<string, any[]> = {};
  entries.forEach((entry) => {
    const dateKey = new Date(entry.createdAt).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(entry);
  });
  return groups;
}

export default function LedgerDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const {
    customer,
    entries,
    loading,
    isSubmitting,
    addNewCredit,
    addNewDebit,
    refresh
  } = useCustomerLedger(id);

  const [activeBillId, setActiveBillId] = useState<string | null>(null);

  const groupedEntries = useMemo(() => {
    if (!entries?.length) return {};
    return groupByDate(entries);
  }, [entries]);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (entries?.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [entries]);

  if (loading) return <PageLoader />;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined} 
      style={styles.container}
    >
      {/* HEADER */}
      <LedgerChatHeader
  customer={customer}
  onRefresh={refresh}
/>


      {/* CHAT AREA */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.chatScroll}
        showsVerticalScrollIndicator={false}
      >
        {Object.keys(groupedEntries).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📑</Text>
            <Text style={styles.empty}>No transactions found for this customer</Text>
          </View>
        ) : (
          Object.entries(groupedEntries).map(([date, dayEntries]) => (
            <View key={date} style={styles.daySection}>
              {/* DATE SEPARATOR */}
              <View style={styles.dateWrap}>
                <View style={styles.dateLine} />
                <Text style={styles.dateText}>
                  {formatDate(date, true)}
                </Text>
                <View style={styles.dateLine} />
              </View>

              {dayEntries.map((entry: any) => (
                <LedgerChatBubble
                  key={entry._id}
                  entry={entry}
                  isSupplier={customer?.isSupplier}
                  onViewBill={(billId) => setActiveBillId(billId)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* INPUT BAR */}
      <LedgerInputBar
        onAddCredit={addNewCredit}
        onAddDebit={addNewDebit}
        isSubmitting={isSubmitting}
      />

      {/* VIEW BILL MODAL */}
      {activeBillId && (
        <ViewBillModal
          billId={activeBillId}
          onClose={() => setActiveBillId(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Softer slate background
  },
  chatScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 140, // Space for the floating InputBar
  },
  daySection: {
    marginBottom: 8,
  },
  dateWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  dateLine: {
    flex: 0.2,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginHorizontal: 10,
    textTransform: "uppercase",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
    opacity: 0.5,
  },
  empty: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
});