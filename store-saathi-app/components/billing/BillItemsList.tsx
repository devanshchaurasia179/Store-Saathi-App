import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  FlatList 
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BillItemsList({ items, setItems }) {
  
  const updateQty = (id, delta) => {
    setItems(prev =>
      prev
        .map(i => i.productId === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
    );
  };

  const updatePrice = (id, price) => {
    const cleanPrice = price.replace(/[^0-9.]/g, '');
    setItems(prev => prev.map(i => i.productId === id ? { ...i, price: cleanPrice } : i));
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(i => i.productId !== id));
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* LEFT: INFO SECTION */}
      <View style={styles.leftContent}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        
        <View style={styles.priceRow}>
          <View style={styles.priceInputWrapper}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              value={String(item.price)}
              keyboardType="decimal-pad"
              onChangeText={(v) => updatePrice(item.productId, v)}
              style={styles.priceInput}
              selectTextOnFocus
            />
          </View>
          <Text style={styles.multiply}>×</Text>
          <Text style={styles.qtyLabel}>{item.quantity}</Text>
          <Text style={styles.equals}>=</Text>
          <Text style={styles.rowTotal}>₹{(Number(item.price) * item.quantity).toFixed(0)}</Text>
        </View>
      </View>

      {/* RIGHT: CONTROLS SECTION */}
      <View style={styles.rightContent}>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQty(item.productId, -1)}
          >
            <Ionicons name="remove" size={14} color="#64748b" />
          </TouchableOpacity>

          <Text style={styles.qtyText}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => updateQty(item.productId, 1)}
          >
            <Ionicons name="add" size={14} color="#64748b" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => removeItem(item.productId)}
          style={styles.deleteBtn}
        >
          <Ionicons name="trash-outline" size={14} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.productId}
      contentContainerStyle={styles.listPadding}
      showsVerticalScrollIndicator={false}
      style={{ flex: 1 }} 
    />
  );
}

const styles = StyleSheet.create({
  listPadding: {
    paddingBottom: 80,
    paddingTop: 4,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
  },
  name: {
    fontWeight: "700",
    fontSize: 13,
    color: "#1e293b",
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 4,
  },
  currency: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94a3b8",
  },
  priceInput: {
    minWidth: 40,
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    paddingVertical: 2,
    marginLeft: 1,
  },
  multiply: {
    fontSize: 10,
    color: "#94a3b8",
    marginHorizontal: 4,
  },
  qtyLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  equals: {
    fontSize: 10,
    color: "#94a3b8",
    marginHorizontal: 4,
  },
  rowTotal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 2,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
    paddingHorizontal: 8,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: '#fff1f2',
    borderRadius: 8,
  },
});