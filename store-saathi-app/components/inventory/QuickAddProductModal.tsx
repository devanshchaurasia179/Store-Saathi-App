// QuickAddProductModal.tsx (Toast instead of Alert)

import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message"; // <-- Added

import { createProduct } from "../../constants/inventory.api";

type Props = {
  visible: boolean;
  barcode: string;
  onClose: () => void;
  onSuccess: (newProduct: any) => void;
};

export default function QuickAddProductModal({
  visible,
  barcode,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    quantity: "0",
    category: "Other",
    size: "",
    expiryDate: "",
    isTrackable: true,
  });

  const update = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* ---------------- SAVE PRODUCT ---------------- */
  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Product name and price are required",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        barcode,
        isBarcodeListed: true,
        isTrackable: form.isTrackable,
        quantity: Number(form.quantity) || 0,
        category: form.category || "Other",
        size: form.size || "",
        expiryDate: form.expiryDate || null,
        price: { sellingPrice: Number(form.price) },
        isActive: true,
      };

      const response = await createProduct(payload);

      const newProduct = response.data?.product || response.product || response;

      if (!newProduct || !newProduct._id) {
        throw new Error("No product ID returned from server");
      }

      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Product added successfully",
      });

      onSuccess(newProduct);
      onClose();
    } catch (e: any) {
      console.error("Quick add error:", e);

      if (e?.response?.status === 409) {
        Toast.show({
          type: "error",
          text1: "Duplicate Barcode",
          text2: "This barcode already exists in inventory",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: e?.message || "Failed to add product",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Quick Add</Text>
              <Text style={styles.headerSub}>New Inventory Item</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* BARCODE */}
            <View style={styles.barcodeBox}>
              <Text style={styles.label}>Scanned Barcode</Text>
              <Text style={styles.barcode}>{barcode}</Text>
            </View>

            {/* NAME */}
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Coca Cola 500ml"
              value={form.name}
              onChangeText={(t) => update("name", t)}
            />

            {/* PRICE + QTY */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Price *</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="₹ 0.00"
                  value={form.price}
                  onChangeText={(t) => update("price", t)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Stock Qty</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={form.quantity}
                  onChangeText={(t) => update("quantity", t)}
                />
              </View>
            </View>

            {/* TRACKING */}
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Enable Stock Tracking</Text>
              <Switch
                value={form.isTrackable}
                onValueChange={(v) => update("isTrackable", v)}
              />
            </View>

            {/* MORE DETAILS */}
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setShowMore((p) => !p)}
            >
              <Ionicons
                name={showMore ? "chevron-up" : "chevron-down"}
                size={16}
                color="#555"
              />
              <Text style={styles.moreText}>
                {showMore ? "Less Details" : "More Details"}
              </Text>
            </TouchableOpacity>

            {showMore && (
              <>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={form.category}
                  onChangeText={(t) => update("category", t)}
                />

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Size</Text>
                    <TextInput
                      style={styles.input}
                      value={form.size}
                      onChangeText={(t) => update("size", t)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Expiry Date</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="YYYY-MM-DD"
                      value={form.expiryDate}
                      onChangeText={(t) => update("expiryDate", t)}
                    />
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* ACTIONS */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Add Product</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES (unchanged) ================= */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    maxHeight: "90%",
  },
  header: {
    backgroundColor: "#2563eb",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerSub: {
    color: "#c7d2fe",
    fontSize: 11,
  },
  body: {
    padding: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  barcodeBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  barcode: {
    fontFamily: "monospace",
    fontWeight: "bold",
    color: "#334155",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e40af",
  },
  moreBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginVertical: 10,
  },
  moreText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
  },
  footer: {
    flexDirection: "row",
    padding: 14,
    gap: 10,
    backgroundColor: "#f8fafc",
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancelText: {
    fontWeight: "700",
    color: "#555",
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: "#2563eb",
    borderRadius: 14,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
  },
});