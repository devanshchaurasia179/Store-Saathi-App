import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { createProduct, updateProduct } from "../../constants/inventory.api";
import { generateBarcode } from "../../utils/generateBarcode";

const DEFAULT_FORM = {
  name: "",
  barcode: "",
  isBarcodeListed: true,
  isTrackable: true,
  price: { sellingPrice: "" },
  quantity: 0,
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
  const [form, setForm] = useState(DEFAULT_FORM);
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(false);

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
      Alert.alert("Required Fields", "Product Name and Selling Price cannot be empty.");
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
      Alert.alert("Error", e?.response?.status === 409 ? "Barcode already exists." : "Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* BASIC INFO SECTION */}
      <View style={styles.card}>
        <Field
          label="Product Name"
          icon="cart-outline"
          value={form.name}
          placeholder="e.g. Amul Gold Milk 1L"
          onChange={(v) => update("name", v)}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field
              label="Selling Price"
              icon="cash-outline"
              value={String(form.price.sellingPrice)}
              keyboard="numeric"
              placeholder="0.00"
              onChange={(v) => update("price", { sellingPrice: v })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Opening Stock"
              icon="layers-outline"
              value={String(form.quantity)}
              keyboard="numeric"
              placeholder="0"
              onChange={(v) => update("quantity", v)}
            />
          </View>
        </View>
      </View>

      {/* BARCODE SECTION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Identification</Text>
        <View style={styles.barcodeWrapper}>
          <View style={[styles.inputContainer, { flex: 1, marginBottom: 0 }, initialData && styles.disabledInput]}>
            <Ionicons name="barcode-outline" size={20} color="#94a3b8" />
            <TextInput
              value={form.barcode}
              editable={!initialData}
              style={styles.input}
              placeholder="Barcode"
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
          <Text style={styles.toggleLabel}>Print barcode on labels</Text>
          <Switch
            value={form.isBarcodeListed}
            onValueChange={(v) => update("isBarcodeListed", v)}
            trackColor={{ false: "#e2e8f0", true: "#93c5fd" }}
            thumbColor={form.isBarcodeListed ? "#2563eb" : "#f4f3f4"}
          />
        </View>
      </View>

      {/* ADDITIONAL DETAILS */}
      <TouchableOpacity 
        style={styles.moreHeader} 
        onPress={() => setShowMore(!showMore)}
      >
        <Text style={styles.moreTitle}>Additional Details</Text>
        <Ionicons name={showMore ? "chevron-up" : "chevron-down"} size={20} color="#2563eb" />
      </TouchableOpacity>

      {showMore && (
        <View style={styles.card}>
          <Field
            label="Category"
            icon="grid-outline"
            value={form.category}
            placeholder="e.g. Dairy"
            onChange={(v) => update("category", v)}
          />
          <Field
            label="Size / Variant"
            icon="resize-outline"
            value={form.size}
            placeholder="e.g. 500g, Large, XL"
            onChange={(v) => update("size", v)}
          />
          <Toggle
            label="Enable Stock Tracking"
            value={form.isTrackable}
            onChange={(v) => update("isTrackable", v)}
          />
        </View>
      )}

      {/* SUBMIT */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={[styles.submit, loading && styles.submitDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {initialData ? "Update Product" : "Save Product"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
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

const styles = StyleSheet.create({
  container: { paddingBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  row: { flexDirection: "row", gap: 12 },
  fieldContainer: { marginBottom: 16 },
  label: { 
    fontSize: 13, 
    fontWeight: "700", 
    color: "#64748b", 
    marginBottom: 8,
    marginLeft: 4
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },
  disabledInput: { backgroundColor: "#f1f5f9" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  barcodeWrapper: { 
    flexDirection: "row", 
    gap: 10, 
    marginBottom: 12, 
    alignItems: "center" 
  },
  regenBtn: {
    backgroundColor: "#2563eb",
    height: 52,
    width: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: "#475569" },
  moreHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    marginBottom: 10,
  },
  moreTitle: { color: "#2563eb", fontWeight: "700", fontSize: 14 },
  submit: {
    backgroundColor: "#2563eb",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitDisabled: { backgroundColor: "#93c5fd" },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});