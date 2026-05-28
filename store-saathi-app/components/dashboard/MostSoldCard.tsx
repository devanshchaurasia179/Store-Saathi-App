import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_MOST_SOLD } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

type Item = {
  name: string;
  totalSold: number;
};

/* ─── Rank config ────────────────────────────────────────────────────── */
const RANK_CONFIG = [
  { bg: "#fef9ec", bar: "#f59e0b", text: "#92610a", label: "1st" },
  { bg: "#f4f5f7", bar: "#94a3b8", text: "#4a5568", label: "2nd" },
  { bg: "#fff4f0", bar: "#f97316", text: "#9a3b12", label: "3rd" },
];
const DEFAULT_RANK = { bg: "#f4f6fb", bar: "#1e4de4", text: "#1e4de4", label: "" };

/* ─── Animated Row ───────────────────────────────────────────────────── */
function SoldRow({
  item,
  index,
  maxSold,
}: {
  item: Item;
  index: number;
  maxSold: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  const rank = RANK_CONFIG[index] ?? DEFAULT_RANK;
  const pct = maxSold > 0 ? item.totalSold / maxSold : 0;

  useEffect(() => {
    const delay = index * 70;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(barAnim, {
        toValue: pct,
        duration: 500,
        delay: delay + 100,
        useNativeDriver: false, // width animation needs JS driver
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.rowWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Rank badge */}
      <View style={[styles.rankBadge, { backgroundColor: rank.bg }]}>
        {index < 3 ? (
          <Text style={[styles.rankLabel, { color: rank.text }]}>
            {rank.label}
          </Text>
        ) : (
          <Text style={[styles.rankLabel, { color: "#9ca3af" }]}>
            {index + 1}
          </Text>
        )}
      </View>

      {/* Name + bar */}
      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.soldCount}>
            {item.totalSold}
            <Text style={styles.soldUnit}> sold</Text>
          </Text>
        </View>

        {/* Animated progress bar */}
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              {
                backgroundColor: rank.bar,
                width: barAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────── */
function EmptyState({ title, noData }: { title: string; noData: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="trending-up" size={16} color="#10b981" />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons name="chart-bar" size={28} color="#d1d5db" />
        </View>
        <Text style={styles.emptyText}>{noData}</Text>
      </View>
    </View>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function MostSoldCard({ items }: { items: Item[] }) {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_MOST_SOLD[language] || LANGUAGE_TEXT_MOST_SOLD.en;

  if (!items || items.length === 0) {
    return <EmptyState title={t.title} noData={t.noData} />;
  }

  const maxSold = Math.max(...items.map((i) => i.totalSold));

  return (
    <View style={styles.card}>
      {/* ── HEADER ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons name="trending-up" size={16} color="#10b981" />
          </View>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.analyticsLink}
          onPress={() => router.push("/analytics")}
          activeOpacity={0.6}
        >
          <Text style={styles.analyticsText}>{t.viewAnalytics}</Text>
          <View style={styles.arrowChip}>
            <Ionicons name="arrow-forward" size={12} color="#1e4de4" />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── ROWS ── */}
      {items.map((item, index) => (
        <React.Fragment key={`${item.name}-${index}`}>
          <SoldRow item={item} index={index} maxSold={maxSold} />
          {index < items.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    elevation: 3,
    shadowColor: "#10b981",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
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
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a2340",
    letterSpacing: 0.1,
  },
  countBadge: {
    backgroundColor: "#10b981",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  analyticsLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  analyticsText: {
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

  /* Row */
  rowWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rankLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  infoCol: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a2340",
    flex: 1,
  },
  soldCount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1a2340",
    flexShrink: 0,
  },
  soldUnit: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9ca3af",
  },

  /* Bar */
  barTrack: {
    height: 4,
    borderRadius: 4,
    backgroundColor: "#f1f3f5",
    overflow: "hidden",
  },
  barFill: {
    height: 4,
    borderRadius: 4,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: "#f2f4f9",
    marginLeft: 48,
  },

  /* Empty */
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#f4f6fb",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
  },
});