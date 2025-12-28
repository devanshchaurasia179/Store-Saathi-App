import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { onboardShop, getMe } from "../constants/auth.api";

/* ================= COMPONENT ================= */
export default function ProfileForm() {
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [storeCategory, setStoreCategory] = useState("");
  const [upiId, setUpiId] = useState("");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const res = await getMe();
        const shop = res?.data?.shop;
        if (!shop || !mounted) return;
        setShopName(shop.shopName ?? "");
        setOwnerName(shop.ownerName ?? "");
        setMobileNumber(shop.mobileNumber ?? "");
        setGstNumber(shop.gstNumber ?? "");
        setStoreCategory(shop.storeCategory ?? "");
        setUpiId(shop.upiId ?? "");
        setLocation(shop.location ?? "");
      } catch {
        showToast("Failed to load profile", "error");
      } finally {
        mounted && setLoading(false);
      }
    }
    loadProfile();
    return () => { mounted = false; };
  }, []);

  /* ---------------- LOCATION LOGIC ---------------- */
  const getCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast("Permission denied", "error");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const address = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });

      if (address.length > 0) {
        const p = address[0];
        const formatted = [p.name, p.street, p.city, p.region].filter(Boolean).join(", ");
        setLocation(formatted);
        showToast("Location updated", "success");
      }
    } catch {
      showToast("Error fetching location", "error");
    } finally {
      setIsLocating(false);
    }
  };

  const openMapPicker = () => {
    // Navigate to a Map Picker screen if you have one
    // router.push("/map-picker");
    showToast("Map selector opening...", "success");
  };

  /* ---------------- SUBMIT ---------------- */
  const submit = async () => {
    if (!shopName.trim() || !ownerName.trim()) {
      showToast("Required fields missing", "error");
      return;
    }
    try {
      setSaving(true);
      await onboardShop({ shopName, ownerName, gstNumber, storeCategory, upiId, location });
      showToast("Profile Saved", "success");
      setTimeout(() => router.back(), 1000);
    } catch {
      showToast("Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        
        {/* CUSTOM TOAST */}
        {toast && (
          <View style={[styles.toast, toast.type === "error" ? styles.toastError : styles.toastSuccess]}>
            <Ionicons name={toast.type === "error" ? "alert-circle" : "checkmark-circle"} size={18} color="#fff" />
            <Text style={styles.toastText}>{toast.msg}</Text>
          </View>
        )}

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Business Profile</Text>
            <Text style={styles.headerSub}>Verify your shop details</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          <Text style={styles.sectionHeader}>Basic Identity</Text>
          <CardInput label="Shop Name" icon="business-outline" value={shopName} onChange={setShopName} placeholder="E.g. Super Mart" />
          <CardInput label="Owner Full Name" icon="person-outline" value={ownerName} onChange={setOwnerName} placeholder="Enter your name" />
          <CardInput label="Phone Number" icon="call-outline" value={mobileNumber} editable={false} />

          <Divider />

          <Text style={styles.sectionHeader}>Business Details</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}><CardInput label="Category" icon="pricetag-outline" value={storeCategory} onChange={setStoreCategory} placeholder="Grocery" /></View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}><CardInput label="GST (Optional)" icon="document-text-outline" value={gstNumber} onChange={setGstNumber} placeholder="GSTIN" /></View>
          </View>
          <CardInput label="Payment UPI ID" icon="card-outline" value={upiId} onChange={setUpiId} placeholder="shop@upi" />

          <Divider />

          {/* LOCATION SECTION */}
          <Text style={styles.sectionHeader}>Shop Location</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={styles.locationInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter full address"
              multiline
            />
            <View style={styles.locationActions}>
                <TouchableOpacity style={styles.locBtn} onPress={getCurrentLocation} disabled={isLocating}>
                    {isLocating ? <ActivityIndicator size="small" color="#2563eb" /> : <Ionicons name="navigate" size={16} color="#2563eb" />}
                    <Text style={styles.locBtnText}>GPS Auto</Text>
                </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.8 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Profile</Text>}
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================= HELPERS ================= */

function CardInput({ label, icon, value, onChange, editable = true, placeholder = "" }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, !editable && styles.fieldDisabled]}>
        <Ionicons name={icon} size={18} color="#94a3b8" />
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor="#cbd5e1"
          style={styles.textInput}
        />
      </View>
    </View>
  );
}

const Divider = () => <View style={styles.divider} />;

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 16 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#1e293b" },
  headerSub: { color: "#64748b", fontSize: 13, marginTop: -2 },

  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: { fontSize: 14, fontWeight: "800", color: "#1e293b", marginBottom: 16, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 8, marginLeft: 4 },
  field: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12, 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    borderWidth: 1, 
    borderColor: "#e2e8f0" 
  },
  fieldDisabled: { backgroundColor: "#f1f5f9", borderColor: "#f1f5f9" },
  textInput: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1e293b" },

  row: { flexDirection: 'row' },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 15 },

  /* LOCATION SPECIAL BOX */
  locationContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20
  },
  locationInput: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    minHeight: 60,
    textAlignVertical: 'top'
  },
  locationActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12
  },
  locBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#f0f7ff'
  },
  locBtnText: { fontSize: 12, fontWeight: '700', color: '#2563eb' },

  saveBtn: {
    backgroundColor: "#2563eb",
    padding: 18,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: "#2563eb",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  toast: {
    position: "absolute",
    top: 10,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: "row",
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 15,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  toastSuccess: { backgroundColor: "#10b981" },
  toastError: { backgroundColor: "#ef4444" },
  toastText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});