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
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
// Clipboard import removed 🚫
import PageLoader from "@/components/PageLoader";

/* 🛠 API & AUTH */
import { onboardShop, getMe, resetSecretKey } from "../constants/auth.api";
import { useAuth } from "../providers/AuthProvider";

/* 🔒 COMPONENTS */
import AnalyticsPinModal from "@/components/AnalyticsPinModal";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_PROFILE } from "../constants/language_profile";
import { useLanguage } from "../providers/LanguageProvider";

export const LANGUAGES = [
  { code: 'hi', title: 'हिंदी', symbol: 'अ', bgColor: '#E3F2FD', symbolColor: '#2196F3' },
  { code: 'en', title: 'English', symbol: 'A', bgColor: '#E8F5E9', symbolColor: '#4CAF50' },
  { code: 'pa', title: 'Punjabi-ਪੰਜਾਬੀ', symbol: 'ਅ', bgColor: '#FFF3E0', symbolColor: '#FF9800' },
  { code: 'gu', title: 'Gujarati-ગુજરાતી', symbol: 'અ', bgColor: '#FFE0B2', symbolColor: '#E65100' },
  { code: 'mr', title: 'Marathi-मराठी', symbol: 'आ', bgColor: '#E0F2F1', symbolColor: '#FF5722' },
  { code: 'te', title: 'Telugu-తెలుగు', symbol: 'అ', bgColor: '#FFFDE7', symbolColor: '#C6A700' },
];

export default function ProfileForm() {
  const { logout } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const t = LANGUAGE_TEXT_PROFILE[language] || LANGUAGE_TEXT_PROFILE.en;

  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [storeCategory, setStoreCategory] = useState("");
  const [upiId, setUpiId] = useState("");

  /* ================= ADDRESS FIELDS ================= */
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  /* 🔐 SECRET KEY STATES */
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<"set" | "verify" | "forgot">("verify");
  const [hasPin, setHasPin] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
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
        setStreet(shop.address?.street ?? "");
        setCity(shop.address?.city ?? "");
        setState(shop.address?.state ?? "");
        setPincode(shop.address?.pincode ?? "");
        setLatitude(shop.address?.latitude ?? null);
        setLongitude(shop.address?.longitude ?? null);
        setHasPin(shop.hasAnalyticsPin ?? false);
      } catch {
        showToast(t.failedLoad, "error");
      } finally {
        mounted && setLoading(false);
      }
    }
    loadProfile();
    return () => { mounted = false; };
  }, [language]);

  /* 🔐 UNLOCK SECRET KEY HANDLER */
  const handleUnlockSecretKey = () => {
    if (hasPin === null) return;
    
    if (!hasPin) {
      setPinMode("set");
    } else {
      setPinMode("verify");
    }
    setShowPinModal(true);
  };

  /* 🔐 REGENERATE HANDLER */
  const handleRegenerateSecretKey = async (pin: string) => {
    try {
      const res = await resetSecretKey(pin);
      setSecretKey(res.data.secretKey);
      showToast("Secret key Unlocked", "success");
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Invalid PIN", "error");
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast(t.toastPermDeny || "Permission denied", "error");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);

      const address = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (address.length > 0) {
        const p = address[0];
        setStreet([p.name, p.street].filter(Boolean).join(", "));
        setCity(p.city || p.subregion || "");
        setState(p.region || "");
        setPincode(p.postalCode || "");
        showToast(t.locUpdated, "success");
      }
    } catch {
      showToast("Error detecting location", "error");
    } finally {
      setIsLocating(false);
    }
  };

  const submit = async () => {
    if (!shopName.trim() || !ownerName.trim()) {
      showToast(t.requiredFields, "error");
      return;
    }
    try {
      setSaving(true);
      await onboardShop({
        shopName,
        ownerName,
        gstNumber,
        storeCategory,
        upiId,
        address: {
          street,
          city,
          state,
          pincode,
          latitude,
          longitude,
        },
      });
      showToast(t.profileSaved, "success");
    } catch {
      showToast(t.updateFailed || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t.logout, t.logoutConfirm, [
      { text: t.cancel, style: "cancel" },
      { text: t.yes, style: "destructive", onPress: () => logout() },
    ]);
  };

  if (loading) return <PageLoader />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        
        {toast && (
          <View style={[styles.toast, toast.type === "error" ? styles.toastError : styles.toastSuccess]}>
            <Ionicons name={toast.type === "error" ? "alert-circle" : "checkmark-circle"} size={18} color="#fff" />
            <Text style={styles.toastText}>{toast.msg}</Text>
          </View>
        )}

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{t.title}</Text>
            <Text style={styles.headerSub}>{t.subtitle}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>{t.langSection}</Text>
            <TouchableOpacity style={styles.dropdownSelector} onPress={() => setLangModalVisible(true)}>
              <View style={styles.langLeft}>
                <View style={styles.langIconBg}>
                    <MaterialCommunityIcons name="translate" size={18} color="#1e3a8a" />
                </View>
                <Text style={styles.currentLangText}>{LANGUAGES.find(l => l.code === language)?.title}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>{t.identity}</Text>
            <CardInput label={t.shopName} icon="business-outline" value={shopName} onChange={setShopName} placeholder="E.g. Super Mart" />
            <CardInput label={t.ownerName} icon="person-outline" value={ownerName} onChange={setOwnerName} placeholder="Enter your name" />
            <CardInput label={t.phone} icon="call-outline" value={mobileNumber} editable={false} />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>{t.bizDetails}</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                  <CardInput label={t.category} icon="pricetag-outline" value={storeCategory} onChange={setStoreCategory} placeholder="Grocery" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                  <CardInput label={t.gst} icon="document-text-outline" value={gstNumber} onChange={setGstNumber} placeholder="GSTIN" />
              </View>
            </View>
            <CardInput label={t.upi} icon="card-outline" value={upiId} onChange={setUpiId} placeholder="shop@upi" />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>{t.location}</Text>
            <CardInput label="Full Address" icon="location-outline" value={street} onChange={setStreet} placeholder="Street address" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <CardInput label="City" icon="business-outline" value={city} onChange={setCity} placeholder="City" />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <CardInput label="State" icon="map-outline" value={state} onChange={setState} placeholder="State" />
              </View>
            </View>
            <CardInput label="Pincode" icon="keypad-outline" value={pincode} onChange={setPincode} placeholder="6-digit pincode" keyboardType="number-pad" />

            {/* Lat/Lng Display */}
            {latitude !== null && longitude !== null && (
              <View style={styles.coordsContainer}>
                <Ionicons name="navigate-circle-outline" size={18} color="#16a34a" />
                <Text style={styles.coordsText}>
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </Text>
              </View>
            )}

            <TouchableOpacity style={[styles.locBtn, isLocating && styles.btnDisabled]} onPress={getCurrentLocation} disabled={isLocating}>
              {isLocating ? <ActivityIndicator size="small" color="#1e3a8a" /> : <Ionicons name="navigate" size={16} color="#1e3a8a" />}
              <Text style={styles.locBtnText}>{t.gpsAuto}</Text>
            </TouchableOpacity>
          </View>

          {/* ================= SECRET KEY SECTION ================= */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Store Saarthi Secret Key</Text>

            <View style={styles.secretBox}>
              <Ionicons name="key-outline" size={22} color="#1e3a8a" />
              <Text style={styles.secretText}>
                {secretKey ? secretKey : "•••• •••• ••••"}
              </Text>
            </View>

            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                style={[styles.secretBtn, { backgroundColor: "#fee2e2" }]}
                onPress={handleUnlockSecretKey}
              >
                <Ionicons name="refresh-outline" size={18} color="#b91c1c" />
                <Text style={[styles.secretBtnText, { color: "#b91c1c" }]}>Unlock Secret Key</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t.updateBtn}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
             <MaterialCommunityIcons name="logout-variant" size={20} color="#ef4444" />
             <Text style={styles.logoutText}>{t.logout}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODALS */}
      <AnalyticsPinModal
        visible={showPinModal}
        mode={pinMode}
        onClose={() => setShowPinModal(false)}
        onSuccess={(pin?: string) => {
          setShowPinModal(false);
          if (pin) {
            handleRegenerateSecretKey(pin);
            setHasPin(true);
          }
        }}
      />

      <Modal visible={langModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBar} />
              <Text style={styles.modalTitle}>{t.langSection}</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
                {LANGUAGES.map((item) => (
                <TouchableOpacity
                    key={item.code}
                    style={[styles.langOption, { backgroundColor: item.bgColor }, language === item.code && { borderWidth: 1.5, borderColor: item.symbolColor }]}
                    onPress={() => { changeLanguage(item.code); setLangModalVisible(false); }}
                >
                    <View style={styles.langLeftPart}>
                        <View style={[styles.symbolBadge, { backgroundColor: item.symbolColor }]}>
                           <Text style={styles.symbolText}>{item.symbol}</Text>
                        </View>
                        <Text style={[styles.langLabel, { color: '#1e293b' }]}>{item.title}</Text>
                    </View>
                    {language === item.code && <Ionicons name="checkmark-circle" size={26} color={item.symbolColor} />}
                </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= HELPERS ================= */

function CardInput({ label, icon, value, onChange, editable = true, placeholder = "", keyboardType }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, !editable && styles.fieldDisabled]}>
        <Ionicons name={icon} size={18} color="#94a3b8" />
        <TextInput value={value} onChangeText={onChange} editable={editable} placeholder={placeholder} placeholderTextColor="#cbd5e1" style={styles.textInput} keyboardType={keyboardType} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 16 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  headerSub: { color: "#64748b", fontSize: 13, marginTop: -2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 28, padding: 18, marginBottom: 16, elevation: 3, shadowColor: '#1e293b', shadowOpacity: 0.04, shadowRadius: 12 },
  sectionHeader: { fontSize: 11, fontWeight: "900", color: "#94a3b8", marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2 },
  dropdownSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f1f5f9', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  langLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  langIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  currentLangText: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: "800", color: "#475569", marginBottom: 8, marginLeft: 4 },
  field: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f8fafc", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  fieldDisabled: { backgroundColor: "#f1f5f9", borderColor: "#f1f5f9" },
  textInput: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1e293b" },
  row: { flexDirection: 'row' },
  locBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 18, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe' },
  locBtnText: { fontSize: 14, fontWeight: '800', color: '#1e3a8a' },
  coordsContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', padding: 12, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: '#bbf7d0' },
  coordsText: { fontSize: 13, fontWeight: '700', color: '#166534' },
  saveBtn: { backgroundColor: "#1e3a8a", padding: 20, borderRadius: 22, marginTop: 10, alignItems: 'center' },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 17, letterSpacing: 0.5 },
  btnDisabled: { opacity: 0.6 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 30, paddingVertical: 18, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#fee2e2' },
  logoutText: { color: '#ef4444', fontWeight: '900', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, paddingBottom: 44, maxHeight: '80%' },
  modalHeader: { alignItems: 'center', marginBottom: 24 },
  modalBar: { width: 45, height: 5, backgroundColor: '#e2e8f0', borderRadius: 3, marginBottom: 14 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 22, marginBottom: 12 },
  langLeftPart: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  symbolBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  symbolText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  langLabel: { fontSize: 17, fontWeight: '800' },
  toast: { position: "absolute", top: 10, left: 16, right: 16, zIndex: 999, flexDirection: "row", alignItems: 'center', gap: 12, padding: 18, borderRadius: 22, elevation: 12 },
  toastSuccess: { backgroundColor: "#10b981" },
  toastError: { backgroundColor: "#ef4444" },
  toastText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  /* 🔐 NEW SECRET KEY STYLES */
  secretBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f1f5f9",
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
  },
  secretText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#1e293b",
  },
  secretBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 18,
  },
  secretBtnText: {
    fontWeight: "800",
    color: "#1e3a8a",
  },
});