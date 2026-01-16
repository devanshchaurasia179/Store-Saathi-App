import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* 📦 COMPONENTS */
import InventoryMenu from "./InventoryMenu";
import EditProductModal from "./EditProductModal";

/* 🛠 API */
import { updateProduct, deleteProduct } from "../../constants/inventory.api";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_INVENTORY_ROW } from "../../constants/language_inventory";
import { useLanguage } from "../../providers/LanguageProvider";

const THEME_BLUE = "#1e3a8a";

export default function InventoryRow({ product: initialProduct, onRefresh }: any) {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_INVENTORY_ROW[language] || LANGUAGE_TEXT_INVENTORY_ROW.en;

  const [product, setProduct] = useState(initialProduct);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  /* ---------- EXPIRY LOGIC ---------- */
  const getExpiryDetails = () => {
    if (!product.expiryDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(product.expiryDate);
    
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: "Expired", color: "#ef4444", bg: "#fee2e2" };
    } else if (diffDays <= 15) {
      return { text: `Exp in ${diffDays}d`, color: "#f59e0b", bg: "#fef3c7" };
    } else {
      return { text: `Exp: ${expDate.toLocaleDateString()}`, color: "#64748b", bg: "#f1f5f9" };
    }
  };

  const expiry = getExpiryDetails();

  const handleUpdate = async (field: string, value: any, variantId?: string) => {
    try {
      let updatedPayload = {};
      let nextProductState = { ...product };

      if (variantId) {
        const updatedVariants = nextProductState.variants.map((v: any) => {
          if (v._id === variantId || v.id === variantId) {
            const newValue = Number(value);
            if (field === 'price') return { ...v, price: { ...v.price, sellingPrice: newValue } };
            return { ...v, [field]: newValue };
          }
          return v;
        });
        updatedPayload = { variants: updatedVariants };
        nextProductState.variants = updatedVariants;
      } else {
        const newValue = Number(value);
        if (field === 'price') {
          updatedPayload = { price: { ...product.price, sellingPrice: newValue } };
          nextProductState.price.sellingPrice = newValue;
        } else {
          updatedPayload = { [field]: newValue };
          nextProductState[field] = newValue;
        }
      }

      setProduct(nextProductState);
      await updateProduct(product._id, updatedPayload);
    } catch (error) {
      Alert.alert(t.errorTitle, "Update failed.");
      onRefresh();
    }
  };

  const hasVariants = product.variants && product.variants.length > 0;
  const mainStock = product.quantity || 0;
  const stockColor = mainStock === 0 ? "#ef4444" : mainStock < 10 ? "#f59e0b" : "#22c55e";

  return (
    <View style={styles.card}>
      <View style={styles.mainContent}>
        <View style={styles.topInfo}>
          <View style={styles.nameBlock}>
            <View style={[styles.statusIndicator, { backgroundColor: stockColor }]} />
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                {/* EXPIRY BADGE */}
                {expiry && (
                  <View style={[styles.expiryBadge, { backgroundColor: expiry.bg }]}>
                    <Text style={[styles.expiryText, { color: expiry.color }]}>{expiry.text}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.categorySubText}>
                {product.category || "General"} • {product.unit || "unit"}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.iconBtn}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {!hasVariants ? (
          <View style={styles.inlineControls}>
            <CompactInput 
              label="Price" value={String(product.price?.sellingPrice || 0)} 
              prefix="₹" onSave={(v: any) => handleUpdate('price', v)} 
            />
            <CompactInput 
              label="Stock" value={String(product.quantity || 0)} 
              onSave={(v: any) => handleUpdate('quantity', v)} 
            />
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.variantToggle, expanded && styles.variantToggleActive]} 
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={styles.variantToggleText}>
              <Ionicons name="layers-outline" size={12} /> {product.variants.length} Variants
            </Text>
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color="#64748b" />
          </TouchableOpacity>
        )}

        {hasVariants && expanded && (
          <View style={styles.variantsWrapper}>
            {product.variants.map((variant: any, idx: number) => (
              <View key={variant._id || idx} style={styles.variantRow}>
                <Text style={styles.variantName} numberOfLines={1}>{variant.name}</Text>
                <View style={styles.variantInputs}>
                  <CompactInput 
                    value={String(variant.price?.sellingPrice || 0)} 
                    prefix="₹" isSmall onSave={(v: any) => handleUpdate('price', v, variant._id || variant.id)} 
                  />
                  <CompactInput 
                    value={String(variant.quantity || 0)} 
                    isSmall onSave={(v: any) => handleUpdate('quantity', v, variant._id || variant.id)} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {menuOpen && (
        <View style={styles.menuArea}>
          <InventoryMenu
            onEdit={() => { setEditOpen(true); setMenuOpen(false); }}
            onDelete={() => {
              Alert.alert("Delete", "Delete this product?", [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: async () => { await deleteProduct(product._id); onRefresh(); }}
              ]);
            }}
          />
        </View>
      )}

      <EditProductModal visible={editOpen} product={product} onClose={() => setEditOpen(false)} onSaved={onRefresh} />
    </View>
  );
}

const CompactInput = ({ label, value, prefix, onSave, isSmall }: any) => {
  const [localVal, setLocalVal] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleBlur = async () => {
    if (localVal === value) return;
    setIsSaving(true);
    await onSave(localVal);
    setIsSaving(false);
  };

  return (
    <View style={[styles.compactInputBox, isSmall && styles.smallInputBox]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputInner, isSaving && { borderColor: THEME_BLUE }]}>
        {prefix && <Text style={styles.inputPrefix}>{prefix}</Text>}
        <TextInput
          value={String(localVal)}
          onChangeText={setLocalVal}
          onBlur={handleBlur}
          keyboardType="numeric"
          style={[styles.miniInput, isSmall && { fontSize: 12, height: 26 }]}
          selectTextOnFocus
        />
        {isSaving && <ActivityIndicator size="small" color={THEME_BLUE} style={{ marginLeft: 2 }} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", marginHorizontal: 10, marginVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: "#f1f5f9" },
  mainContent: { padding: 10 },
  topInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nameBlock: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, paddingRight: 5 },
  statusIndicator: { width: 3, height: 18, borderRadius: 2, marginRight: 8 },
  productName: { fontSize: 14, fontWeight: "700", color: "#1e293b", flex: 1 },
  categorySubText: { fontSize: 10, color: "#94a3b8", fontWeight: "500" },
  expiryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  expiryText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase" },
  iconBtn: { padding: 4 },
  inlineControls: { flexDirection: "row", gap: 8, marginTop: 8 },
  variantToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  variantToggleActive: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, backgroundColor: '#eff6ff' },
  variantToggleText: { fontSize: 11, fontWeight: '700', color: THEME_BLUE },
  variantsWrapper: { backgroundColor: "#fff", borderWidth: 1, borderColor: '#e2e8f0', borderTopWidth: 0, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, paddingHorizontal: 8 },
  variantRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  variantName: { fontSize: 12, fontWeight: "600", color: "#475569", flex: 1 },
  variantInputs: { flexDirection: "row", gap: 6 },
  compactInputBox: { flex: 1 },
  smallInputBox: { flex: 0, width: 85 },
  inputLabel: { fontSize: 8, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: 2 },
  inputInner: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 6, paddingHorizontal: 6 },
  inputPrefix: { fontSize: 11, fontWeight: "800", color: "#cbd5e1", marginRight: 1 },
  miniInput: { flex: 1, height: 30, fontSize: 13, fontWeight: "700", color: "#334155", padding: 0 },
  menuArea: { borderTopWidth: 1, borderTopColor: "#f1f5f9" },
});