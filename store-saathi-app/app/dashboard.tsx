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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

// API & Auth
import { getDashboard } from "../constants/dashboard.api";

// 🛠 PRINTER UTILS
import { 
  getConnectedThermalPrinter, 
  isThermalPrinterSaved 
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

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Printer Status States
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
      return;
    }

    try {
      // Test real connection by sending a "get status" style empty command
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      const printer = await getConnectedThermalPrinter();
      setPrinterStatus("connected");
      setPrinterName(printer?.name || "Thermal Printer");
    } catch (e) {
      // If the command fails, it's saved but currently unreachable (Bluetooth off or printer off)
      setPrinterStatus("offline");
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

  // Re-check printer every time user navigates back to Dashboard
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
            tintColor="#1e4de4" 
          />
        }
      >
        {/* 1. Header Section with Profile Card */}
        <View style={styles.headerCurveContainer}>
          <SafeAreaView edges={["top"]}>
             <ProfileCard shop={dashboard?.shop} />
          </SafeAreaView>
        </View>

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

        {/* 3. Feature Navigation Tiles */}
        <View style={styles.sectionSpacing}>
          <QuickActions />
        </View>

        {/* 4. Primary Actions: Create Bill + Test Printer */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.createBillButton}
            onPress={() => router.push("/billing")}
            activeOpacity={0.9}
          >
            <View style={styles.buttonInner}>
              <View style={styles.iconCircle}>
                <Ionicons name="barcode-outline" size={24} color="#fff" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.createBillText}>{t.createBill}</Text>
                <Text style={styles.buttonSubtitle}>Generate new invoice quickly</Text>
              </View>
              <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testPrinterButton}
            onPress={() => router.push("/PrintTest")}
            activeOpacity={0.8}
          >
            <View style={styles.buttonInner}>
              <View style={styles.iconCirclePurple}>
                <Feather name="printer" size={22} color="#7c3aed" />
              </View>
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                    <Text style={styles.testPrinterText}>{t.testPrinter}</Text>
                    {/* Connection Status Dot */}
                    <View style={[
                        styles.statusDot, 
                        { backgroundColor: printerStatus === "connected" ? "#10b981" : printerStatus === "offline" ? "#f59e0b" : "#cbd5e1" }
                    ]} />
                </View>
                <Text style={[styles.buttonSubtitle, { color: "#64748b" }]}>
                  {printerStatus === "connected" 
                    ? `Active: ${printerName}` 
                    : printerStatus === "offline" 
                    ? "Printer is offline" 
                    : "No printer connected"}
                </Text>
              </View>
              <Feather 
                name={printerStatus === "connected" ? "check-circle" : "bluetooth"} 
                size={18} 
                color={printerStatus === "connected" ? "#10b981" : "#7c3aed"} 
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* 5. Operational Alerts */}
        <View style={styles.sectionSpacing}>
          <LowStockList items={dashboard?.lowStock || []} />
        </View>

        {/* 6. Insights */}
        <View style={styles.sectionSpacing}>
          <MostSoldCard items={dashboard?.mostSold || []} />
        </View>

        {/* 7. Transaction History */}
        <View style={styles.sectionSpacing}>
          <RecentBills bills={dashboard?.recentBills || []} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7FE",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerCurveContainer: {
    backgroundColor: "#1e3a8a",
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  overlapCard: {
    marginTop: -40,
    paddingHorizontal: 4,
  },
  sectionSpacing: {
    marginTop: 5,
  },
  actionButtonsContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
    gap: 12,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 2,
  },
  buttonSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "400",
    marginTop: 2,
  },
  createBillButton: {
    width: "100%",
    backgroundColor: "#1e3a8a",
    paddingVertical: 18,
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  createBillText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  testPrinterButton: {
    width: "100%",
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: "#F3E8FF",
  },
  iconCirclePurple: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
  },
  testPrinterText: {
    color: "#1e293b",
    fontSize: 17,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 60,
  },
});