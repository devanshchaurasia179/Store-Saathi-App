import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, StatusBar, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) return <PageLoader />;

  return (
    <View style={styles.container}>
      {/* Ensures the top status bar matches the brand blue */}
      <StatusBar barStyle="light-content" backgroundColor="#1e4de4" />
      
      {/* Immersive Top Background */}
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

          {/* 2. Floating Top Debtor Card - Note the negative margin */}
          <View style={styles.overlappingCard}>
            <TopDebtorCard debtor={dashboard?.topDebtor} />
          </View>

          {/* 3. Feature Navigation Tiles */}
          <View style={styles.sectionMargin}>
            <QuickActions />
          </View>

          {/* 4. Primary Action: Create Bill */}
          <TouchableOpacity 
            style={styles.createBillButton}
            onPress={() => router.push("/billing")}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={20} color="#fff" />
            <Text style={styles.createBillText}>Create Bill</Text>
          </TouchableOpacity>

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
    backgroundColor: "#f0f7ff", // Dashboard light blue tint
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  overlappingCard: {
    marginTop: -40, // Pulls the debtor card higher onto the blue header
    zIndex: 10,
  },
  sectionMargin: {
    marginTop: 8,
  },
  createBillButton: {
    backgroundColor: "#2b62f1", // Vibrant action blue
    marginHorizontal: 12,
    marginVertical: 12,
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
  bottomSpacer: {
    height: 50,
  },
});