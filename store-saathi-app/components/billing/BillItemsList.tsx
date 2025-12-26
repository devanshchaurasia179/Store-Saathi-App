import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function BillItemsList({ items, setItems }) {
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

  return (
    <View>
      {items.map(item => (
        <View key={item.productId} style={styles.row}>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text>₹{item.price}</Text>
          </View>

          <View style={styles.qty}>
            <TouchableOpacity onPress={() => updateQty(item.productId, -1)}>
              <Text style={styles.btn}>−</Text>
            </TouchableOpacity>
            <Text>{item.quantity}</Text>
            <TouchableOpacity onPress={() => updateQty(item.productId, 1)}>
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
    justifyContent: "space-between",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  name: { fontWeight: "600" },
  qty: { flexDirection: "row", gap: 12, alignItems: "center" },
  btn: { fontSize: 18, paddingHorizontal: 8 },
});
