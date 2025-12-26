import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
      import { router } from "expo-router";
export default function LowStockList({ items }: any) {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.cardContainer}>
      {/* 1. Refined Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#f97316" />
          <Text style={styles.headerText}>Low Stock</Text>
        </View>
        <Text style={styles.qtyLabel}>Qty left</Text>
      </View>

      {/* 2. List of Items with Balanced Spacing */}
      {items.map((item: any, index: number) => (
        <View key={index} style={styles.itemRow}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
        </View>
      ))}

      {/* 3. Primary Action Link */}


<TouchableOpacity
  style={styles.footerButton}
  onPress={() => router.push("/inventory")}
>
  <Text style={styles.footerText}>Update inventory →</Text>
</TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 12, // Consistent with dashboard grid
    marginTop: 12,
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
  qtyLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff5f5", // Thematic light red for alerts
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 15,
    color: "#444",
    fontWeight: "500",
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: "800",
    color: "#d32f2f", // High-visibility red for zero stock
  },
  footerButton: {
    marginTop: 6,
    paddingVertical: 4,
  },
  footerText: {
    color: "#1e4de4", // Brand primary blue
    fontSize: 14,
    fontWeight: "700",
  },
});