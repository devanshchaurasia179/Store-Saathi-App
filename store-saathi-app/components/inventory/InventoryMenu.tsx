import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InventoryMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

export default function InventoryMenu({ onEdit, onDelete }: InventoryMenuProps) {
  return (
    <View style={styles.menuContainer}>
      {/* EDIT ACTION */}
      <TouchableOpacity 
        style={styles.actionItem} 
        onPress={onEdit}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBadge, { backgroundColor: '#eff6ff' }]}>
          <Ionicons name="pencil" size={16} color="#2563eb" />
        </View>
        <Text style={[styles.actionText, { color: '#1e40af' }]}>Edit Product</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* DELETE ACTION */}
      <TouchableOpacity 
        style={styles.actionItem} 
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBadge, { backgroundColor: '#fef2f2' }]}>
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
        </View>
        <Text style={[styles.actionText, { color: '#991b1b' }]}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa", // Slightly different from white to show it's a sub-menu
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingVertical: 12,
  },
  actionItem: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "#e2e8f0",
  },
});