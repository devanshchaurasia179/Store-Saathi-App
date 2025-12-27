import { View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";

export default function BillItemsList({ items, setItems }) {
  /* ---------- UPDATE QUANTITY ---------- */
  const updateQty = (id, delta) => {
    setItems(prev =>
      prev
        .map(i =>
          i.productId === id
            ? { ...i, quantity: i.quantity + delta }
            : i
        )
        .filter(i => i.quantity > 0)
    );
  };

  /* ---------- UPDATE PRICE ---------- */
  const updatePrice = (id, price) => {
    setItems(prev =>
      prev.map(i =>
        i.productId === id
          ? { ...i, price: Number(price) || 0 }
          : i
      )
    );
  };

  return (
    <View>
      {items.map(item => (
        <View key={item.productId} style={styles.row}>
          {/* PRODUCT INFO */}
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>

            {/* PRICE INPUT (INLINE) */}
            <View style={styles.priceRow}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                value={String(item.price)}
                keyboardType="numeric"
                onChangeText={(v) =>
                  updatePrice(item.productId, v)
                }
                style={styles.priceInput}
                selectTextOnFocus
              />
            </View>
          </View>

          {/* QUANTITY CONTROL */}
          <View style={styles.qty}>
            <TouchableOpacity
              onPress={() => updateQty(item.productId, -1)}
            >
              <Text style={styles.btn}>−</Text>
            </TouchableOpacity>

            <Text style={styles.qtyText}>{item.quantity}</Text>

            <TouchableOpacity
              onPress={() => updateQty(item.productId, 1)}
            >
              <Text style={styles.btn}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },

  name: {
    fontWeight: "700",
    fontSize: 14,
    color: "#1e293b",
    marginBottom: 6,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 6,
    alignSelf: "flex-start",
  },

  currency: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginRight: 2,
  },

  priceInput: {
    width: 60,
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
    paddingVertical: 4,
  },

  qty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  qtyText: {
    fontWeight: "700",
    minWidth: 20,
    textAlign: "center",
  },

  btn: {
    fontSize: 20,
    paddingHorizontal: 10,
    fontWeight: "700",
  },
});
