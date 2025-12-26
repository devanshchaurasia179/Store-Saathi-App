import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  onAddProduct: () => void;
  onQuickEntry: () => void;
  onBack?: () => void;
};

export default function InventoryHeader({
  onAddProduct,
  onQuickEntry,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 12 },
      ]}
    >
      {/* Top Navigation Row */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={onBack ?? (() => router.back())}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Inventory</Text>
          <Text style={styles.subtitle}>Manage stock & prices easily</Text>
        </View>

        {/* Empty view for flex balancing to keep title centered */}
        <View style={{ width: 40 }} />
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actions}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.whiteBtn}
            onPress={onAddProduct}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={18} color="#2563eb" />
            <Text style={styles.whiteText}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.blueBtn}
            onPress={onQuickEntry}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={18} color="#fff" />
            <Text style={styles.blueText}>Quick Entry</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.darkBtn}
          onPress={() => router.push("/barcodes")}
          activeOpacity={0.8}
        >
          <Ionicons name="barcode-outline" size={20} color="#fff" />
          <Text style={styles.blueText}>Generate Barcode Sheet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e3a8a", // Blue-600 theme
    paddingBottom: 28,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#bfdbfe",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  actions: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  whiteBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 2,
  },
  blueBtn: {
    flex: 1,
    backgroundColor: "#1e40af", // Slightly darker blue for contrast
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  darkBtn: {
    backgroundColor: "rgba(0, 0, 0, 0.15)", // Translucent dark
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  whiteText: {
    color: "#2563eb",
    fontWeight: "800",
    fontSize: 14,
  },
  blueText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});