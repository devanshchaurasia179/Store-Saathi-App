import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* 🛠 API & UTILS */
import { createProduct, updateProduct } from "../../constants/inventory.api";
import { generateBarcode } from "../../utils/generateBarcode";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_PRODUCT_FORM } from "../../constants/language_inventory";
import { useLanguage } from "../../providers/LanguageProvider";

/* 🆕 UNIT OPTIONS */
const UNIT_OPTIONS = [
  { label: "Unit / Pcs", value: "unit", icon: "cube-outline" },
  { label: "Kilogram (kg)", value: "kg", icon: "scale-outline" },
  { label: "Gram (g)", value: "g", icon: "beaker-outline" },
  { label: "Litre (L)", value: "litre", icon: "water-outline" },
  { label: "Millilitre (ml)", value: "ml", icon: "color-fill-outline" },
  { label: "Box", value: "box", icon: "archive-outline" },
  { label: "Pack", value: "pack", icon: "gift-outline" },
  { label: "Dozen", value: "dozen", icon: "grid-outline" },
];

const DEFAULT_FORM = {
  name: "",
  barcode: "",
  isBarcodeListed: true,
  isTrackable: true,
  price: { sellingPrice: "" },
  quantity: 0,
  unit: "unit",
  category: "Other",
  size: "",
  expiryDate: "",
  isActive: true,
};

type Props = {
  onSuccess?: () => void;
  initialData?: any;
};

export default function ProductForm({ onSuccess, initialData }: Props) {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_PRODUCT_FORM[language] || LANGUAGE_TEXT_PRODUCT_FORM.en;

  const [form, setForm] = useState(DEFAULT_FORM);
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(false);
  
  /* 🆕 DROPDOWN STATE */
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!initialData) {
      setForm((f) => ({ ...f, barcode: generateBarcode() }));
      return;
    }

    setForm({
      name: initialData.name || "",
      barcode: initialData.barcode || "",
      isBarcodeListed: initialData.isBarcodeListed ?? true,
      isTrackable: initialData.isTrackable ?? true,
      price: { sellingPrice: initialData.price?.sellingPrice ?? "" },
      quantity: initialData.quantity ?? 0,
      unit: initialData.unit || "unit",
      category: initialData.category || "Other",
      size: initialData.size || "",
      expiryDate: initialData.expiryDate ? initialData.expiryDate.slice(0, 10) : "",
      isActive: initialData.isActive ?? true,
    });

    setShowMore(true);
  }, [initialData]);

  const update = (key: string, value: any) =>
    setForm((f: any) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name || !form.price.sellingPrice) {
      Alert.alert(t.requiredFields, t.requiredMsg);
      return;
    }

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      price: { sellingPrice: Number(form.price.sellingPrice) },
      expiryDate: form.expiryDate || null,
    };

    try {
      setLoading(true);
      if (initialData) {
        await updateProduct(initialData._id, payload);
      } else {
        await createProduct(payload);
        setForm(DEFAULT_FORM);
      }
      onSuccess?.();
    } catch (e: any) {
      Alert.alert(
        t.errorTitle || "Error",
        e?.response?.status === 409 ? t.errorBarcode : t.errorSave
      );
    } finally {
      setLoading(false);
    }
  };

  // Find the label of the currently selected unit for the button display
  const selectedUnitLabel = UNIT_OPTIONS.find(u => u.value === form.unit)?.label || "Select Unit";

  return (
    <ScrollView 
      style={{ flex: 1 }} 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* BASIC INFO SECTION */}
      <View style={styles.card}>
        <Field
          label={t.productName}
          icon="cart-outline"
          value={form.name}
          placeholder={t.namePlace}
          onChange={(v: string) => update("name", v)}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field
              label={t.sellingPrice}
              icon="cash-outline"
              value={String(form.price.sellingPrice)}
              keyboard="numeric"
              placeholder="0.00"
              onChange={(v: string) => update("price", { sellingPrice: v })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label={t.openingStock}
              icon="layers-outline"
              value={String(form.quantity)}
              keyboard="numeric"
              placeholder="0"
              onChange={(v: string) => update("quantity", v)}
            />
          </View>
        </View>

        {/* 🆕 CUSTOM DROPDOWN BUTTON */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{t.unit || "UNIT"}</Text>
          
          <TouchableOpacity 
            style={[styles.dropdownTrigger, isDropdownOpen && styles.dropdownTriggerActive]} 
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            activeOpacity={0.7}
          >
            <View style={styles.triggerInner}>
              <Ionicons name="options-outline" size={20} color={isDropdownOpen ? "#2563eb" : "#94a3b8"} />
              <Text style={styles.triggerText}>{selectedUnitLabel}</Text>
            </View>
            <Ionicons 
              name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#94a3b8" 
            />
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={styles.dropdownMenu}>
              {UNIT_OPTIONS.map((u) => {
                const isActive = form.unit === u.value;
                return (
                  <TouchableOpacity
                    key={u.value}
                    style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                    onPress={() => {
                      update("unit", u.value);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Ionicons 
                      name={u.icon as any} 
                      size={20} 
                      color={isActive ? "#2563eb" : "#64748b"} 
                    />
                    <Text style={[styles.dropdownItemText, isActive && styles.dropdownItemTextActive]}>
                      {u.label}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={18} color="#2563eb" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* BARCODE SECTION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t.identification}</Text>
        <View style={styles.barcodeWrapper}>
          <View
            style={[
              styles.inputContainer,
              { flex: 1, marginBottom: 0 },
              initialData && styles.disabledInput,
            ]}
          >
            <Ionicons name="barcode-outline" size={20} color="#94a3b8" />
            <TextInput
              value={form.barcode}
              editable={!initialData}
              style={styles.input}
              placeholder={t.barcode}
            />
          </View>
          {!initialData && (
            <TouchableOpacity
              style={styles.regenBtn}
              onPress={() => update("barcode", generateBarcode())}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>{t.printBarcode}</Text>
          <Switch
            value={form.isBarcodeListed}
            onValueChange={(v) => update("isBarcodeListed", v)}
            trackColor={{ false: "#e2e8f0", true: "#93c5fd" }}
            thumbColor={form.isBarcodeListed ? "#2563eb" : "#f4f3f4"}
          />
        </View>
      </View>

      {/* ADDITIONAL DETAILS TOGGLE */}
      <TouchableOpacity
        style={styles.moreHeader}
        onPress={() => setShowMore(!showMore)}
      >
        <Text style={styles.moreTitle}>{t.additionalDetails}</Text>
        <Ionicons
          name={showMore ? "chevron-up" : "chevron-down"}
          size={20}
          color="#2563eb"
        />
      </TouchableOpacity>

      {showMore && (
        <View style={styles.card}>
          <Field
            label={t.category}
            icon="grid-outline"
            value={form.category}
            placeholder={t.catPlace}
            onChange={(v: string) => update("category", v)}
          />
          <Field
            label={t.sizeVariant}
            icon="resize-outline"
            value={form.size}
            placeholder={t.sizePlace}
            onChange={(v: string) => update("size", v)}
          />
          <Toggle
            label={t.enableTracking}
            value={form.isTrackable}
            onChange={(v: boolean) => update("isTrackable", v)}
          />
        </View>
      )}

      {/* SUBMIT BUTTON */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={[styles.submit, loading && styles.submitDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {initialData ? t.updateProduct : t.saveProduct}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------- UI HELPERS ---------- */

const Field = ({ label, value, onChange, keyboard, icon, placeholder }: any) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={20} color="#94a3b8" />
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        style={styles.input}
      />
    </View>
  </View>
);

const Toggle = ({ label, value, onChange }: any) => (
  <View style={styles.toggleRow}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: "#e2e8f0", true: "#93c5fd" }}
      thumbColor={value ? "#2563eb" : "#f4f3f4"}
    />
  </View>
);

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 2 },
    }),
  },
  row: { flexDirection: "row", gap: 12 },
  fieldContainer: { marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  disabledInput: { backgroundColor: "#f1f5f9" },

  /* 🆕 CUSTOM DROPDOWN CSS-ONLY STYLES */
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
  },
  dropdownTriggerActive: {
    borderColor: "#2563eb",
    backgroundColor: "#fff",
  },
  triggerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  triggerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 8,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 4 },
    }),
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  dropdownItemActive: {
    backgroundColor: "#f0f7ff",
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
  dropdownItemTextActive: {
    color: "#2563eb",
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94a3b8",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  barcodeWrapper: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  regenBtn: {
    backgroundColor: "#1e3a8a",
    height: 52,
    width: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 14, fontWeight: "700", color: "#334155" },
  moreHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    marginBottom: 10,
  },
  moreTitle: { color: "#2563eb", fontWeight: "800", fontSize: 14 },
  submit: {
    backgroundColor: "#1e3a8a",
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  submitDisabled: { backgroundColor: "#94a3b8" },
  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 0.5,
  },
});