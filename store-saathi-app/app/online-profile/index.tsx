import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { useOnlineProfile } from "../../hooks/useOnlineProfile";
import PageLoader from "../../components/PageLoader";

/* ================= PAYMENT METHODS OPTIONS ================= */
const PAYMENT_METHODS = [
  { value: "COD", label: "Cash on Delivery", icon: "cash-outline" },
  { value: "UPI", label: "UPI", icon: "wallet-outline" },
];

export default function OnlineProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    defaults,
    loading,
    error,
    saving,
    refetch,
    saveProfile,
    toggleOnlineStatus,
  } = useOnlineProfile();

  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const qrRef = useRef<any>(null);

  /* ================= EDIT FORM STATE ================= */
  const [formData, setFormData] = useState<Record<string, any>>({});

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleToggleOnline = async () => {
    if (!profile) {
      Alert.alert("Setup Required", "Please set up your online profile first.");
      return;
    }
    const result = await toggleOnlineStatus();
    if (result.success) {
      Alert.alert(
        "Status Updated",
        `Your store is now ${result.isStoreOnline ? "Online" : "Offline"}`
      );
    }
  };

  const shopUrl = profile?.shop
    ? `https://storesaarthicustomer.vercel.app/shop/${profile.shop}`
    : "";

  const handleDownloadQR = async () => {
    if (!qrRef.current) return;

    qrRef.current.toDataURL(async (dataURL: string) => {
      try {
        const file = new File(Paths.cache, "store-qr-code.png");
        const binaryString = atob(dataURL);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        file.write(bytes);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, {
            mimeType: "image/png",
            dialogTitle: "Save QR Code",
          });
        } else {
          Alert.alert("Saved", `QR code saved to:\n${file.uri}`);
        }
      } catch (err) {
        console.error("QR download error:", err);
        Alert.alert("Error", "Failed to download QR code");
      }
    });
  };

  const startEditing = () => {
    setFormData({
      storeName: profile?.storeName || defaults?.storeName || "",
      ownerName: profile?.ownerName || defaults?.ownerName || "",
      storeDescription: profile?.storeDescription || "",
      mobileNumber: profile?.mobileNumber || defaults?.mobileNumber || "",
      whatsappNumber: profile?.whatsappNumber || "",
      email: profile?.email || "",
      upiId: profile?.upiId || defaults?.upiId || "",
      deliveryCharges: String(profile?.deliveryCharges || 0),
      freeDeliveryAbove: String(profile?.freeDeliveryAbove || 0),
      minimumOrderAmount: String(profile?.minimumOrderAmount || 0),
      deliveryRadius: String(profile?.deliveryRadius || 5),
      estimatedDeliveryTime: profile?.estimatedDeliveryTime || "",
      street: profile?.address?.street || defaults?.address?.street || "",
      city: profile?.address?.city || defaults?.address?.city || "",
      state: profile?.address?.state || defaults?.address?.state || "",
      pincode: profile?.address?.pincode || defaults?.address?.pincode || "",
      openTime: profile?.businessHours?.openTime || "09:00",
      closeTime: profile?.businessHours?.closeTime || "21:00",
      acceptedPaymentMethods: profile?.acceptedPaymentMethods || ["COD"],
      isDeliveryAvailable: profile?.isDeliveryAvailable ?? true,
      isPickupAvailable: profile?.isPickupAvailable ?? false,
      isDineInAvailable: profile?.isDineInAvailable ?? false,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!formData.storeName?.trim()) {
      Alert.alert("Required", "Store name is required");
      return;
    }
    if (!formData.mobileNumber?.trim()) {
      Alert.alert("Required", "Mobile number is required");
      return;
    }
    if (!formData.acceptedPaymentMethods?.length) {
      Alert.alert("Required", "Please select at least one payment method");
      return;
    }

    const payload = {
      storeName: formData.storeName.trim(),
      ownerName: formData.ownerName.trim(),
      storeDescription: formData.storeDescription.trim(),
      mobileNumber: formData.mobileNumber.trim(),
      whatsappNumber: formData.whatsappNumber.trim(),
      email: formData.email.trim(),
      upiId: formData.upiId.trim(),
      deliveryCharges: Number(formData.deliveryCharges) || 0,
      freeDeliveryAbove: Number(formData.freeDeliveryAbove) || 0,
      minimumOrderAmount: Number(formData.minimumOrderAmount) || 0,
      deliveryRadius: Number(formData.deliveryRadius) || 5,
      estimatedDeliveryTime: formData.estimatedDeliveryTime.trim(),
      address: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      },
      businessHours: {
        openTime: formData.openTime,
        closeTime: formData.closeTime,
      },
      acceptedPaymentMethods: formData.acceptedPaymentMethods,
      isDeliveryAvailable: formData.isDeliveryAvailable,
      isPickupAvailable: formData.isPickupAvailable,
      isDineInAvailable: formData.isDineInAvailable,
    };

    const result = await saveProfile(payload);
    if (result.success) {
      setEditing(false);
      Alert.alert("Success", "Profile saved successfully!");
      refetch();
    } else {
      Alert.alert("Error", result.message || "Failed to save profile");
    }
  };

  if (loading) return <PageLoader />;

  const isOnline = profile?.isStoreOnline ?? false;
  const profileExists = !!profile;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Online Profile</Text>
        {profileExists && !editing ? (
          <TouchableOpacity style={styles.editButton} onPress={startEditing}>
            <Ionicons name="create-outline" size={20} color="#2563eb" />
          </TouchableOpacity>
        ) : editing ? (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(false)}
          >
            <Ionicons name="close" size={20} color="#ef4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1e3a8a"
            colors={["#1e3a8a"]}
          />
        }
      >
        {/* ERROR MESSAGE */}
        {error && (
          <View style={{ marginHorizontal: 16, marginTop: 12 }}>
            <Text style={{ color: "#dc2626", fontSize: 13, fontWeight: "600" }}>
              {error}
            </Text>
          </View>
        )}

        {/* STORE STATUS CARD */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? "#22c55e" : "#ef4444" },
              ]}
            />
            <View>
              <Text style={styles.statusTitle}>
                Store is {isOnline ? "Online" : "Offline"}
              </Text>
              <Text style={styles.statusSub}>
                {isOnline
                  ? "Customers can place orders"
                  : "Ordering is paused"}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }}
            thumbColor={isOnline ? "#16a34a" : "#94a3b8"}
            disabled={saving || !profileExists}
          />
        </View>

        {/* NO PROFILE - SETUP PROMPT */}
        {!profileExists && !editing && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons
                name="store-outline"
                size={48}
                color="#cbd5e1"
              />
            </View>
            <Text style={styles.emptyTitle}>No Online Profile</Text>
            <Text style={styles.emptySubtitle}>
              Set up your online store profile so customers can find you and
              place orders
            </Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={startEditing}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.setupButtonText}>Set Up Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EDIT MODE */}
        {editing && (
          <View style={styles.formContainer}>
            {/* STORE INFO */}
            <Text style={styles.sectionTitle}>Store Information</Text>
            <View style={styles.card}>
              <FormField
                label="Store Name *"
                value={formData.storeName}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, storeName: v })
                }
                placeholder="Your store name"
              />
              <FormField
                label="Owner Name"
                value={formData.ownerName}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, ownerName: v })
                }
                placeholder="Owner name"
              />
              <FormField
                label="Description"
                value={formData.storeDescription}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, storeDescription: v })
                }
                placeholder="Short store description"
                multiline
              />
            </View>

            {/* CONTACT */}
            <Text style={styles.sectionTitle}>Contact Details</Text>
            <View style={styles.card}>
              <FormField
                label="Mobile Number *"
                value={formData.mobileNumber}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, mobileNumber: v })
                }
                placeholder="10-digit mobile"
                keyboardType="phone-pad"
              />
              <FormField
                label="WhatsApp Number"
                value={formData.whatsappNumber}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, whatsappNumber: v })
                }
                placeholder="WhatsApp number"
                keyboardType="phone-pad"
              />
              <FormField
                label="Email"
                value={formData.email}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, email: v })
                }
                placeholder="store@email.com"
                keyboardType="email-address"
              />
              <FormField
                label="UPI ID"
                value={formData.upiId}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, upiId: v })
                }
                placeholder="your@upi"
              />
            </View>

            {/* ADDRESS */}
            <Text style={styles.sectionTitle}>Address</Text>
            <View style={styles.card}>
              <FormField
                label="Street"
                value={formData.street}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, street: v })
                }
                placeholder="Street address"
              />
              <FormField
                label="City"
                value={formData.city}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, city: v })
                }
                placeholder="City"
              />
              <FormField
                label="State"
                value={formData.state}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, state: v })
                }
                placeholder="State"
              />
              <FormField
                label="Pincode"
                value={formData.pincode}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, pincode: v })
                }
                placeholder="6-digit pincode"
                keyboardType="number-pad"
              />
            </View>

            {/* DELIVERY SETTINGS */}
            <Text style={styles.sectionTitle}>Delivery Settings</Text>
            <View style={styles.card}>
              <FormField
                label="Delivery Charges (₹)"
                value={formData.deliveryCharges}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, deliveryCharges: v })
                }
                placeholder="0"
                keyboardType="number-pad"
              />
              <FormField
                label="Free Delivery Above (₹)"
                value={formData.freeDeliveryAbove}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, freeDeliveryAbove: v })
                }
                placeholder="0 = no free delivery"
                keyboardType="number-pad"
              />
              <FormField
                label="Minimum Order (₹)"
                value={formData.minimumOrderAmount}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, minimumOrderAmount: v })
                }
                placeholder="0"
                keyboardType="number-pad"
              />
              <FormField
                label="Delivery Radius (km)"
                value={formData.deliveryRadius}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, deliveryRadius: v })
                }
                placeholder="5"
                keyboardType="number-pad"
              />
              <FormField
                label="Estimated Delivery Time"
                value={formData.estimatedDeliveryTime}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, estimatedDeliveryTime: v })
                }
                placeholder="e.g. 30-45 mins"
              />
            </View>

            {/* BUSINESS HOURS */}
            <Text style={styles.sectionTitle}>Business Hours</Text>
            <View style={styles.card}>
              <FormField
                label="Opening Time"
                value={formData.openTime}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, openTime: v })
                }
                placeholder="09:00"
              />
              <FormField
                label="Closing Time"
                value={formData.closeTime}
                onChangeText={(v: string) =>
                  setFormData({ ...formData, closeTime: v })
                }
                placeholder="21:00"
              />
            </View>

            {/* ORDER MODES */}
            <Text style={styles.sectionTitle}>Order Modes</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="bicycle-outline" size={20} color="#1e3a8a" />
                  <Text style={styles.toggleLabel}>Delivery</Text>
                </View>
                <Switch
                  value={formData.isDeliveryAvailable}
                  onValueChange={(v) =>
                    setFormData({ ...formData, isDeliveryAvailable: v })
                  }
                  trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }}
                  thumbColor={formData.isDeliveryAvailable ? "#16a34a" : "#94a3b8"}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="walk-outline" size={20} color="#1e3a8a" />
                  <Text style={styles.toggleLabel}>Pickup</Text>
                </View>
                <Switch
                  value={formData.isPickupAvailable}
                  onValueChange={(v) =>
                    setFormData({ ...formData, isPickupAvailable: v })
                  }
                  trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }}
                  thumbColor={formData.isPickupAvailable ? "#16a34a" : "#94a3b8"}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Ionicons name="restaurant-outline" size={20} color="#1e3a8a" />
                  <Text style={styles.toggleLabel}>Dine-In</Text>
                </View>
                <Switch
                  value={formData.isDineInAvailable}
                  onValueChange={(v) =>
                    setFormData({ ...formData, isDineInAvailable: v })
                  }
                  trackColor={{ false: "#e2e8f0", true: "#bbf7d0" }}
                  thumbColor={formData.isDineInAvailable ? "#16a34a" : "#94a3b8"}
                />
              </View>
            </View>

            {/* PAYMENT METHODS */}
            <Text style={styles.sectionTitle}>Accepted Payment Methods</Text>
            <View style={styles.card}>
              <Text style={styles.paymentHint}>
                Toggle which payment methods your customers can use
              </Text>
              <View style={styles.paymentMethodsContainer}>
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = (formData.acceptedPaymentMethods || []).includes(method.value);
                  return (
                    <TouchableOpacity
                      key={method.value}
                      style={[
                        styles.paymentChip,
                        isSelected && styles.paymentChipActive,
                      ]}
                      onPress={() => {
                        const current = formData.acceptedPaymentMethods || [];
                        const updated = isSelected
                          ? current.filter((m: string) => m !== method.value)
                          : [...current, method.value];
                        setFormData({ ...formData, acceptedPaymentMethods: updated });
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={method.icon as any}
                        size={18}
                        color={isSelected ? "#fff" : "#475569"}
                      />
                      <Text
                        style={[
                          styles.paymentChipText,
                          isSelected && styles.paymentChipTextActive,
                        ]}
                      >
                        {method.label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SAVE BUTTON */}
            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Profile</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* VIEW MODE */}
        {profileExists && !editing && (
          <>
            {/* QR CODE SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Store QR Code</Text>
              <View style={[styles.card, styles.qrCard]}>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={shopUrl}
                    size={200}
                    backgroundColor="#fff"
                    color="#1e293b"
                    getRef={(ref: any) => (qrRef.current = ref)}
                  />
                </View>
                <Text style={styles.qrUrl} numberOfLines={2}>
                  {shopUrl}
                </Text>
                <TouchableOpacity
                  style={styles.downloadQrButton}
                  onPress={handleDownloadQR}
                  activeOpacity={0.8}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.downloadQrText}>Download QR Code</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* STORE INFO SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Store Information</Text>
              <View style={styles.card}>
                <InfoRow
                  icon="storefront-outline"
                  label="Store Name"
                  value={profile.storeName}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="person-outline"
                  label="Owner"
                  value={profile.ownerName}
                />
                {profile.storeDescription ? (
                  <>
                    <View style={styles.divider} />
                    <InfoRow
                      icon="document-text-outline"
                      label="Description"
                      value={profile.storeDescription}
                    />
                  </>
                ) : null}
              </View>
            </View>

            {/* CONTACT SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              <View style={styles.card}>
                <InfoRow
                  icon="call-outline"
                  label="Mobile"
                  value={profile.mobileNumber}
                />
                {profile.whatsappNumber ? (
                  <>
                    <View style={styles.divider} />
                    <InfoRow
                      icon="logo-whatsapp"
                      label="WhatsApp"
                      value={profile.whatsappNumber}
                    />
                  </>
                ) : null}
                {profile.email ? (
                  <>
                    <View style={styles.divider} />
                    <InfoRow
                      icon="mail-outline"
                      label="Email"
                      value={profile.email}
                    />
                  </>
                ) : null}
                {profile.upiId ? (
                  <>
                    <View style={styles.divider} />
                    <InfoRow icon="wallet-outline" label="UPI" value={profile.upiId} />
                  </>
                ) : null}
              </View>
            </View>

            {/* ADDRESS SECTION */}
            {(profile.address?.street || profile.address?.city) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Address</Text>
                <View style={styles.card}>
                  <InfoRow
                    icon="location-outline"
                    label="Address"
                    value={[
                      profile.address.street,
                      profile.address.city,
                      profile.address.state,
                      profile.address.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />
                </View>
              </View>
            )}

            {/* DELIVERY SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Settings</Text>
              <View style={styles.card}>
                <InfoRow
                  icon="cash-outline"
                  label="Delivery Charges"
                  value={`₹${profile.deliveryCharges}`}
                />
                {profile.freeDeliveryAbove > 0 && (
                  <>
                    <View style={styles.divider} />
                    <InfoRow
                      icon="gift-outline"
                      label="Free Delivery Above"
                      value={`₹${profile.freeDeliveryAbove}`}
                    />
                  </>
                )}

                {profile.minimumOrderAmount > 0 && (
                  <>
                    <View style={styles.divider} />
                    <InfoRow
                      icon="cart-outline"
                      label="Min. Order"
                      value={`₹${profile.minimumOrderAmount}`}
                    />
                  </>
                )}
                <View style={styles.divider} />
                <InfoRow
                  icon="navigate-outline"
                  label="Delivery Radius"
                  value={`${profile.deliveryRadius} km`}
                />
                {profile.estimatedDeliveryTime ? (
                  <>
                    <View style={styles.divider} />
                    <InfoRow
                      icon="time-outline"
                      label="Est. Delivery Time"
                      value={profile.estimatedDeliveryTime}
                    />
                  </>
                ) : null}
              </View>
            </View>

            {/* ORDERING CONFIG SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ordering Config</Text>
              <View style={styles.card}>
                <InfoRow
                  icon="globe-outline"
                  label="Online Ordering"
                  value={profile.isOnlineOrderingEnabled ? "Enabled" : "Disabled"}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="bicycle-outline"
                  label="Delivery Available"
                  value={profile.isDeliveryAvailable ? "Yes" : "No"}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="walk-outline"
                  label="Pickup Available"
                  value={profile.isPickupAvailable ? "Yes" : "No"}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="restaurant-outline"
                  label="Dine-In Available"
                  value={profile.isDineInAvailable ? "Yes" : "No"}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="card-outline"
                  label="Payment Methods"
                  value={profile.acceptedPaymentMethods?.join(", ") || "COD"}
                />
              </View>
            </View>

            {/* BUSINESS HOURS SECTION */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Hours</Text>
              <View style={styles.card}>
                <InfoRow
                  icon="sunny-outline"
                  label="Open"
                  value={profile.businessHours?.openTime || "09:00"}
                />
                <View style={styles.divider} />
                <InfoRow
                  icon="moon-outline"
                  label="Close"
                  value={profile.businessHours?.closeTime || "21:00"}
                />
                {profile.businessHours?.offDays?.length > 0 && (
                  <>
                    <View style={styles.divider} />
                    <InfoRow
                      icon="calendar-outline"
                      label="Off Days"
                      value={profile.businessHours.offDays.join(", ")}
                    />
                  </>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}


/* ================= HELPER COMPONENTS ================= */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon as any} size={18} color="#1e3a8a" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "—"}</Text>
      </View>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}


/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    padding: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  headerTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: "#0f172a",
  },
  editButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#f0f7ff",
  },

  /* STATUS CARD */
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  statusSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },

  /* SECTIONS */
  section: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },

  /* INFO ROW */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "600",
    marginTop: 2,
  },

  /* FORM FIELDS */
  formContainer: {
    marginHorizontal: 16,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
    marginLeft: 2,
  },
  fieldInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
  fieldMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  /* SAVE BUTTON */
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e3a8a",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
    marginBottom: 20,
    gap: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  /* QR CODE */
  qrCard: {
    alignItems: "center",
    paddingVertical: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  qrUrl: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 16,
  },
  downloadQrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e3a8a",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  downloadQrText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  /* EMPTY STATE */
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#475569",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  setupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e3a8a",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 24,
    gap: 8,
  },
  setupButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  /* TOGGLE ROW */
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
  },

  /* PAYMENT METHODS */
  paymentHint: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 12,
  },
  paymentMethodsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  paymentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  paymentChipActive: {
    backgroundColor: "#1e3a8a",
    borderColor: "#1e3a8a",
  },
  paymentChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
  paymentChipTextActive: {
    color: "#fff",
  },
});
