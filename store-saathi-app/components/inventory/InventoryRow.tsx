import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import InventoryMenu from "./InventoryMenu";
import EditProductModal from "./EditProductModal";
import { updateProduct, deleteProduct } from "../../constants/inventory.api";

const LOW_STOCK_LIMIT = 5;

export default function InventoryRow({ product, onRefresh }: any) {
  const [qty, setQty] = useState(product.quantity || 0);
  const [price, setPrice] = useState(product.price?.sellingPrice || 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ---------- STOCK STATUS ---------- */
  let status = { text: "In Stock", color: "#16a34a", bg: "#dcfce7" };
  if (qty == 0) status = { text: "Out of Stock", color: "#dc2626", bg: "#fee2e2" };
  else if (qty <= LOW_STOCK_LIMIT)
    status = { text: "Low Stock", color: "#ca8a04", bg: "#fef9c3" };

  /* ---------- INLINE UPDATES ---------- */
  const saveQuantity = async () => {
    if (qty === product.quantity) return;
    try {
      setSaving(true);
      await updateProduct(product._id, { quantity: Number(qty) });
    } catch {
      Alert.alert("Error", "Failed to update stock");
      setQty(product.quantity);
    } finally {
      setSaving(false);
    }
  };

  const savePrice = async () => {
    if (price === product.price?.sellingPrice) return;
    try {
      setSaving(true);
      await updateProduct(product._id, {
        price: { sellingPrice: Number(price) },
      });
    } catch {
      Alert.alert("Error", "Failed to update price");
      setPrice(product.price?.sellingPrice);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete Product", `Remove ${product.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteProduct(product._id);
          onRefresh();
        },
      },
    ]);
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.row}>
          {/* PRODUCT INFO */}
          <View style={{ flex: 1.2 }}>
            <Text style={styles.name} numberOfLines={1}>
              {product.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.badgeText, { color: status.color }]}>
                {status.text}
              </Text>
            </View>
          </View>

          {/* PRICE CONTROL */}
          <View style={styles.inputCol}>
            <Text style={styles.label}>PRICE</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                value={String(price)}
                keyboardType="numeric"
                onChangeText={setPrice}
                onBlur={savePrice}
                style={styles.input}
                selectTextOnFocus
              />
            </View>
          </View>

          {/* STOCK CONTROL */}
          <View style={styles.inputCol}>
            <Text style={styles.label}>STOCK</Text>
            <View style={styles.inputContainer}>
              <TextInput
                value={String(qty)}
                keyboardType="numeric"
                onChangeText={setQty}
                onBlur={saveQuantity}
                style={[styles.input, { paddingLeft: 0 }]}
                selectTextOnFocus
              />
            </View>
          </View>

          {/* MENU BUTTON */}
          <TouchableOpacity 
            onPress={() => setMenuOpen((p) => !p)}
            style={styles.moreButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {menuOpen && (
          <View style={styles.menuWrapper}>
            <InventoryMenu
              onEdit={() => {
                setEditOpen(true);
                setMenuOpen(false);
              }}
              onDelete={confirmDelete}
            />
          </View>
        )}
      </View>

      <EditProductModal
        visible={editOpen}
        product={product}
        onClose={() => setEditOpen(false)}
        onSaved={onRefresh}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    // Modern shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 8,
  },
  name: { 
    fontWeight: "700", 
    fontSize: 15, 
    color: "#1e293b",
    marginBottom: 4 
  },
  badge: { 
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: "flex-start", 
    paddingHorizontal: 8, 
    paddingVertical: 2,
    borderRadius: 6 
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: { 
    fontSize: 10, 
    fontWeight: "800",
    textTransform: 'uppercase' 
  },
  inputCol: { 
    alignItems: "center",
    justifyContent: 'center',
  },
  label: { 
    fontSize: 9, 
    fontWeight: "800", 
    color: "#64748b",
    marginBottom: 4,
    letterSpacing: 0.5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 6,
  },
  currency: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginRight: 2,
  },
  input: {
    width: 44,
    textAlign: "center",
    fontWeight: "700",
    color: '#1e293b',
    paddingVertical: 6,
    fontSize: 13,
  },
  moreButton: {
    padding: 4,
    marginLeft: 4,
  },
  menuWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fafafa',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  }
});