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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

/* 🛠 API */
import { createProduct } from "../../constants/inventory.api";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_QUICK_ADD } from "../../constants/language_inventory";
import { useLanguage } from "../../providers/LanguageProvider";

/* 🆕 UNIT OPTIONS */
const UNIT_OPTIONS = ["unit", "kg", "litre", "box", "pack", "dozen"];

const THEME_BLUE = "#1e3a8a";

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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    quantity: "0",
    unit: "unit",
    category: "Other",
    size: "",
    expiryDate: "",
    isTrackable: true,
    isBarcodeListed: true, // 🆕 Added field
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
        isBarcodeListed: form.isBarcodeListed, // 🆕 Updated payload
        isTrackable: form.isTrackable,
        quantity: Number(form.quantity) || 0,
        unit: form.unit,
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
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{t.title}</Text>
              <Text style={styles.headerSub}>{t.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* BARCODE DISPLAY */}
            <View style={styles.barcodeBox}>
              <View>
                <Text style={styles.label}>{t.scannedBarcode}</Text>
                <Text style={styles.barcode}>{barcode}</Text>
              </View>
              <Ionicons name="barcode-outline" size={32} color={THEME_BLUE} />
            </View>

            {/* PRODUCT NAME */}
            <Text style={styles.label}>{t.productName}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cart-outline" size={20} color="#94a3b8" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder={t.namePlace}
                placeholderTextColor="#94a3b8"
                value={form.name}
                onChangeText={(t) => update("name", t)}
              />
            </View>

            {/* PRICE + QTY */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t.price}</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={[styles.input, { paddingLeft: 8 }]}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#94a3b8"
                    value={form.price}
                    onChangeText={(t) => update("price", t)}
                  />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t.stockQty}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="layers-outline" size={18} color="#94a3b8" style={styles.fieldIcon} />
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={form.quantity}
                    onChangeText={(t) => update("quantity", t)}
                  />
                </View>
              </View>
            </View>

            {/* 🆕 UNIT DROPDOWN (CUSTOM) */}
            <Text style={styles.label}>{t.unit || "UNIT"}</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdownHeader}
                activeOpacity={0.8}
                onPress={() => setDropdownOpen(!dropdownOpen)}
              >
                <Text style={styles.dropdownSelectedText}>
                  {form.unit.toUpperCase()}
                </Text>
                <Ionicons
                  name={dropdownOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={THEME_BLUE}
                />
              </TouchableOpacity>

              {dropdownOpen && (
                <View style={styles.dropdownList}>
                  {UNIT_OPTIONS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.dropdownItem,
                        form.unit === u && styles.dropdownItemActive,
                      ]}
                      onPress={() => {
                        update("unit", u);
                        setDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          form.unit === u && styles.dropdownItemTextActive,
                        ]}
                      >
                        {u.charAt(0).toUpperCase() + u.slice(1)}
                      </Text>
                      {form.unit === u && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* 🆕 PRINT BARCODE TOGGLE */}
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Ionicons name="print-outline" size={18} color={THEME_BLUE} />
                <Text style={styles.switchLabel}>Print Barcode</Text>
              </View>
              <Switch
                value={form.isBarcodeListed}
                onValueChange={(v) => update("isBarcodeListed", v)}
                trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                thumbColor={form.isBarcodeListed ? THEME_BLUE : "#f4f3f4"}
              />
            </View>

            {/* TRACKING */}
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Ionicons name="stats-chart" size={18} color={THEME_BLUE} />
                <Text style={styles.switchLabel}>{t.enableTracking}</Text>
              </View>
              <Switch
                value={form.isTrackable}
                onValueChange={(v) => update("isTrackable", v)}
                trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
                thumbColor={form.isTrackable ? THEME_BLUE : "#f4f3f4"}
              />
            </View>

            {/* MORE DETAILS TOGGLE */}
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setShowMore((p) => !p)}
            >
              <Text style={styles.moreText}>
                {showMore ? t.lessDetails : t.moreDetails}
              </Text>
              <Ionicons
                name={showMore ? "chevron-up" : "chevron-down"}
                size={16}
                color={THEME_BLUE}
              />
            </TouchableOpacity>

            {showMore && (
              <View style={styles.extraFields}>
                <Text style={styles.label}>{t.category}</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="pricetag-outline" size={18} color="#94a3b8" style={styles.fieldIcon} />
                  <TextInput
                    style={styles.input}
                    value={form.category}
                    onChangeText={(t) => update("category", t)}
                  />
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{t.size}</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 500ml"
                        value={form.size}
                        onChangeText={(t) => update("size", t)}
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{t.expiryDate}</Text>
                    <View style={styles.inputContainer}>
                      <Ionicons name="calendar-outline" size={18} color="#94a3b8" style={styles.fieldIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        value={form.expiryDate}
                        onChangeText={(t) => update("expiryDate", t)}
                      />
                    </View>
                  </View>
                </View>
              </View>
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
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.saveText}>{t.addProduct}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "92%",
    width: "100%",
    elevation: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  header: {
    backgroundColor: THEME_BLUE,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSub: {
    color: "#cbd5e1",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 6,
    borderRadius: 12,
  },
  body: {
    padding: 24,
    paddingBottom: 40,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    marginBottom: 20,
    paddingHorizontal: 14,
  },
  fieldIcon: {
    marginRight: 10,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: "700",
    color: "#64748b",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  barcodeBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: THEME_BLUE,
  },
  barcode: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: 2,
  },
  dropdownContainer: {
    marginBottom: 20,
    zIndex: 1000,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  dropdownSelectedText: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME_BLUE,
  },
  dropdownList: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dropdownItemActive: {
    backgroundColor: THEME_BLUE,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  dropdownItemTextActive: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f4ff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  switchTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME_BLUE,
  },
  moreBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  moreText: {
    fontSize: 14,
    fontWeight: "800",
    color: THEME_BLUE,
  },
  extraFields: {
    marginTop: 10,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  footer: {
    flexDirection: "row",
    padding: 24,
    gap: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  cancelBtn: {
    flex: 1,
    padding: 18,
    backgroundColor: "#fff",
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  cancelText: {
    fontWeight: "800",
    color: "#64748b",
    fontSize: 15,
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: "row",
    padding: 18,
    backgroundColor: THEME_BLUE,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 6,
    shadowColor: THEME_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  saveText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});