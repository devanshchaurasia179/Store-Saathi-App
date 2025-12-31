import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* ---------------- HELPERS ---------------- */

/**
 * Normalizes units from the Mongoose enum to internal logical types.
 * We treat "kg" and "litre" as the "Base Units" for math.
 * All other discrete types (unit, box, pack, dozen) are treated as 1:1.
 */
const getNormalizedInventoryUnit = (unit?: string) => {
  if (!unit) return "unit";
  const u = unit.toLowerCase();

  // Volume & Weight Groups: Map sub-units to Base Units
  if (u === "kg" || u === "g") return "kg";
  if (u === "litre" || u === "ml") return "litre";
  
  // Discrete Groups: (unit, box, pack, dozen) 
  // We return these exactly as they appear in your Mongoose enum
  if (["box", "pack", "dozen", "unit"].includes(u)) return u;

  return "unit";
};

/**
 * Converts internal storage (Base Units) to Display Units.
 * Logic: 
 * - If display is 'g' or 'ml', multiply by 1000.
 * - For box, pack, dozen, unit, it is 1:1.
 */
const getDisplayQuantity = (internalQty: number, displayUnit: string): number => {
  const u = displayUnit.toLowerCase();
  if (u === "g" || u === "ml") return internalQty * 1000;
  return internalQty;
};

/**
 * Converts Display Units back to internal storage (Base Units).
 * Logic:
 * - If input is 'g' or 'ml', divide by 1000 to save as 'kg' or 'litre'.
 */
const getInternalQuantity = (displayQty: number, displayUnit: string): number => {
  const u = displayUnit.toLowerCase();
  if (u === "g" || u === "ml") return displayQty / 1000;
  return displayQty;
};

/* ---------------- SUB-COMPONENTS ---------------- */

const QuantityInput = ({ item, onUpdate }) => {
  const invU = getNormalizedInventoryUnit(item.unit);
  const dispU = item.displayUnit || invU;
  const initialDisplay = getDisplayQuantity(item.quantity || 0, dispU);
  
  const [localValue, setLocalValue] = useState(initialDisplay.toString());

  // Keep local input in sync with external state changes (like stepper clicks)
  useEffect(() => {
    setLocalValue(initialDisplay === 0 ? "" : initialDisplay.toString());
  }, [item.quantity, item.displayUnit]);

  const handleChangeText = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    // Prevent multiple decimals
    if ((cleaned.match(/\./g) || []).length > 1) return;
    
    setLocalValue(cleaned);

    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      onUpdate(getInternalQuantity(num, dispU));
    } else if (cleaned === "") {
      onUpdate(0);
    }
  };

  return (
    <TextInput
      value={localValue}
      onChangeText={handleChangeText}
      keyboardType="decimal-pad"
      style={styles.qtyInput}
      placeholder="0"
      placeholderTextColor="#94a3b8"
      selectTextOnFocus
    />
  );
};

/* ---------------- MAIN COMPONENT ---------------- */

export default function BillItemsList({ items, setItems }) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const updateQuantityByDelta = (id: string, deltaDisplay: number) => {
    setItems(prev => prev.map(i => {
      if (i.productId !== id) return i;
      const invU = getNormalizedInventoryUnit(i.unit);
      const dispU = i.displayUnit || invU;
      
      const currentDisplay = getDisplayQuantity(i.quantity || 0, dispU);
      const newDisplay = Math.max(0, currentDisplay + deltaDisplay);
      
      // Fixed decimal precision to avoid floating point math errors (e.g., 0.300000000004)
      const roundedDisplay = parseFloat(newDisplay.toFixed(2));
      
      return { 
        ...i, 
        quantity: getInternalQuantity(roundedDisplay, dispU) 
      };
    }).filter(i => i.quantity > 0)); // Remove items if quantity hits 0 via stepper
  };

  const updatePrice = (id: string, price: string) => {
    const clean = price.replace(/[^0-9.]/g, "");
    setItems(prev => prev.map(i => (i.productId === id ? { ...i, price: clean } : i)));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.productId !== id));
  };

  const renderItem = ({ item }) => {
    const invU = getNormalizedInventoryUnit(item.unit);
    const dispU = item.displayUnit || invU;
    
    // Logic for available sub-units
    const allowedUnits = invU === "kg" ? ["kg", "g"] : 
                         invU === "litre" ? ["litre", "ml"] : ["unit"];
    const canChangeUnit = allowedUnits.length > 1;
    
    const total = (Number(item.price || 0) * (item.quantity || 0)).toFixed(2);

    return (
      <View style={[styles.card, { zIndex: openDropdownId === item.productId ? 100 : 1 }]}>
        {/* TOP ROW: Name, Total, and Delete */}
        <View style={styles.topRow}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.totalBadge}>
             <Text style={styles.totalAmount}>₹{total}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => removeItem(item.productId)} 
            style={styles.miniDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        {/* BOTTOM ROW: Price Box, Multiplier, Qty Box, Stepper */}
        <View style={styles.controlsRow}>
          
          {/* PRICE INPUT BOX */}
          <View style={styles.priceBox}>
            <Text style={styles.currencyLabel}>₹</Text>
            <TextInput
              value={String(item.price || "")}
              onChangeText={(v) => updatePrice(item.productId, v)}
              keyboardType="decimal-pad"
              style={styles.priceInput}
              placeholder="0"
            />
          </View>

          <Text style={styles.operator}>×</Text>

          {/* QUANTITY & UNIT BOX */}
          <View style={styles.qtyBox}>
            <QuantityInput 
              item={item} 
              onUpdate={(val) => setItems(prev => prev.map(i => i.productId === item.productId ? { ...i, quantity: val } : i))} 
            />
            
            <View style={styles.unitContainer}>
              <Text style={styles.unitText}>{dispU}</Text>
              {canChangeUnit && (
                <TouchableOpacity 
                  onPress={() => setOpenDropdownId(openDropdownId === item.productId ? null : item.productId)}
                  style={styles.dropdownToggle}
                >
                  <Ionicons 
                    name={openDropdownId === item.productId ? "chevron-up" : "chevron-down"} 
                    size={12} 
                    color="#0369a1" 
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* DROPDOWN MENU */}
            {openDropdownId === item.productId && (
              <View style={styles.dropdown}>
                {allowedUnits.map((u, index) => (
                  <TouchableOpacity 
                    key={u} 
                    onPress={() => {
                      setItems(prev => prev.map(i => i.productId === item.productId ? { ...i, displayUnit: u } : i));
                      setOpenDropdownId(null);
                    }} 
                    style={[styles.dropItem, index === allowedUnits.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <Text style={[styles.dropText, dispU === u && styles.dropActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* STEPPER CONTROLS */}
          <View style={styles.stepper}>
            <TouchableOpacity 
              onPress={() => updateQuantityByDelta(item.productId, dispU === "unit" ? -1 : -0.1)} 
              style={styles.stepBtn}
            >
              <Ionicons name="remove" size={16} color="#64748b" />
            </TouchableOpacity>
            <View style={styles.stepDivider} />
            <TouchableOpacity 
              onPress={() => updateQuantityByDelta(item.productId, dispU === "unit" ? 1 : 0.1)} 
              style={styles.stepBtn}
            >
              <Ionicons name="add" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={i => i.productId}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 12, paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    // Elevation/Shadow
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 3 },
      android: { elevation: 2 }
    })
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: { 
    flex: 1, 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#334155',
    letterSpacing: -0.2
  },
  totalBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  totalAmount: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#0f172a' 
  },
  miniDelete: { 
    padding: 2 
  },
  
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  
  /* Price Box Styles */
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 34,
    width: 85,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  currencyLabel: { 
    fontSize: 11, 
    color: '#94a3b8', 
    fontWeight: '700',
    marginRight: 2 
  },
  priceInput: { 
    flex: 1, 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#475569', 
    padding: 0 
  },
  
  operator: { 
    fontSize: 12, 
    color: '#cbd5e1', 
    marginHorizontal: 4,
    fontWeight: '600'
  },

  /* Quantity Box Styles */
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    paddingLeft: 8,
    height: 34,
    flex: 1,
    maxWidth: 130,
    borderWidth: 1,
    borderColor: '#bae6fd',
    position: 'relative', // Critical for dropdown positioning
  },
  qtyInput: { 
    flex: 1, 
    fontSize: 13, 
    fontWeight: '700', 
    color: '#0369a1', 
    textAlign: 'left', 
    padding: 0 
  },
  unitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    height: '100%',
    paddingHorizontal: 6,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
    borderLeftWidth: 1,
    borderLeftColor: '#bae6fd',
  },
  unitText: { 
    fontSize: 10, 
    fontWeight: '800', 
    color: '#0369a1', 
    textTransform: 'uppercase' 
  },
  dropdownToggle: {
    marginLeft: 4,
    padding: 2,
  },

  /* Stepper Styles */
  stepper: {
    flexDirection: 'row',
    marginLeft: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#e2e8f0'
  },

  /* Dropdown Styles */
  dropdown: {
    position: 'absolute',
    top: 38,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 80,
    zIndex: 999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 8 }
    })
  },
  dropItem: { 
    paddingVertical: 10, 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  dropText: { 
    fontSize: 11, 
    color: '#64748b', 
    fontWeight: '600' 
  },
  dropActive: { 
    color: '#3b82f6', 
    fontWeight: '800' 
  }
});