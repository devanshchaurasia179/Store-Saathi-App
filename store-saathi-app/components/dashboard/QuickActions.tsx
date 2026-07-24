import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_QUICK_ACTIONS } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

/* 🔔 NEW ORDER ALERT */
import { useNewOrderAlert } from "../../hooks/useNewOrderAlert";

export default function QuickActions() {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_QUICK_ACTIONS[language] || LANGUAGE_TEXT_QUICK_ACTIONS.en;
  const { pendingCount } = useNewOrderAlert();

  const handleSupport = () => {
    // Opens the dialer with your support number
    Linking.openURL("tel:+919015422926");
  };

  const actions = [
    {
      title: t.inventory,
      icon: "cube-outline",
      Icon: Ionicons,
      onPress: () => router.push("/inventory"),
      badge: 0,
    },
    {
      title: t.ledger,
      icon: "book",
      Icon: Ionicons,
      onPress: () => router.push("/ledger"),
      badge: 0,
    },
    {
      title: "Orders",
      icon: "cart-outline",
      Icon: Ionicons,
      onPress: () => router.push("/orders"),
      badge: pendingCount,
    },
    {
      title: t.analytics,
      icon: "bar-chart-outline",
      Icon: Ionicons,
      onPress: () => router.push("/analytics"),
      badge: 0,
    },
    {
      title: t.support,
      icon: "headset-outline",
      Icon: Ionicons,
      onPress: handleSupport,
      badge: 0,
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={styles.actionTile}
          activeOpacity={0.7}
          onPress={action.onPress}
        >
          <View style={styles.iconWrapper}>
            <action.Icon
              name={action.icon as any}
              size={24}
              color="#1e4de4"
            />
            {/* 🔴 NEW ORDER BADGE / PILL */}
            {action.badge > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {action.badge > 99 ? "99+" : action.badge}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.actionTitle} numberOfLines={1}>
            {action.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    padding: 10,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  actionTile: {
    flex: 1,
    backgroundColor: "#f8f9fb",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    marginBottom: 6,
    height: 28,
    justifyContent: "center",
    position: "relative",
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#444",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -14,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
});
