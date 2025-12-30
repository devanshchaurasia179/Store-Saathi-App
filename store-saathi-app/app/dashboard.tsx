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

// API & Auth
import { getDashboard } from "../constants/dashboard.api";

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
  
  const router = useRouter();
  const { language } = useLanguage();
  
  const t = LANGUAGE_TEXT_DASHBOARD[language] || LANGUAGE_TEXT_DASHBOARD.en;

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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
        {/* Note: I'm wrapping ProfileCard in a styled View to give it the curved blue background */}
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
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
               <Ionicons name="barcode-outline" size={22} color="#1e3a8a" />
            </View>
            <Text style={styles.createBillText}>{t.createBill}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testPrinterButton}
            onPress={() => router.push("/PrintTest")}
            activeOpacity={0.8}
          >
            <View style={styles.iconCirclePurple}>
               <Feather name="printer" size={20} color="#7c3aed" />
            </View>
            <Text style={styles.testPrinterText}>{t.testPrinter}</Text>
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
    backgroundColor: "#F4F7FE", // Modern light background
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerCurveContainer: {
    backgroundColor: "#1e3a8a",
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    paddingBottom: 10, // Extra space for overlapping card
    paddingHorizontal: 10,
  },
  overlapCard: {
    marginTop: -40, // Pulls the debtor card up into the blue area
    paddingHorizontal: 4,
  },
  sectionSpacing: {
    marginTop: 5,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 15,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  createBillButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E7FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  createBillText: {
    color: "#1e3a8a",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  testPrinterButton: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F3E8FF",
  },
  iconCirclePurple: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  testPrinterText: {
    color: "#7c3aed",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  bottomSpacer: {
    height: 60,
  },
});