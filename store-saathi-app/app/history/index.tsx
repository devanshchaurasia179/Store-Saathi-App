import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useBills } from "../../hooks/useBills";
import PageLoader from "../../components/PageLoader";
import ViewBillModal from "../../components/bills/ViewBillModal";
import { formatRupee } from "../../utils/formatCurrency";

/* ---------- helpers ---------- */
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const getGroupTitle = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function BillsHistoryScreen() {
  const { bills, loading } = useBills();
  const insets = useSafeAreaInsets();

  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const filteredBills = useMemo(() => {
    let list = bills;
    if (selectedDate) {
      list = list.filter((b: any) => isSameDay(new Date(b.createdAt), selectedDate));
    }
    return list.slice(0, visibleCount);
  }, [bills, selectedDate, visibleCount]);

  const groupedBills = useMemo(() => {
    return filteredBills.reduce((groups: any, bill: any) => {
      const title = getGroupTitle(bill.createdAt);
      if (!groups[title]) groups[title] = [];
      groups[title].push(bill);
      return groups;
    }, {});
  }, [filteredBills]);

  if (loading) return <PageLoader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <Text style={styles.title}>History</Text>

        <TouchableOpacity
          style={[styles.headerIcon, selectedDate && styles.headerIconActive]}
          onPress={() => setShowPicker(true)}
        >
          <Ionicons
            name={selectedDate ? "calendar" : "calendar-outline"}
            size={22}
            color={selectedDate ? "#fff" : "#2563eb"}
          />
        </TouchableOpacity>
      </View>

      {/* DATE PICKER */}
      {showPicker && (
  <DateTimePicker
    value={selectedDate || new Date()}
    mode="date"
    display="calendar"
    // 🔹 This line restricts the picker to today's date
    maximumDate={new Date()} 
    onChange={(_, date) => {
      setShowPicker(false);
      if (date) {
        setSelectedDate(date);
        setVisibleCount(20);
      }
    }}
  />
)}

      {/* ACTIVE FILTER CHIP */}
      {selectedDate && (
        <View style={styles.filterBar}>
          <View style={styles.dateChip}>
            <Ionicons name="funnel" size={14} color="#2563eb" />
            <Text style={styles.chipText}>
              {selectedDate.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDate(null)} style={styles.chipClose}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* LIST OR EMPTY STATE */}
      <FlatList
        data={Object.entries(groupedBills)}
        keyExtractor={([title]) => title}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="document-text-outline" size={40} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No bills found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedDate 
                ? "Try picking a different date or clear the filter." 
                : "Your billed transactions will appear here."}
            </Text>
          </View>
        }
        renderItem={({ item: [title, items] }: any) => (
          <View style={styles.section}>
            <View style={styles.dateHeader}>
              <View style={styles.dot} />
              <Text style={styles.groupTitle}>{title}</Text>
            </View>

            {items.map((bill: any) => (
              <Pressable
                key={bill._id}
                onPress={() => setSelectedBillId(bill._id)}
                style={({ pressed }) => [
                  styles.billCard,
                  pressed && styles.billCardPressed
                ]}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.billIconContainer}>
                    <Ionicons name="receipt-outline" size={20} color="#2563eb" />
                  </View>
                  <View>
                    <Text style={styles.billNo}>Bill #{bill.dailyBillNumber}</Text>
                    <Text style={styles.time}>
                      {new Date(bill.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <Text style={styles.amount}>{formatRupee(bill.totalAmount)}</Text>
                  <StatusBadge status={bill.paymentStatus} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
        ListFooterComponent={
          !selectedDate && bills.length > visibleCount ? (
            <TouchableOpacity
              onPress={() => setVisibleCount((p) => p + 20)}
              style={styles.loadMore}
            >
              <Text style={styles.loadMoreText}>LOAD PREVIOUS BILLS</Text>
              <Ionicons name="chevron-down" size={16} color="#475569" />
            </TouchableOpacity>
          ) : null
        }
      />

      {selectedBillId && (
        <ViewBillModal
          billId={selectedBillId}
          onClose={() => setSelectedBillId(null)}
        />
      )}
    </View>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: any = {
    PAID: { bg: "#dcfce7", text: "#166534", icon: "checkmark-circle" },
    PARTIAL: { bg: "#fef3c7", text: "#92400e", icon: "time" },
    UNPAID: { bg: "#fee2e2", text: "#991b1b", icon: "alert-circle" },
  };

  return (
    <View style={[styles.badge, { backgroundColor: map[status]?.bg }]}>
      <Ionicons
        name={map[status]?.icon}
        size={10}
        color={map[status]?.text}
        style={{ marginRight: 4 }}
      />
      <Text style={[styles.badgeText, { color: map[status]?.text }]}>
        {status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  headerIcon: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#f0f7ff",
  },
  headerIconActive: {
    backgroundColor: "#2563eb",
  },
  title: {
    fontWeight: "800",
    fontSize: 18,
    color: "#0f172a",
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
    marginHorizontal: 8,
  },
  chipClose: {
    marginLeft: 4,
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#475569',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  section: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
    marginRight: 8,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  billCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  billCardPressed: {
    backgroundColor: '#f8fafc',
    transform: [{ scale: 0.98 }],
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  billNo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  time: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 18,
    fontWeight: "900",
    color: '#0f172a',
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  loadMore: {
    marginTop: 10,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    gap: 8,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
  },
});