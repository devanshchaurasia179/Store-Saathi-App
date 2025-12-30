import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_QUICK_ACTIONS } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

export default function QuickActions() {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_QUICK_ACTIONS[language] || LANGUAGE_TEXT_QUICK_ACTIONS.en;

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
    },
    {
      title: t.ledger,
      icon: "account-group-outline",
      Icon: MaterialCommunityIcons,
      onPress: () => router.push("/ledger"),
    },
    {
      title: t.analytics,
      icon: "bar-chart-outline",
      Icon: Ionicons,
      onPress: () => router.push("/analytics"),
    },
    {
      title: t.support,
      icon: "headset-outline",
      Icon: Ionicons,
      onPress: handleSupport,
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
              size={24} // Adjusted size slightly to fit 4 items
              color="#1e4de4"
            />
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
    padding: 12, // Slightly reduced padding for 4 items
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8, // Tighter gap for better fit
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
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    marginBottom: 6,
    height: 28,
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 11, // Reduced font size to ensure text doesn't overflow on small screens
    fontWeight: "700",
    color: "#444",
  },
});