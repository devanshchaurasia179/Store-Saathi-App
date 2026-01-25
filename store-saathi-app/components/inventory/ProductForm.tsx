import React, { useEffect, useState, useMemo } from "react";
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
  Modal,
  Dimensions,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";

/* 🛠 API & UTILS */
import { createProduct, updateProduct, getProducts } from "../../constants/inventory.api";
import { generateBarcode } from "../../utils/generateBarcode";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_PRODUCT_FORM } from "../../constants/language_inventory";
import { useLanguage } from "../../providers/LanguageProvider";

/* 📸 SCANNER */
import BarcodeScanner from "../billing/BarcodeScanner";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const THEME_BLUE = "#1e3a8a";

const UNIT_OPTIONS = [
  { label: "Unit / Pcs", value: "unit", icon: "cube-outline" },
  { label: "Kilogram (kg)", value: "kg", icon: "scale-outline" },
  { label: "Litre (L)", value: "litre", icon: "water-outline" },
  { label: "Dozen", value: "dozen", icon: "grid-outline" },
];

const DEFAULT_VARIANT = () => ({
  name: "",
  price: { sellingPrice: "" },
  quantity: "0",
  barcode: generateBarcode(),
});

const DEFAULT_FORM = {
  name: "",
  barcode: "",
  isBarcodeListed: true,
  isTrackable: true,
  price: { sellingPrice: "" },
  quantity: "0",
  unit: "unit",
  category: "",
  expiryDate: null as Date | null,
  isActive: true,
  variants: [] as any[],
};

type Props = {
  onSuccess?: () => void;
  initialData?: any;
};

export default function ProductForm({ onSuccess, initialData }: Props) {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_PRODUCT_FORM[language] || LANGUAGE_TEXT_PRODUCT_FORM.en;

  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  /* CATEGORY STATE */
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");

  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanningFor, setScanningFor] = useState<{
    type: "main" | "variant";
    variantIndex?: number;
  } | null>(null);

  useEffect(() => {
    // 1. Fetch Categories from DB
    getProducts().then((res) => {
      const prods = res.data.products || [];
      const cats: string[] = Array.from(new Set(prods.map((p: any) => p.category).filter(Boolean)));
      setDbCategories(cats);
    }).catch(() => {});

    // 2. Handle Initial Data
    if (!initialData) {
      setForm((f) => ({ ...f, barcode: generateBarcode() }));
      return;
    }

    setForm({
      name: initialData.name || "",
      barcode: initialData.barcode || "",
      isBarcodeListed: initialData.isBarcodeListed ?? true,
      isTrackable: initialData.isTrackable ?? true,
      price: { sellingPrice: String(initialData.price?.sellingPrice ?? "") },
      quantity: String(initialData.quantity ?? 0),
      unit: initialData.unit || "unit",
      category: initialData.category || "",
      expiryDate: initialData.expiryDate ? new Date(initialData.expiryDate) : null,
      isActive: initialData.isActive ?? true,
      variants: initialData.variants || [],
    });
    setCategorySearch(initialData.category || "");
  }, [initialData]);

  const update = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const filteredCategories = useMemo(() => {
    if (!categorySearch) return dbCategories;
    return dbCategories.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [categorySearch, dbCategories]);

  const showCreateNew = categorySearch.trim().length > 0 && !dbCategories.some(c => c.toLowerCase() === categorySearch.trim().toLowerCase());

  const selectCategory = (cat: string) => {
    update("category", cat);
    setCategorySearch(cat);
    setIsCategoryOpen(false);
    Keyboard.dismiss();
  };

  const addVariant = () => update("variants", [...form.variants, DEFAULT_VARIANT()]);
  const removeVariant = (index: number) => {
    const newVariants = [...form.variants];
    newVariants.splice(index, 1);
    update("variants", newVariants);
  };

  const updateVariant = (index: number, key: string, value: any) => {
    const newVariants = [...form.variants];
    if (key === "sellingPrice") {
      newVariants[index].price = { ...newVariants[index].price, sellingPrice: value };
    } else {
      newVariants[index][key] = value;
    }
    update("variants", newVariants);
  };

  const openScannerFor = (type: "main" | "variant", variantIndex?: number) => {
    setScanningFor({ type, variantIndex });
    setScannerVisible(true);
  };

  const handleScan = (scanned: string) => {
    if (!scanned?.trim()) return;
    if (scanningFor?.type === "main") {
      update("barcode", scanned);
    } else if (scanningFor?.type === "variant" && scanningFor.variantIndex !== undefined) {
      updateVariant(scanningFor.variantIndex, "barcode", scanned);
    }
    setScannerVisible(false);
    setScanningFor(null);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) update("expiryDate", selectedDate);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Alert.alert("Required", "Product name is required");
      return;
    }
    const payload = {
      ...form,
      quantity: Number(form.quantity) || 0,
      price: { sellingPrice: Number(form.price.sellingPrice) || 0 },
      expiryDate: form.expiryDate ? form.expiryDate.toISOString() : null,
      variants: form.variants.map((v) => ({
        ...v,
        quantity: Number(v.quantity) || 0,
        price: { sellingPrice: Number(v.price.sellingPrice) || 0 },
      })),
    };

    try {
      setLoading(true);
      if (initialData) {
        await updateProduct(initialData._id, payload);
      } else {
        await createProduct(payload);
        setForm(DEFAULT_FORM);
        setCategorySearch("");
      }
      Toast.show({ type: "success", text1: initialData ? "Product Updated" : "Product Created" });
      onSuccess?.();
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Error", text2: "Check Barcode or Connection" });
    } finally {
      setLoading(false);
    }
  };

  const selectedUnit = UNIT_OPTIONS.find((u) => u.value === form.unit);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
    >
      {/* SECTION 1: CORE DETAILS */}
      <View style={[styles.card, { zIndex: 100 }]}>
        <Text style={styles.sectionLabel}>Basic Information</Text>
        <Field label="Product Name" value={form.name} onChange={(v) => update("name", v)} icon="cart-outline" />
        
        {/* CATEGORY SEARCH/PICKER FIELD */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={[styles.inputContainer, isCategoryOpen && styles.activeInputContainer]}>
            <Ionicons name="grid-outline" size={18} color={isCategoryOpen ? THEME_BLUE : "#94a3b8"} style={{ marginRight: 8 }} />
            <TextInput 
              style={styles.input} 
              value={categorySearch} 
              placeholder="Search or Create Category" 
              placeholderTextColor="#94a3b8"
              onFocus={() => setIsCategoryOpen(true)}
              onChangeText={(v) => {
                setCategorySearch(v);
                update("category", v);
              }}
            />
            {categorySearch.length > 0 && (
              <TouchableOpacity onPress={() => { setCategorySearch(""); update("category", ""); }}>
                <Ionicons name="close-circle" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            )}
          </View>
          
          {isCategoryOpen && (
            <View style={styles.pickerDropdown}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerHeaderText}>Select Category</Text>
                <TouchableOpacity onPress={() => setIsCategoryOpen(false)}>
                  <Text style={styles.pickerCloseText}>Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                {filteredCategories.map((cat, i) => (
                  <TouchableOpacity key={i} style={styles.pickerItem} onPress={() => selectCategory(cat)}>
                    <View style={styles.pickerItemIcon}>
                      <Ionicons name="return-down-forward" size={14} color={THEME_BLUE} />
                    </View>
                    <Text style={styles.pickerItemText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
                
                {showCreateNew && (
                  <TouchableOpacity style={[styles.pickerItem, styles.createItem]} onPress={() => selectCategory(categorySearch)}>
                    <View style={styles.createIconBg}>
                      <Ionicons name="add" size={16} color="#fff" />
                    </View>
                    <View>
                      <Text style={styles.createLabelText}>New Category</Text>
                      <Text style={styles.createValueText}>"{categorySearch}"</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {filteredCategories.length === 0 && !showCreateNew && (
                   <View style={styles.emptySearch}>
                      <Text style={styles.emptySearchText}>No categories found</Text>
                   </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.gridRow}>
          <View style={{ flex: 1 }}>
            <Field label="Unit" value={selectedUnit?.label || "Select"} onPress={() => setIsUnitOpen(!isUnitOpen)} icon="options-outline" editable={false} />
          </View>
          <View style={{ flex: 1 }}>
              <Field label="Expiry Date" value={form.expiryDate ? form.expiryDate.toLocaleDateString() : "None"} onPress={() => setShowDatePicker(true)} icon="calendar-outline" editable={false} />
          </View>
        </View>

        {isUnitOpen && (
          <View style={styles.dropdownBox}>
            {UNIT_OPTIONS.map((u) => (
              <TouchableOpacity key={u.value} style={[styles.dropdownItem, form.unit === u.value && styles.activeDropdownItem]} onPress={() => { update("unit", u.value); setIsUnitOpen(false); }}>
                <Ionicons name={u.icon as any} size={18} color={form.unit === u.value ? "#fff" : "#64748b"} />
                <Text style={[styles.dropdownText, form.unit === u.value && { color: "#fff" }]}>{u.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {form.variants.length === 0 && (
          <View style={styles.gridRow}>
            <View style={{ flex: 1 }}>
              <Field label="Price" value={form.price.sellingPrice} keyboard="numeric" isPrice onChange={(v) => update("price", { sellingPrice: v })} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Stock" value={form.quantity} keyboard="numeric" onChange={(v) => update("quantity", v)} />
            </View>
          </View>
        )}
      </View>

      {/* SECTION 2: VARIANTS */}
      <View style={styles.card}>
        <View style={styles.headerWithAction}>
          <Text style={styles.sectionLabel}>Variants</Text>
          <TouchableOpacity style={styles.outlineBtn} onPress={addVariant}>
            <Ionicons name="add" size={16} color={THEME_BLUE} />
            <Text style={styles.outlineBtnText}>Add New</Text>
          </TouchableOpacity>
        </View>

        {form.variants.map((v, idx) => (
          <View key={idx} style={styles.variantBox}>
            <View style={styles.variantBoxHeader}>
              <Text style={styles.variantIndexLabel}>#0{idx + 1}</Text>
              <TouchableOpacity onPress={() => removeVariant(idx)}><Ionicons name="trash-outline" size={20} color="#ef4444" /></TouchableOpacity>
            </View>
            <Field label="Variant Name" value={v.name} placeholder="e.g. Small / Red" onChange={(val) => updateVariant(idx, "name", val)} />
            <View style={styles.gridRow}>
              <View style={{ flex: 1 }}><Field label="Price" value={v.price.sellingPrice} keyboard="numeric" isPrice onChange={(val) => updateVariant(idx, "sellingPrice", val)} /></View>
              <View style={{ flex: 1 }}><Field label="Stock" value={v.quantity} keyboard="numeric" onChange={(val) => updateVariant(idx, "quantity", val)} /></View>
            </View>
            <View style={styles.compactBarcodeRow}>
                <View style={styles.miniInputWrapper}>
                  <Ionicons name="barcode-outline" size={16} color="#94a3b8" />
                  <TextInput style={styles.miniInput} value={v.barcode} onChangeText={(val) => updateVariant(idx, "barcode", val)} placeholder="Barcode" />
                </View>
                <TouchableOpacity style={styles.miniScanBtn} onPress={() => openScannerFor("variant", idx)}><Ionicons name="scan" size={18} color="#fff" /></TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* SECTION 3: IDENTIFICATION & TRACKING */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Identification & Settings</Text>
        <View style={styles.barcodeControl}>
            <View style={[styles.barcodeInputBlock, initialData && styles.disabledField]}>
                <Ionicons name="barcode-outline" size={20} color={THEME_BLUE} />
                <TextInput style={styles.input} value={form.barcode} onChangeText={(v) => update("barcode", v)} editable={!initialData} placeholder="Main Barcode" />
            </View>
            {!initialData && (
                <View style={styles.barcodeActions}>
                    <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => update("barcode", generateBarcode())}><Ionicons name="refresh" size={20} color={THEME_BLUE} /></TouchableOpacity>
                    <TouchableOpacity style={styles.primaryActionBtn} onPress={() => openScannerFor("main")}><Ionicons name="scan" size={20} color="#fff" /></TouchableOpacity>
                </View>
            )}
        </View>

        <View style={styles.toggleContainer}>
          <ToggleItem label="Stock Tracking" sub="Auto-update stock on sales" value={form.isTrackable} onToggle={(v) => update("isTrackable", v)} />
          <View style={styles.divider} />
          <ToggleItem label="Print Barcode" sub="Visible on Barcode sheets" value={form.isBarcodeListed} onToggle={(v) => update("isBarcodeListed", v)} />
        </View>
      </View>

      <TouchableOpacity style={[styles.mainSubmitBtn, loading && styles.disabledBtn]} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainSubmitText}>{initialData ? "Update Changes" : "Create Product"}</Text>}
      </TouchableOpacity>

      {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker value={form.expiryDate || new Date()} mode="date" onChange={onDateChange} minimumDate={new Date()} />
      )}

      <Modal visible={scannerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.scannerContainer}>
            <BarcodeScanner onScan={handleScan} onClose={() => setScannerVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const Field = ({ label, value, onChange, keyboard = "default", icon, isPrice, onPress, editable = true, placeholder }: any) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TouchableOpacity activeOpacity={onPress ? 0.7 : 1} onPress={onPress} style={[styles.inputContainer, !editable && styles.disabledField, !!onPress && styles.pressableField]}>
      {icon && <Ionicons name={icon as any} size={18} color="#94a3b8" style={{ marginRight: 8 }} />}
      {isPrice && <Text style={styles.pricePrefix}>₹</Text>}
      <TextInput style={styles.input} value={String(value ?? "")} onChangeText={onChange} keyboardType={keyboard as any} placeholder={placeholder || "..."} editable={editable && !onPress} />
    </TouchableOpacity>
  </View>
);

const ToggleItem = ({ label, sub, value, onToggle }: any) => (
  <View style={styles.toggleItem}>
    <View style={{ flex: 1 }}>
      <Text style={styles.toggleMainText}>{label}</Text>
      <Text style={styles.toggleSubText}>{sub}</Text>
    </View>
    <Switch value={value} onValueChange={onToggle} trackColor={{ false: "#cbd5e1", true: "#93c5fd" }} thumbColor={value ? THEME_BLUE : "#f4f3f4"} />
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 14, paddingBottom: 60 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 14 },
  gridRow: { flexDirection: "row", gap: 12 },
  fieldContainer: { marginBottom: 14, position: 'relative' },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: "#64748b", marginBottom: 6, marginLeft: 2 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 12, height: 48 },
  activeInputContainer: { borderColor: THEME_BLUE, backgroundColor: "#fff" },
  input: { flex: 1, fontSize: 15, color: "#1e293b", fontWeight: "600" },
  pricePrefix: { fontSize: 15, fontWeight: "700", color: THEME_BLUE, marginRight: 4 },
  disabledField: { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" },
  pressableField: { borderColor: "#cbd5e1" },
  headerWithAction: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  outlineBtn: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: THEME_BLUE, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  outlineBtnText: { color: THEME_BLUE, fontWeight: "700", fontSize: 12, marginLeft: 4 },
  variantBox: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  variantBoxHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  variantIndexLabel: { fontSize: 10, fontWeight: "800", color: THEME_BLUE, backgroundColor: "#dbeafe", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  compactBarcodeRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  miniInputWrapper: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 8, height: 38 },
  miniInput: { flex: 1, fontSize: 13, color: "#475569", marginLeft: 6 },
  miniScanBtn: { backgroundColor: THEME_BLUE, width: 38, height: 38, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  barcodeControl: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 16 },
  barcodeInputBlock: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 12, height: 48 },
  barcodeActions: { flexDirection: "row", gap: 8 },
  primaryActionBtn: { backgroundColor: THEME_BLUE, width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  secondaryActionBtn: { backgroundColor: "#fff", width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: THEME_BLUE, justifyContent: "center", alignItems: "center" },
  toggleContainer: { marginTop: 4 },
  toggleItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  toggleMainText: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  toggleSubText: { fontSize: 11, color: "#94a3b8" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 2 },
  mainSubmitBtn: { backgroundColor: THEME_BLUE, height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", elevation: 4, marginVertical: 20 },
  mainSubmitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  disabledBtn: { backgroundColor: "#94a3b8" },
  dropdownBox: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", padding: 6, marginBottom: 14 },
  dropdownItem: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8, gap: 10 },
  activeDropdownItem: { backgroundColor: THEME_BLUE },
  dropdownText: { fontSize: 14, fontWeight: "600", color: "#475569" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" },
  scannerContainer: { width: SCREEN_WIDTH * 0.85, height: SCREEN_HEIGHT * 0.5, borderRadius: 24, overflow: "hidden", backgroundColor: '#000' },
  closeBtn: { position: "absolute", top: 12, right: 12, zIndex: 10 },
  
  /* ENHANCED PICKER DROPDOWN STYLES */
  pickerDropdown: { 
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    backgroundColor: "#fff", 
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: THEME_BLUE, 
    elevation: 8, 
    shadowColor: '#1e3a8a', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 10,
    zIndex: 999
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  pickerHeaderText: { fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase' },
  pickerCloseText: { fontSize: 12, fontWeight: '800', color: THEME_BLUE },
  pickerItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: "#f1f5f9", 
    gap: 12 
  },
  pickerItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickerItemText: { fontSize: 14, color: "#334155", fontWeight: "600" },
  createItem: { backgroundColor: "#eff6ff", borderBottomWidth: 0 },
  createIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME_BLUE,
    alignItems: 'center',
    justifyContent: 'center'
  },
  createLabelText: { fontSize: 10, fontWeight: '800', color: THEME_BLUE, textTransform: 'uppercase' },
  createValueText: { fontSize: 15, color: "#1e3a8a", fontWeight: "700" },
  emptySearch: { padding: 20, alignItems: 'center' },
  emptySearchText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' }
});