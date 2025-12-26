import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function QuickActions() {
  const actions = [
    {
      title: "Inventory",
      icon: "cube-outline",
      Icon: Ionicons,
      onPress: () => router.push("/inventory"), // ✅ FIXED
    },
    {
      title: "Ledger",
      icon: "account-group-outline",
      Icon: MaterialCommunityIcons,
      onPress: () => router.push("/ledger"),
    },
    {
      title: "Analytics",
      icon: "bar-chart-outline",
      Icon: Ionicons,
      onPress: () => {
        // wire later
      },
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
              size={26}
              color="#1e4de4"
            />
          </View>
          <Text style={styles.actionTitle}>
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
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
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
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    marginBottom: 8,
    height: 32,
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#444",
  },
});
