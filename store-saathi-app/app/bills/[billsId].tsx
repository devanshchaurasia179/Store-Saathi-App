import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

/* ================= API ================= */
import { getBillById } from "../../constants/bills.api";
import { getDashboard } from "../../constants/dashboard.api";

/* ================= UTILS ================= */
import { formatRupee } from "../../utils/formatCurrency";
import { shareBillPdf } from "../../utils/billPdf";
import { printBill } from "../../utils/thermalPrinter";

const { width } = Dimensions.get("window");

export default function BillDetailScreen() {
  const params = useLocalSearchParams();

  const billId =
    typeof params.billsId === "string"
      ? params.billsId
      : Array.isArray(params.billsId)
      ? params.billsId[0]
      : null;

  /* ---------------- STATE ---------------- */
  const [bill, setBill] = useState<any>(null);
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    if (!billId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [billRes, dashboardRes] = await Promise.all([
          getBillById(billId),
          getDashboard(),
        ]);

        setBill(billRes.data?.bill || null);
        setUpiId(dashboardRes.data?.dashboard?.shop?.upiId || "");
      } catch (err) {
        console.error("Bill detail fetch error:", err);
        Alert.alert("Error", "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [billId]);

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loading}>Generating Invoice View…</Text>
      </View>
    );
  }

  /* ---------------- NOT FOUND ---------------- */
  if (!bill) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
        <Text style={styles.errorText}>Invoice not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ---------------- CALCULATIONS ---------------- */
  const billAmount = bill.totalAmount 

  const upiUrl =
    upiId && billAmount > 0
      ? `upi://pay?pa=${upiId}&pn=Shop&am=${billAmount}&cu=INR`
      : null;

  const isPaid = bill.paymentStatus === "PAID";
  const isPartial = bill.paymentStatus === "PARTIAL";

  /* ---------------- PDF ACTIONS (UTIL) ---------------- */
  const handleShare = async () => {
    try {
      await shareBillPdf(bill);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to share bill");
    }
  };

  const handlePrint = async () => {
    try {
      await printBill(bill);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to print bill");
    }
  };

  /* ================= RENDER ================= */
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircle}>
          <Ionicons name="arrow-back" size={20} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Invoice Detail</Text>
          <Text style={styles.headerSubtitle}>
            Order #{bill.dailyBillNumber}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.iconCircle}>
            <Ionicons name="share-outline" size={20} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePrint} style={styles.iconCircle}>
            <Ionicons name="print-outline" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* MAIN CARD */}
        <View style={styles.ticketCard}>
          <View
            style={[
              styles.statusBadge,
              isPaid
                ? styles.bgPaid
                : isPartial
                ? styles.bgPartial
                : styles.bgUnpaid,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isPaid
                  ? styles.txtPaid
                  : isPartial
                  ? styles.txtPartial
                  : styles.txtUnpaid,
              ]}
            >
              {bill.paymentStatus}
            </Text>
          </View>

          <Text style={styles.dateText}>
            {new Date(bill.createdAt).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          <Text style={styles.mainAmount}>
            {formatRupee(bill.totalAmount)}
          </Text>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
          </View>

          {/* CUSTOMER DISPLAY */}
          <View style={styles.customerRow}>
            <View style={styles.customerInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>
                  {(bill.customerId?.name || "W")[0]}
                </Text>
              </View>
              <View>
                <Text style={styles.customerLabel}>Customer</Text>
                <Text style={styles.customerValue}>
                  {bill.customerId?.name || "Walk-in Customer"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ITEMS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Billed Items</Text>
            <Text style={styles.itemCount}>{bill.items.length} Items</Text>
          </View>

          {bill.items.map((item: any, idx: number) => (
            <View
              key={item.productId}
              style={[
                styles.itemRow,
                idx === bill.items.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} Unit × {formatRupee(item.price)}
                </Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatRupee(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* UPI QR */}
        {upiUrl && (
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>Customer Payment QR</Text>
            <Text style={styles.qrSub}>
              Scan this to receive {formatRupee(billAmount)} instantly
            </Text>
            <View style={styles.qrWrapper}>
              <QRCode
                value={upiUrl}
                size={width * 0.45}
                color="#0f172a"
                backgroundColor="transparent"
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loading: { marginTop: 14, color: "#64748b", fontWeight: "500" },
  errorText: { marginTop: 12, color: "#dc2626", fontWeight: "700" },

  backBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
  },
  backBtnText: { fontWeight: "600" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  headerSubtitle: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  headerActions: { flexDirection: "row", gap: 10 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },

  ticketCard: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  bgPaid: { backgroundColor: "#dcfce7" },
  bgPartial: { backgroundColor: "#fef9c3" },
  bgUnpaid: { backgroundColor: "#fee2e2" },
  statusText: { fontSize: 11, fontWeight: "800" },
  txtPaid: { color: "#166534" },
  txtPartial: { color: "#854d0e" },
  txtUnpaid: { color: "#991b1b" },

  dateText: { fontSize: 12, color: "#94a3b8", marginBottom: 8 },
  mainAmount: {
    fontSize: 42,
    fontWeight: "900",
    color: "#0f172a",
  },

  dividerContainer: {
    width: "100%",
    height: 20,
    justifyContent: "center",
    marginVertical: 10,
  },
  dividerLine: {
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    borderStyle: "dashed",
    width: "100%",
  },

  customerRow: {
    width: "100%",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
  },
  customerInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { color: "#fff", fontWeight: "bold" },
  customerLabel: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  customerValue: { fontSize: 14, fontWeight: "700", color: "#1e293b" },

  dueAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    backgroundColor: "#fef2f2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dueAlertTxt: { fontSize: 12, fontWeight: "700", color: "#dc2626" },

  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  itemCount: { fontSize: 12, color: "#94a3b8" },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  itemName: { fontSize: 14, fontWeight: "700" },
  itemMeta: { fontSize: 12, color: "#64748b" },
  itemPrice: { fontSize: 14, fontWeight: "800" },

  qrSection: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
  },
  qrTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  qrSub: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
});
