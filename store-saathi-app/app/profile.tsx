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
import PageLoader from "@/components/PageLoader";
/* 🛠 API & AUTH */
import { onboardShop, getMe } from "../constants/auth.api";
import { useAuth } from "../providers/AuthProvider";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_PROFILE } from "../constants/language_profile";
import { useLanguage } from "../providers/LanguageProvider";

// UPDATED: Added your specific language configurations
export const LANGUAGES = [
  {
    code: 'hi',
    title: 'हिंदी',
    symbol: 'अ',
    bgColor: '#E3F2FD', // Light Blue
    symbolColor: '#2196F3', 
  },
  {
    code: 'en',
    title: 'English',
    symbol: 'A',
    bgColor: '#E8F5E9', // Light Green
    symbolColor: '#4CAF50',
  },
  {
    code: 'pa',
    title: 'Punjabi-ਪੰਜਾਬੀ',
    symbol: 'ਅ',
    bgColor: '#FFF3E0', // Light Peach
    symbolColor: '#FF9800',
  },
  {
    code: 'gu',
    title: 'Gujarati-ગુજરાતી',
    symbol: 'અ',
    bgColor: '#FFE0B2', // Light Orange
    symbolColor: '#E65100',
  },
  {
    code: 'mr',
    title: 'Marathi-मराठी',
    symbol: 'आ',
    bgColor: '#E0F2F1', // Light Mint
    symbolColor: '#FF5722',
  },
  {
    code: 'te',
    title: 'Telugu-తెలుగు',
    symbol: 'అ',
    bgColor: '#FFFDE7', // Light Yellow
    symbolColor: '#C6A700',
  },
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
  const [location, setLocation] = useState("");

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
        setLocation(shop.location ?? "");
      } catch {
        showToast(t.failedLoad, "error");
      } finally {
        mounted && setLoading(false);
      }
    }
    loadProfile();
    return () => { mounted = false; };
  }, [language]);

  const getCurrentLocation = async () => {
    try {
      setIsLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast(t.toastPermDeny || "Permission denied", "error");
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
        showToast(t.locUpdated, "success");
      }
    } catch {
      showToast("Error", "error");
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
      await onboardShop({ shopName, ownerName, gstNumber, storeCategory, upiId, location });
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

  if (loading) {
    return (
     <PageLoader/>
    );
  }

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
          
          {/* LANGUAGE SELECT OPTION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>{t.langSection}</Text>
            <TouchableOpacity 
              style={styles.dropdownSelector} 
              onPress={() => setLangModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.langLeft}>
                <View style={styles.langIconBg}>
                    <MaterialCommunityIcons name="translate" size={18} color="#1e3a8a" />
                </View>
                <Text style={styles.currentLangText}>
                  {LANGUAGES.find(l => l.code === language)?.title}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* IDENTITY SECTION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>{t.identity}</Text>
            <CardInput label={t.shopName} icon="business-outline" value={shopName} onChange={setShopName} placeholder="E.g. Super Mart" />
            <CardInput label={t.ownerName} icon="person-outline" value={ownerName} onChange={setOwnerName} placeholder="Enter your name" />
            <CardInput label={t.phone} icon="call-outline" value={mobileNumber} editable={false} />
          </View>

          {/* BIZ DETAILS SECTION */}
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

          {/* LOCATION SECTION */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>{t.location}</Text>
            <View style={styles.locationContainer}>
              <TextInput
                style={styles.locationInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter full address"
                multiline
              />
              <TouchableOpacity 
                style={[styles.locBtn, isLocating && styles.btnDisabled]} 
                onPress={getCurrentLocation} 
                disabled={isLocating}
              >
                {isLocating ? <ActivityIndicator size="small" color="#1e3a8a" /> : <Ionicons name="navigate" size={16} color="#1e3a8a" />}
                <Text style={styles.locBtnText}>{t.gpsAuto}</Text>
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

      {/* LANGUAGE SELECTION MODAL */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setLangModalVisible(false)} 
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBar} />
              <Text style={styles.modalTitle}>{t.langSection}</Text>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
                {LANGUAGES.map((item) => (
                <TouchableOpacity
                    key={item.code}
                    style={[
                      styles.langOption, 
                      { backgroundColor: item.bgColor }, // Applied dynamic background
                      language === item.code && { borderWidth: 1.5, borderColor: item.symbolColor }
                    ]}
                    onPress={() => {
                        changeLanguage(item.code);
                        setLangModalVisible(false);
                    }}
                >
                    <View style={styles.langLeftPart}>
                        <View style={[styles.symbolBadge, { backgroundColor: item.symbolColor }]}>
                           <Text style={styles.symbolText}>{item.symbol}</Text>
                        </View>
                        <Text style={[styles.langLabel, { color: '#1e293b' }]}>{item.title}</Text>
                    </View>
                    {language === item.code && (
                        <Ionicons name="checkmark-circle" size={26} color={item.symbolColor} />
                    )}
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

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: '#64748b', fontWeight: '700' },
  header: { flexDirection: "row", alignItems: "center", padding: 20, gap: 16 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  headerSub: { color: "#64748b", fontSize: 13, marginTop: -2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 60 },
  
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#1e293b',
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  sectionHeader: { fontSize: 11, fontWeight: "900", color: "#94a3b8", marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1.2 },

  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  langLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  langIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  currentLangText: { fontSize: 16, fontWeight: '700', color: '#1e293b' },

  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: "800", color: "#475569", marginBottom: 8, marginLeft: 4 },
  field: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f8fafc", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  fieldDisabled: { backgroundColor: "#f1f5f9", borderColor: "#f1f5f9" },
  textInput: { flex: 1, fontSize: 15, fontWeight: "600", color: "#1e293b" },
  row: { flexDirection: 'row' },
  
  locationContainer: { gap: 12 },
  locationInput: { fontSize: 15, fontWeight: '600', color: '#1e293b', minHeight: 90, textAlignVertical: 'top', backgroundColor: '#f8fafc', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  locBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 18, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe' },
  locBtnText: { fontSize: 14, fontWeight: '800', color: '#1e3a8a' },

  saveBtn: { backgroundColor: "#1e3a8a", padding: 20, borderRadius: 22, marginTop: 10, alignItems: 'center', shadowColor: "#1e3a8a", shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
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

  toast: { position: "absolute", top: 10, left: 16, right: 16, zIndex: 999, flexDirection: "row", alignItems: 'center', gap: 12, padding: 18, borderRadius: 22, elevation: 12, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15 },
  toastSuccess: { backgroundColor: "#10b981" },
  toastError: { backgroundColor: "#ef4444" },
  toastText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});