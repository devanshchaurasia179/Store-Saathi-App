import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

/* 🛠 UTILS */
import { formatDate } from "../../utils/formatDate";
import { formatRupee } from "../../utils/formatCurrency";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_RECENT_BILLS } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

/* 📦 COMPONENTS */
import ViewBillModal from "../bills/ViewBillModal";

/* ─── Animated Bill Row ──────────────────────────────────────────────── */
function BillRow({
  bill,
  index,
  isLast,
  onPress,
  t,
}: {
  bill: any;
  index: number;
  isLast: boolean;
  onPress: () => void;
  t: any;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const itemCount = bill.items?.length ?? 0;

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <TouchableOpacity
        style={styles.billItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Left accent + icon */}
        <View style={styles.billIconWrap}>
          <MaterialCommunityIcons name="file-document" size={18} color="#1e4de4" />
        </View>

        {/* Info */}
        <View style={styles.billInfo}>
          <Text style={styles.billNumber}>
            {t.bill} #{bill.dailyBillNumber}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={11} color="#7a8aaa" />
              <Text style={styles.metaText}>
                {new Date(bill.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            {itemCount > 0 && (
              <View style={styles.metaPill}>
                <Ionicons name="cube-outline" size={11} color="#7a8aaa" />
                <Text style={styles.metaText}>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Amount + chevron */}
        <View style={styles.amountGroup}>
          <Text style={styles.totalAmount}>{formatRupee(bill.totalAmount)}</Text>
          <Ionicons name="chevron-forward" size={14} color="#c0c8de" />
        </View>
      </TouchableOpacity>

      {!isLast && <View style={styles.divider} />}
    </Animated.View>
  );
}

/* ─── Date Section Header ────────────────────────────────────────────── */
function DateHeader({ label }: { label: string }) {
  return (
    <View style={styles.dateSeparatorContainer}>
      <View style={styles.separatorLine} />
      <View style={styles.dateBadge}>
        <Text style={styles.dateText}>{label}</Text>
      </View>
      <View style={styles.separatorLine} />
    </View>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function RecentBills({ bills = [] }: any) {
  const router = useRouter();
  const { language } = useLanguage();
  const [activeBillId, setActiveBillId] = useState<string | null>(null);

  const t = LANGUAGE_TEXT_RECENT_BILLS[language] || LANGUAGE_TEXT_RECENT_BILLS.en;

  const groupBillsByDate = (billsList: any[] = []) => {
    const groups: Record<string, any[]> = {};
    billsList.forEach((bill) => {
      const dateKey = new Date(bill.createdAt).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(bill);
    });
    return groups;
  };

  const groupedBills = useMemo(() => groupBillsByDate(bills), [bills]);

  if (!bills.length) return null;

  const getRelativeDate = (dateStr: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dateStr === today) return t.today;
    if (dateStr === yesterday) return t.yesterday;
    return formatDate(dateStr);
  };

  /* Running index across all groups for staggered animation */
  let globalIndex = 0;

  return (
    <>
      <View style={styles.cardContainer}>
        {/* ── HEADER ── */}
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <View style={styles.headerIconWrap}>
              <MaterialCommunityIcons name="history" size={16} color="#1e4de4" />
            </View>
            <Text style={styles.headerText}>{t.recentBills}</Text>
            
          </View>

          <TouchableOpacity
            style={styles.seeMoreGroup}
            onPress={() => router.push("/history")}
            activeOpacity={0.6}
          >
            <Text style={styles.seeMoreText}>{t.seeMore}</Text>
            <View style={styles.arrowChip}>
              <Ionicons name="arrow-forward" size={12} color="#1e4de4" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── GROUPED BILLS ── */}
        {Object.entries(groupedBills).map(([date, dayBills]) => (
          <View key={date} style={styles.group}>
            <DateHeader label={getRelativeDate(date)} />

            {dayBills.map((bill: any, index: number) => {
              const rowIndex = globalIndex++;
              return (
                <BillRow
                  key={bill._id}
                  bill={bill}
                  index={rowIndex}
                  isLast={index === dayBills.length - 1}
                  onPress={() => setActiveBillId(bill._id)}
                  t={t}
                />
              );
            })}
          </View>
        ))}
      </View>

      {activeBillId && (
        <ViewBillModal
          billId={activeBillId}
          onClose={() => setActiveBillId(null)}
        />
      )}
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  /* Card */
  cardContainer: {
    marginTop: 15,
    backgroundColor: "#fff",
    marginHorizontal: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#1e4de4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#eef1fd",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a2340",
    letterSpacing: 0.1,
  },
  countBadge: {
    backgroundColor: "#1e4de4",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  seeMoreGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  seeMoreText: {
    fontSize: 13,
    color: "#1e4de4",
    fontWeight: "600",
  },
  arrowChip: {
    width: 22,
    height: 22,
    borderRadius: 8,
    backgroundColor: "#eef1fd",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Groups */
  group: {
    marginBottom: 4,
  },

  /* Date separator */
  dateSeparatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    gap: 8,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#eef0f6",
  },
  dateBadge: {
    backgroundColor: "#f4f6fb",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8ecf7",
  },
  dateText: {
    fontSize: 11,
    color: "#7a8aaa",
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  /* Bill row */
  billItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    gap: 12,
  },
  billIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#eef1fd",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  billInfo: {
    flex: 1,
    gap: 4,
  },
  billNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a2340",
    letterSpacing: 0.1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: "#7a8aaa",
    fontWeight: "500",
  },

  /* Amount */
  amountGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a2340",
    letterSpacing: -0.3,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: "#f2f4f9",
    marginLeft: 50,
  },
});