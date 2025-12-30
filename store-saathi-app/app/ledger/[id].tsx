import React, { useEffect, useState, useMemo, useRef } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform 
} from "react-native";
import { useLocalSearchParams } from "expo-router";

/* 📦 COMPONENTS */
import PageLoader from "../../components/PageLoader";
import LedgerChatHeader from "../../components/ledger/LedgerChatHeader";
import LedgerChatBubble from "../../components/ledger/LedgerChatBubble";
import LedgerInputBar from "../../components/ledger/LedgerInputBar";
import ViewBillModal from "../../components/bills/ViewBillModal";

/* 🛠 HOOKS & UTILS */
import { useCustomerLedger } from "../../hooks/useLedger";
import { formatDate } from "../../utils/formatDate";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_LEDGER_DETAIL } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

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
  
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_LEDGER_DETAIL[language] || LANGUAGE_TEXT_LEDGER_DETAIL.en;

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
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [entries]);

  /**
   * Helper to handle Today/Yesterday labels in date separators
   */
  const getDisplayDate = (dateKey: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (dateKey === today) return t.today;
    if (dateKey === yesterday) return t.yesterday;
    return formatDate(dateKey, true);
  };

  if (loading) return <PageLoader />;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* HEADER (Already localized) */}
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
            <View style={styles.emptyIconCircle}>
                <Text style={styles.emptyEmoji}>🧾</Text>
            </View>
            <Text style={styles.empty}>{t.noTransactions}</Text>
          </View>
        ) : (
          Object.entries(groupedEntries).map(([date, dayEntries]) => (
            <View key={date} style={styles.daySection}>
              {/* DATE SEPARATOR */}
              <View style={styles.dateWrap}>
                <View style={styles.dateLine} />
                <Text style={styles.dateText}>
                  {getDisplayDate(date)}
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

      {/* INPUT BAR (Already localized) */}
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
    backgroundColor: "#F1F5F9", // Modern slate-50 background
  },
  chatScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 160, // Increased for floating bar breathing room
  },
  daySection: {
    marginBottom: 8,
  },
  dateWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#CBD5E1",
    opacity: 0.5,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    marginHorizontal: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 120,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  empty: {
    fontSize: 15,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
    maxWidth: "70%",
  },
});