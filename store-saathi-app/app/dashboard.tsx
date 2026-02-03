import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  Alert,
  Dimensions,
  Linking,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

// API & Auth
import { getDashboard } from "../constants/dashboard.api";

// 🛠 PRINTER UTILS
import { 
  getConnectedThermalPrinter, 
  isThermalPrinterSaved,
  reconnectSavedPrinter 
} from "../utils/printerManager";
import { BluetoothEscposPrinter } from "@vardrz/react-native-bluetooth-escpos-printer";

// 🔤 LANGUAGE & PROVIDERS
import { LANGUAGE_TEXT_DASHBOARD } from "../constants/language";
import { useLanguage } from "../providers/LanguageProvider";

// Enhanced Components
import ProfileCard from "../components/dashboard/ProfileCard";
import TopDebtorCard from "../components/dashboard/TopDebtorCard";
import QuickActions from "../components/dashboard/QuickActions";
import MostSoldCard from "../components/dashboard/MostSoldCard";
import LowStockList from "../components/dashboard/LowStockList";
import RecentBills from "../components/dashboard/RecentBills";
import PageLoader from "@/components/PageLoader";

const { width } = Dimensions.get("window");

/**
 * DashboardPage component
 * Highly optimized for inventory and billing management with integrated printer controls.
 */
export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Printer Status States
  const [connectingPrinter, setConnectingPrinter] = useState(false);
  const [printerStatus, setPrinterStatus] = useState<"connected" | "offline" | "none">("none");
  const [printerName, setPrinterName] = useState("");

  const router = useRouter();
  const isFocused = useIsFocused();
  const { language } = useLanguage();
  
  const t = LANGUAGE_TEXT_DASHBOARD[language] || LANGUAGE_TEXT_DASHBOARD.en;

  // --- Logic: Check Printer Status ---
  const checkPrinterStatus = async () => {
    const hasSaved = await isThermalPrinterSaved();
    if (!hasSaved) {
      setPrinterStatus("none");
      setPrinterName("");
      return;
    }

    try {
      // Attempt a silent check to see if the printer is actually reachable
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.LEFT
      );
      const printer = await getConnectedThermalPrinter();
      setPrinterStatus("connected");
      setPrinterName(printer?.name || "Thermal Printer");
    } catch (e) {
      setPrinterStatus("offline");
      // Even if offline, we might want to show the last saved name if available
      const printer = await getConnectedThermalPrinter();
      setPrinterName(printer?.name || "Saved Printer");
    }
  };

  /**
   * Manual connection trigger from the dashboard button
   */
  const handleConnectPrinterFromDashboard = async () => {
    if (connectingPrinter) return;

    setConnectingPrinter(true);
    try {
      const success = await reconnectSavedPrinter();

      if (!success) {
        setPrinterStatus("offline");
        Alert.alert(
          "Printer Offline",
          "Please turn on your printer, ensure Bluetooth is active, and try again."
        );
        return;
      }

      // Verify the hardware connection is responsive
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.LEFT
      );

      const printer = await getConnectedThermalPrinter();
      setPrinterStatus("connected");
      setPrinterName(printer?.name || "Thermal Printer");
      
      // Optional feedback
      if (Platform.OS === 'android') {
        // Simple toast or alert can go here
      }
    } catch (e) {
      setPrinterStatus("offline");
      Alert.alert("Connection Failed", "Unable to communicate with the printer.");
    } finally {
      setConnectingPrinter(false);
    }
  };

  const fetchData = async () => {
    try {
      const res = await getDashboard();
      if (res.data?.dashboard) {
        setDashboard(res.data.dashboard);
      }
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      Alert.alert("Error", t.errorFetch);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isFocused) {
      checkPrinterStatus();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    checkPrinterStatus();
  };

  if (loading) return <PageLoader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1e3a8a"
            colors={["#1e3a8a"]}
          />
        }
      >
        {/* 1. Header Section */}
        <View style={styles.headerCurveContainer}>
          <SafeAreaView edges={["top"]}>
            <ProfileCard shop={dashboard?.shop} />
          </SafeAreaView>
          {/* Subtle Decorative Circle */}
          <View style={styles.headerDecorator} />
        </View>

        {/* 🆕 UPDATE BANNER */}
        {dashboard?.updateAvailable && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.updateBanner}
            onPress={() => {
              if (dashboard?.playStoreUrl) {
                Linking.openURL(dashboard.playStoreUrl);
              } else {
                Alert.alert("Update Available", "Please update from Play Store.");
              }
            }}
          >
            <View style={styles.updateIconBg}>
              <MaterialCommunityIcons name="rocket-launch" size={20} color="#fff" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.updateTitle}>Update Available</Text>
              <Text style={styles.updateText} numberOfLines={1}>
                {dashboard?.updateMessage || "Get the latest features and fixes"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* 2. Floating Top Debtor Card */}
        {dashboard?.topDebtor && (
          <View style={styles.overlapCard}>
            <TopDebtorCard
              debtor={dashboard.topDebtor}
              shopName={dashboard?.shop?.shopName}
              ownerName={dashboard?.shop?.ownerName}
            />
          </View>
        )}

        {/* 3. Feature Navigation */}
        <View style={styles.sectionSpacing}>
          <QuickActions />
        </View>

        {/* 4. Primary Actions (Billing & Printer) */}
        <View style={styles.actionButtonsContainer}>
          
          {/* CREATE BILL BUTTON */}
          <TouchableOpacity
            style={styles.createBillButton}
            onPress={() => router.push("/billing")}
            activeOpacity={0.9}
          >
            <View style={styles.buttonInner}>
              <View style={styles.iconCircle}>
                <Ionicons name="barcode-outline" size={26} color="#fff" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.createBillText}>{t.createBill}</Text>
                <Text style={styles.buttonSubtitle}>Scan or add items manually</Text>
              </View>
              <View style={styles.plusBadge}>
                <Feather name="plus" size={16} color="#1e3a8a" />
              </View>
            </View>
          </TouchableOpacity>

          {/* DYNAMIC PRINTER CONTROL CARD */}
          <View style={styles.printerCardMain}>
            <View style={styles.printerCardTop}>
              <View style={[
                styles.iconCirclePurple, 
                printerStatus === "connected" && styles.iconCircleGreen
              ]}>
                <Feather 
                  name="printer" 
                  size={22} 
                  color={printerStatus === "connected" ? "#16a34a" : "#4f46e5"} 
                />
              </View>
              
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.testPrinterText}>
                    {printerStatus === "none" ? "No Printer Setup" : (printerName || "Thermal Printer")}
                  </Text>
                  
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: printerStatus === "connected" ? "#dcfce7" : printerStatus === "offline" ? "#fee2e2" : "#f1f5f9" }
                  ]}>
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: printerStatus === "connected" ? "#22c55e" : printerStatus === "offline" ? "#ef4444" : "#94a3b8" }
                    ]} />
                    <Text style={[
                      styles.statusBadgeText,
                      { color: printerStatus === "connected" ? "#166534" : printerStatus === "offline" ? "#991b1b" : "#64748b" }
                    ]}>
                      {printerStatus === "connected" ? "Online" : printerStatus === "offline" ? "Offline" : "None"}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.buttonSubtitle, { color: "#64748b" }]} numberOfLines={1}>
                  {printerStatus === "connected" 
                    ? "Ready to print receipts" 
                    : printerStatus === "offline" 
                    ? "Saved printer not reachable" 
                    : "Configure a printer to start"}
                </Text>
              </View>
            </View>

            <View style={styles.printerActionRow}>
              {/* SETUP BUTTON - Always available to go to setup screen */}
              <TouchableOpacity 
                style={styles.printerActionButton} 
                onPress={() => router.push("/PrintTest")}
              >
                <Feather name="settings" size={16} color="#1e3a8a" />
                <Text style={styles.printerActionText}>Setup</Text>
              </TouchableOpacity>

              {/* CONNECT BUTTON - Only shown if printer is saved but offline */}
              {printerStatus === "offline" && (
                <TouchableOpacity 
                  style={[styles.printerActionButton, styles.printerActionPrimary]} 
                  onPress={handleConnectPrinterFromDashboard}
                  disabled={connectingPrinter}
                >
                  {connectingPrinter ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="bluetooth-connect" size={18} color="#fff" />
                      <Text style={[styles.printerActionText, { color: "#fff" }]}>Connect</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* TEST PRINT BUTTON - Only shown if connected */}
              {printerStatus === "connected" && (
                <TouchableOpacity 
                  style={[styles.printerActionButton, styles.printerActionSuccess]} 
                  onPress={() => router.push("/PrintTest")}
                >
                  <Feather name="check-circle" size={16} color="#16a34a" />
                  <Text style={[styles.printerActionText, { color: "#16a34a" }]}>Test Print</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* 7. Recent Bills */}
        <View style={styles.sectionSpacing}>
          <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Recent Bills</Text>
             <View style={styles.titleUnderline} />
          </View>
          <RecentBills bills={dashboard?.recentBills || []} />
        </View>
        {/* 5. Alerts - Low Stock */}
        

        {/* 6. Insights - Most Sold */}
        <View style={styles.sectionSpacing}>
          <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Top Selling Items</Text>
             <View style={styles.titleUnderline} />
          </View>
          <MostSoldCard items={dashboard?.mostSold || []} />
        </View>

        <View style={styles.sectionSpacing}>
          <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Inventory Alerts</Text>
             <View style={styles.titleUnderline} />
          </View>
          <LowStockList items={dashboard?.lowStock || []} />
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC" 
  },
  scrollContent: { 
    paddingBottom: 40 
  },
  flex1: { flex: 1 },

  headerCurveContainer: {
    backgroundColor: "#1e3a8a",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingBottom: 20,
    paddingHorizontal: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecorator: {
    position: 'absolute',
    right: -50,
    top: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  updateBanner: {
    marginHorizontal: 16,
    marginTop: -60,
    marginBottom: 30,
    backgroundColor: "#e11d48",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 8,
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 100,
  },
  updateIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  updateTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  updateText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    marginTop: 1,
  },

  overlapCard: { 
    marginTop: -25, 
    paddingHorizontal: 4,
    zIndex: 1,
  },
  
  sectionSpacing: { 
    marginTop: 15 
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 40,
    height: 4,
    backgroundColor: "#1e3a8a",
    borderRadius: 2,
    marginTop: 4,
  },

  actionButtonsContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    gap: 14,
  },

  createBillButton: {
    backgroundColor: "#1e3a8a",
    borderRadius: 24,
    paddingVertical: 20,
    elevation: 6,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonInner: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 18 
  },
  textContainer: { 
    flex: 1, 
    marginLeft: 15 
  },
  titleRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8 
  },
  
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
  },
  statusDot: { 
    width: 7, 
    height: 7, 
    borderRadius: 4 
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  buttonSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },

  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  createBillText: { 
    color: "#fff", 
    fontSize: 19, 
    fontWeight: "900",
  },
  plusBadge: {
    width: 28,
    height: 28,
    backgroundColor: "#fff",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  // 🛠 NEW PRINTER CARD STYLES
  printerCardMain: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  printerCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  printerActionRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 12,
  },
  printerActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    gap: 8,
  },
  printerActionPrimary: {
    backgroundColor: "#1e3a8a",
    borderColor: "#1e3a8a",
  },
  printerActionSuccess: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  printerActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e3a8a",
  },
  iconCirclePurple: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleGreen: {
    backgroundColor: "#f0fdf4",
  },
  testPrinterText: { 
    color: "#1e293b", 
    fontSize: 17, 
    fontWeight: "700",
    maxWidth: width * 0.4
  },

  bottomSpacer: { height: 50 },
});