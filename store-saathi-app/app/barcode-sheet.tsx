import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import BarcodeSVG from "../components/BarcodeSVG";
import { getDashboard } from "../constants/dashboard.api";
import { getProducts } from "../constants/inventory.api";
import { nanoid } from "nanoid/non-secure";
import { generateBarcode } from "../utils/generateBarcode";

/* ================= CONFIG ================= */
const BARCODE_PER_PAGE = 24; // ✅ 3 x 8
const EXTRA_BLANK_BARCODES = 5;

export default function BarcodeSheet() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [shopName, setShopName] = useState("My Shop");
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, productRes] = await Promise.all([
          getDashboard(),
          getProducts(),
        ]);

        setShopName(
          dashboardRes.data.dashboard?.shop?.shopName || "My Shop"
        );

        const listed = productRes.data.products.filter(
          (p: any) => p.isBarcodeListed && p.barcode
        );

        const blanks = Array.from({ length: EXTRA_BLANK_BARCODES }).map(() => ({
          _id: nanoid(),
          name: "",
          size: "",
          barcode: generateBarcode(),
          isBlank: true,
        }));

        setProducts([...listed, ...blanks]);
      } catch (e) {
        console.log("Barcode error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  /* ---------------- PDF GENERATION ---------------- */
  const downloadPDF = async () => {
    const html = `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', Arial; margin: 10mm; }
          h3 { text-align: center; margin-bottom: 6mm; text-transform: uppercase; letter-spacing: 1px; }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-auto-rows: 34mm;
            gap: 4mm;
          }
          .label {
            border: 0.5px solid #000;
            padding: 3mm;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          .name { font-size: 10px; font-weight: bold; margin-bottom: 2mm; height: 12px; overflow: hidden; }
          img { height: 20mm; width: auto; max-width: 100%; }
          .footer {
            text-align: center;
            font-size: 9px;
            margin-top: 10mm;
            color: #888;
          }
        </style>
      </head>
      <body>
        <h3>${shopName}</h3>
        <div class="grid">
          ${products
            .slice(0, BARCODE_PER_PAGE)
            .map(
              (p) => `
            <div class="label">
              <div class="name">
                ${p.name ? `${p.name}${p.size ? " - " + p.size : ""}` : "&nbsp;"}
              </div>
              <img src="https://barcode.tec-it.com/barcode.ashx?data=${p.barcode}&code=Code128" />
            </div>
          `
            )
            .join("")}
        </div>
        <div class="footer">Powered by Store Saathi</div>
      </body>
    </html>
    `;

    const file = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(file.uri);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading barcodes…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Barcode Sheet</Text>
            <Text style={styles.headerSubtitle}>{products.length} Labels Generated</Text>
          </View>

          <TouchableOpacity style={styles.downloadBtn} onPress={downloadPDF}>
            <Ionicons name="cloud-download-outline" size={18} color="#fff" />
            <Text style={styles.downloadText}>PDF</Text>
          </TouchableOpacity>
        </View>

        {/* PREVIEW */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageShadow}>
            <View style={styles.page}>
              <Text style={styles.shopTitle}>{shopName}</Text>

              <View style={styles.grid}>
                {products.slice(0, BARCODE_PER_PAGE).map((p) => (
                  <View key={p._id} style={styles.label}>
                    <BarcodeCard product={p} />
                  </View>
                ))}
              </View>

              <Text style={styles.footerText}>Powered by Store Saathi</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function BarcodeCard({ product }: any) {
  const title = product.name
    ? product.size
      ? `${product.name} - ${product.size}`
      : product.name
    : "";

  return (
    <View style={{ alignItems: "center", width: "100%" }}>
      <Text numberOfLines={1} style={styles.cardTitle}>
        {title || " "}
      </Text>
      <BarcodeSVG value={product.barcode} height={50} />
      <Text style={styles.barcodeValue}>{product.barcode}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6", // Light grey background to make the "page" pop
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 14,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical:40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
        android: { elevation: 3 }
    })
  },
  backBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6b7280",
  },
  downloadBtn: {
    flexDirection: "row",
    backgroundColor: "#2563eb", // Professional Blue
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  downloadText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    paddingVertical: 20,
    alignItems: "center",
  },
  pageShadow: {
    // Mimics a real sheet of paper
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  page: {
    width: 360, // Scaled down for mobile preview (maintains A4 aspect ratio roughly)
    minHeight: 500,
    backgroundColor: "#fff",
    padding: 16,
  },
  shopTitle: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 16,
    textTransform: "uppercase",
    color: "#1f2937",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  label: {
    width: "31%", 
    height: 100,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#d1d5db",
    borderRadius: 2,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 8,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    color: "#374151",
  },
  barcodeValue: {
    fontSize: 7,
    color: "#9ca3af",
    marginTop: 2,
  },
  footerText: {
    textAlign: "center",
    fontSize: 9,
    marginTop: 20,
    color: "#9ca3af",
    fontStyle: "italic",
  },
});