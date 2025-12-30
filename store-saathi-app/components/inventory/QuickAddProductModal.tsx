import React, { useState } from "react";
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
import Toast from "react-native-toast-message";

/* 🛠 API */
import { createProduct } from "../../constants/inventory.api";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_QUICK_ADD } from "../../constants/language_inventory";
import { useLanguage } from "../../providers/LanguageProvider";

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
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_QUICK_ADD[language] || LANGUAGE_TEXT_QUICK_ADD.en;

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
        text1: t.validationError,
        text2: t.validationMsg,
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
        text1: t.success,
        text2: t.successMsg,
      });

      onSuccess(newProduct);
      onClose();
    } catch (e: any) {
      console.error("Quick add error:", e);

      if (e?.response?.status === 409) {
        Toast.show({
          type: "error",
          text1: t.duplicateBarcode,
          text2: t.duplicateMsg,
        });
      } else {
        Toast.show({
          type: "error",
          text1: t.error,
          text2: e?.message || t.errorSave,
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
              <Text style={styles.headerTitle}>{t.title}</Text>
              <Text style={styles.headerSub}>{t.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* BARCODE */}
            <View style={styles.barcodeBox}>
              <Text style={styles.label}>{t.scannedBarcode}</Text>
              <Text style={styles.barcode}>{barcode}</Text>
            </View>

            {/* NAME */}
            <Text style={styles.label}>{t.productName}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.namePlace}
              value={form.name}
              onChangeText={(t) => update("name", t)}
            />

            {/* PRICE + QTY */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t.price}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder={t.pricePlace}
                  value={form.price}
                  onChangeText={(t) => update("price", t)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t.stockQty}</Text>
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
              <Text style={styles.switchLabel}>{t.enableTracking}</Text>
              <Switch
                value={form.isTrackable}
                onValueChange={(v) => update("isTrackable", v)}
                trackColor={{ false: "#e2e8f0", true: "#93c5fd" }}
                thumbColor={form.isTrackable ? "#2563eb" : "#f4f3f4"}
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
                color="#2563eb"
              />
              <Text style={[styles.moreText, { color: '#2563eb' }]}>
                {showMore ? t.lessDetails : t.moreDetails}
              </Text>
            </TouchableOpacity>

            {showMore && (
              <>
                <Text style={styles.label}>{t.category}</Text>
                <TextInput
                  style={styles.input}
                  value={form.category}
                  onChangeText={(t) => update("category", t)}
                />

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{t.size}</Text>
                    <TextInput
                      style={styles.input}
                      value={form.size}
                      onChangeText={(t) => update("size", t)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{t.expiryDate}</Text>
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
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>{t.addProduct}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    maxHeight: "90%",
    elevation: 20,
  },
  header: {
    backgroundColor: "#2563eb",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },
  headerSub: {
    color: "#bfdbfe",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  body: {
    padding: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#1e293b",
    fontWeight: '600'
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  barcodeBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1'
  },
  barcode: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    letterSpacing: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e40af",
  },
  moreBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginVertical: 12,
  },
  moreText: {
    fontSize: 14,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelText: {
    fontWeight: "800",
    color: "#64748b",
  },
  saveBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: "#2563eb",
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
  },
  saveText: {
    color: "#fff",
    fontWeight: "800",
  },
});