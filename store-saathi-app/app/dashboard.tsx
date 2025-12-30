import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";

// API & Auth
import { getDashboard } from "../constants/dashboard.api";

// Enhanced Components
import ProfileCard from "../components/dashboard/ProfileCard";
import TopDebtorCard from "../components/dashboard/TopDebtorCard";
import QuickActions from "../components/dashboard/QuickActions";
import MostSoldCard from "../components/dashboard/MostSoldCard";
import LowStockList from "../components/dashboard/LowStockList";
import RecentBills from "../components/dashboard/RecentBills";
import PageLoader from "@/components/PageLoader";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const res = await getDashboard();
      setDashboard(res.data.dashboard);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
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

  const goToPrinterTest = () => {
    router.push("/PrintTest"); // Adjust path if your PrintTest screen is elsewhere
  };

  if (loading) return <PageLoader />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e4de4" />
      
      <View style={styles.topBackground} />

      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {/* 1. Profile Section */}
          <ProfileCard shop={dashboard?.shop} />

          {/* 2. Floating Top Debtor Card */}
          <View style={styles.overlappingCard}>
            <TopDebtorCard debtor={dashboard?.topDebtor} />
          </View>

          {/* 3. Feature Navigation Tiles */}
          <View style={styles.sectionMargin}>
            <QuickActions />
          </View>

          {/* 4. Primary Actions: Create Bill + Test Printer */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.createBillButton}
              onPress={() => router.push("/billing")}
            >
              <Ionicons name="barcode-outline" size={20} color="#fff" />
              <Text style={styles.createBillText}>Create Bill</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.testPrinterButton}
              onPress={goToPrinterTest}
            >
              <Feather name="printer" size={20} color="#fff" />
              <Text style={styles.testPrinterText}>Test Printer</Text>
            </TouchableOpacity>
          </View>

          {/* 5. Operational Alerts: Low Stock */}
          <LowStockList items={dashboard?.lowStock || []} />

          {/* 6. Insights: Most Sold Products */}
          <MostSoldCard items={dashboard?.mostSold || []} />

          {/* 7. Transaction History: Recent Bills */}
          <RecentBills bills={dashboard?.recentBills || []} />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7ff",
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  topBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: "#1e4de4",
  },
  overlappingCard: {
    marginTop: -40,
    zIndex: 10,
  },
  sectionMargin: {
    marginTop: 8,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 12,
    marginVertical: 12,
  },
  createBillButton: {
    flex: 1,
    backgroundColor: "#1e3a8a",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createBillText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  testPrinterButton: {
    flex: 1,
    backgroundColor: "#7c3aed", // Purple to distinguish from Create Bill
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testPrinterText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 50,
  },
});