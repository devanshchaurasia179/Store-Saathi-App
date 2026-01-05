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
import DateTimePicker from "@react-native-community/datetimepicker";

/* 🛠 API & UTILS */
import { createProduct, updateProduct } from "../../constants/inventory.api";
import { generateBarcode } from "../../utils/generateBarcode";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_PRODUCT_FORM } from "../../constants/language_inventory";
import { useLanguage } from "../../providers/LanguageProvider";

const THEME_BLUE = "#1e3a8a";

const UNIT_OPTIONS = [
  { label: "Unit / Pcs", value: "unit", icon: "cube-outline" },
  { label: "Kilogram (kg)", value: "kg", icon: "scale-outline" },
  { label: "Litre (L)", value: "litre", icon: "water-outline" },
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
  expiryDate: null as Date | null, // Changed to Date object for picker
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate) : null,
      isActive: initialData.isActive ?? true,
    });

    setShowMore(true);
  }, [initialData]);

  const update = (key: string, value: any) =>
    setForm((f: any) => ({ ...f, [key]: value }));

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // iOS keeps it open
    if (selectedDate) {
      update("expiryDate", selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price.sellingPrice) {
      Alert.alert(t.requiredFields, t.requiredMsg);
      return;
    }

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      price: { sellingPrice: Number(form.price.sellingPrice) },
      // Convert Date object to ISO string for Backend
      expiryDate: form.expiryDate ? form.expiryDate.toISOString() : null,
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

  const selectedUnit = UNIT_OPTIONS.find(u => u.value === form.unit);

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f8fafc' }} 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t.productDetails || "Product Details"}</Text>
        
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
              isPrice={true}
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

        {/* EXPIRY DATE SELECTOR */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{t.expiryDate || "EXPIRY DATE"}</Text>
          <TouchableOpacity 
            style={styles.dropdownTrigger} 
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.triggerInner}>
              <Ionicons name="calendar-outline" size={20} color={THEME_BLUE} />
              <Text style={[styles.triggerText, !form.expiryDate && { color: '#94a3b8' }]}>
                {form.expiryDate ? form.expiryDate.toLocaleDateString() : (t.selectDate || "Select Expiry Date")}
              </Text>
            </View>
            {form.expiryDate && (
                <TouchableOpacity onPress={() => update("expiryDate", null)}>
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
            )}
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={form.expiryDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{t.unit || "UNIT"}</Text>
          <TouchableOpacity 
            style={[styles.dropdownTrigger, isDropdownOpen && styles.dropdownTriggerActive]} 
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <View style={styles.triggerInner}>
              <Ionicons name={selectedUnit?.icon as any || "options-outline"} size={20} color={THEME_BLUE} />
              <Text style={styles.triggerText}>{selectedUnit?.label || "Select Unit"}</Text>
            </View>
            <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color="#94a3b8" />
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
                    <Ionicons name={u.icon as any} size={20} color={isActive ? "#fff" : "#64748b"} />
                    <Text style={[styles.dropdownItemText, isActive && styles.dropdownItemTextActive]}>{u.label}</Text>
                    {isActive && <Ionicons name="checkmark-circle" size={18} color="#fff" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t.identification}</Text>
        <View style={styles.barcodeWrapper}>
          <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }, initialData && styles.disabledInput]}>
            <Ionicons name="barcode-outline" size={20} color={THEME_BLUE} />
            <TextInput
              value={form.barcode}
              editable={!initialData}
              style={styles.input}
              placeholder={t.barcode}
              placeholderTextColor="#94a3b8"
            />
          </View>
          {!initialData && (
            <TouchableOpacity style={styles.regenBtn} onPress={() => update("barcode", generateBarcode())}>
              <Ionicons name="refresh" size={22} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.toggleCard}>
          <View style={styles.toggleRowInner}>
            <Ionicons name="print-outline" size={20} color={THEME_BLUE} />
            <Text style={styles.toggleLabel}>{t.printBarcode}</Text>
          </View>
          <Switch
            value={form.isBarcodeListed}
            onValueChange={(v) => update("isBarcodeListed", v)}
            trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
            thumbColor={form.isBarcodeListed ? THEME_BLUE : "#f4f3f4"}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.moreHeader}
        onPress={() => setShowMore(!showMore)}
      >
        <Text style={styles.moreTitle}>{t.additionalDetails}</Text>
        <Ionicons name={showMore ? "chevron-up" : "chevron-down"} size={18} color={THEME_BLUE} />
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
          
          <View style={[styles.toggleCard, { marginTop: 8 }]}>
            <View style={styles.toggleRowInner}>
              <Ionicons name="stats-chart-outline" size={20} color={THEME_BLUE} />
              <Text style={styles.toggleLabel}>{t.enableTracking}</Text>
            </View>
            <Switch
              value={form.isTrackable}
              onValueChange={(v: boolean) => update("isTrackable", v)}
              trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
              thumbColor={form.isTrackable ? THEME_BLUE : "#f4f3f4"}
            />
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={[styles.submit, loading && styles.submitDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name={initialData ? "save-outline" : "add-circle-outline"} size={22} color="#fff" style={{marginRight: 8}} />
            <Text style={styles.submitText}>
                {initialData ? t.updateProduct : t.saveProduct}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const Field = ({ label, value, onChange, keyboard, icon, placeholder, isPrice }: any) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      {isPrice ? <Text style={styles.currencyPrefix}>$</Text> : <Ionicons name={icon} size={20} color="#94a3b8" />}
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        style={[styles.input, isPrice && { marginLeft: 5 }]}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 60 },
  sectionLabel: { fontSize: 11, fontWeight: "900", color: "#94a3b8", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1.2 },
  card: { backgroundColor: "#fff", borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: "#f1f5f9", elevation: 3 },
  row: { flexDirection: "row", gap: 12 },
  fieldContainer: { marginBottom: 18 },
  label: { fontSize: 11, fontWeight: "800", color: "#64748b", marginBottom: 8, marginLeft: 4, textTransform: "uppercase" },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 18, paddingHorizontal: 16, height: 56 },
  currencyPrefix: { fontSize: 16, fontWeight: "700", color: THEME_BLUE },
  input: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: "600", color: "#1e293b" },
  disabledInput: { backgroundColor: "#f1f5f9", borderColor: '#cbd5e1' },
  dropdownTrigger: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#e2e8f0", borderRadius: 18, paddingHorizontal: 16, height: 56 },
  dropdownTriggerActive: { borderColor: THEME_BLUE, backgroundColor: "#fff" },
  triggerInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  triggerText: { fontSize: 16, fontWeight: "600", color: "#1e293b" },
  dropdownMenu: { marginTop: 8, backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0", padding: 8, elevation: 6 },
  dropdownItem: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, gap: 14, marginBottom: 4 },
  dropdownItemActive: { backgroundColor: THEME_BLUE },
  dropdownItemText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#475569" },
  dropdownItemTextActive: { color: "#fff" },
  barcodeWrapper: { flexDirection: "row", gap: 12, marginBottom: 20, alignItems: "center" },
  regenBtn: { backgroundColor: THEME_BLUE, height: 56, width: 56, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  toggleCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f1f5f9", padding: 16, borderRadius: 20 },
  toggleRowInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleLabel: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  moreHeader: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 12 },
  moreTitle: { color: THEME_BLUE, fontWeight: "800", fontSize: 14 },
  submit: { backgroundColor: THEME_BLUE, height: 64, borderRadius: 22, flexDirection: 'row', justifyContent: "center", alignItems: "center", marginTop: 12, elevation: 8 },
  submitDisabled: { backgroundColor: "#94a3b8" },
  submitText: { color: "#fff", fontWeight: "900", fontSize: 18 },
});