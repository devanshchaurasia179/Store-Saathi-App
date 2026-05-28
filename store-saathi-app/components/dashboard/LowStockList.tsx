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
import { LANGUAGE_TEXT_LOW_STOCK } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

/* ─── Urgency config ─────────────────────────────────────────────────── */
const getUrgency = (qty: number) => {
  if (qty <= 2)
    return {
      bg: "#fef2f2",
      border: "#fecaca",
      qtyColor: "#dc2626",
      dotColor: "#dc2626",
      label: "critical",
    };
  if (qty <= 5)
    return {
      bg: "#fff7ed",
      border: "#fed7aa",
      qtyColor: "#ea580c",
      dotColor: "#f97316",
      label: "low",
    };
  return {
    bg: "#fefce8",
    border: "#fde68a",
    qtyColor: "#ca8a04",
    dotColor: "#eab308",
    label: "ok",
  };
};

/* ─── Animated Row ───────────────────────────────────────────────────── */
function StockRow({ item, index }: { item: any; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 65,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const unit = item.unit || "unit";
  const urgency = getUrgency(item.quantity);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      <View
        style={[
          styles.itemRow,
          { backgroundColor: urgency.bg, borderColor: urgency.border },
        ]}
      >
        {/* Urgency dot */}
        <View style={[styles.urgencyDot, { backgroundColor: urgency.dotColor }]} />

        {/* Item name */}
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>

        {/* Quantity pill */}
        <View style={[styles.qtyPill, { borderColor: urgency.border }]}>
          <Text style={[styles.qtyValue, { color: urgency.qtyColor }]}>
            {item.quantity}
          </Text>
          <Text style={[styles.qtyUnit, { color: urgency.qtyColor }]}>
            {" "}{unit}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────── */
function EmptyState({ t }: { t: any }) {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={16}
              color="#f97316"
            />
          </View>
          <Text style={styles.headerText}>{t.lowStock}</Text>
        </View>
      </View>

      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={30}
            color="#10b981"
          />
        </View>
        <Text style={styles.emptyTitle}>{t.allStocked ?? "All stocked up!"}</Text>
        <Text style={styles.emptySubtitle}>
          {t.noLowStock ?? "No items are running low right now."}
        </Text>
      </View>
    </View>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function LowStockList({ items }: any) {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_LOW_STOCK[language] || LANGUAGE_TEXT_LOW_STOCK.en;

  if (!items || items.length === 0) return <EmptyState t={t} />;

  const criticalCount = items.filter((i: any) => i.quantity <= 2).length;

  return (
    <View style={styles.cardContainer}>
      {/* ── HEADER ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.headerIconWrap}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={16}
              color="#f97316"
            />
          </View>
          <Text style={styles.headerText}>{t.lowStock}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}</Text>
          </View>
        </View>
        <Text style={styles.qtyLabel}>{t.qtyLeft}</Text>
      </View>

      {/* ── ITEMS ── */}
      <View style={styles.itemList}>
        {items.map((item: any, index: number) => (
          <StockRow key={item._id ?? index} item={item} index={index} />
        ))}
      </View>

      {/* ── FOOTER CTA ── */}
      <TouchableOpacity
        style={styles.footerButton}
        onPress={() => router.push("/inventory")}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="package-variant" size={14} color="#fff" />
        <Text style={styles.footerText}>{t.updateInventory}</Text>
        <Ionicons name="arrow-forward" size={13} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#f97316",
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
    gap: 7,
    flexWrap: "wrap",
  },
  headerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
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
    backgroundColor: "#f97316",
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
  criticalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#dc2626",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  criticalText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  qtyLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  /* Item list */
  itemList: {
    gap: 8,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  urgencyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  itemName: {
    fontSize: 14,
    color: "#1a2340",
    fontWeight: "600",
    flex: 1,
  },
  qtyPill: {
    flexDirection: "row",
    alignItems: "baseline",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#fff",
    flexShrink: 0,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  qtyUnit: {
    fontSize: 11,
    fontWeight: "400",
  },

  /* Footer CTA */
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#1e4de4",
    borderRadius: 12,
    paddingVertical: 12,
  },
  footerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
  },

  /* Empty state */
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 18,
    gap: 8,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a2340",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 20,
  },
});