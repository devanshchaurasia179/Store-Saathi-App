import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { formatDate } from "../../utils/formatDate";
import { formatRupee } from "../../utils/formatCurrency";
import ViewBillModal from "../bills/ViewBillModal";

export default function RecentBills({ bills = [], text }: any) {
  const router = useRouter();
  const [activeBillId, setActiveBillId] = useState<string | null>(null);
const groupBillsByDate = (bills: any[] = []) => {
  const groups: Record<string, any[]> = {};

  bills.forEach((bill) => {
    const dateKey = new Date(bill.createdAt).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(bill);
  });

  return groups;
};


  const groupedBills = useMemo(
    () => groupBillsByDate(bills),
    [bills]
  );

  if (!bills.length) return null;

  return (
    <>
      <View style={styles.cardContainer}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <MaterialCommunityIcons
              name="history"
              size={20}
              color="#1e4de4"
            />
            <Text style={styles.headerText}>
              {text?.recentBills || "Recent Bills"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.seeMoreGroup}
            onPress={() => router.push("/history")}
          >
            <Text style={styles.seeMoreText}>
              {text?.seeMore || "See more"}
            </Text>
            <Ionicons name="arrow-forward" size={14} color="#1e4de4" />
          </TouchableOpacity>
        </View>

        {/* GROUPED BILLS */}
        {Object.entries(groupedBills).map(([date, dayBills]) => (
          <View key={date}>
            {/* DATE BADGE */}
            <View style={styles.dateSeparatorContainer}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>
                  {formatDate(date)}
                </Text>
              </View>
            </View>

            {/* BILL LIST */}
            {dayBills.map((bill: any, index: number) => (
              <TouchableOpacity
                key={bill._id}
                style={styles.billItem}
                onPress={() => setActiveBillId(bill._id)}
                activeOpacity={0.6}
              >
                <View style={styles.billInfo}>
                  <Text style={styles.billNumber}>
                    {text?.bill || "Bill"} #{bill.dailyBillNumber}
                  </Text>

                  <View style={styles.timeGroup}>
                    <Ionicons name="time-outline" size={12} color="#999" />
                    <Text style={styles.timeText}>
                      {new Date(bill.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>

                <Text style={styles.totalAmount}>
                  {formatRupee(bill.totalAmount)}
                </Text>

                {index < dayBills.length - 1 && (
                  <View style={styles.divider} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* VIEW BILL MODAL */}
      {activeBillId && (
        <ViewBillModal
          billId={activeBillId}
          onClose={() => setActiveBillId(null)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginTop: 15,
    backgroundColor: "#fff",
    marginHorizontal: 12,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  seeMoreGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeMoreText: {
    fontSize: 14,
    color: "#1e4de4",
    fontWeight: "600",
  },
  dateSeparatorContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  dateBadge: {
    backgroundColor: "#f1f3f5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  billItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  },
  billInfo: {
    flex: 1,
  },
  billNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginBottom: 2,
  },
  timeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: "#999",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
  },
  divider: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#f1f3f5",
  },
});
