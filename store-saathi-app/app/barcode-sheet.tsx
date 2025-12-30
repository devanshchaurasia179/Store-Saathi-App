import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageLoader from "@/components/PageLoader";
import { getDashboard } from "../constants/dashboard.api";
import { getProducts } from "../constants/inventory.api";
import { nanoid } from "nanoid/non-secure";
import { generateBarcode } from "../utils/generateBarcode";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_BARCODE_SHEET } from "../constants/language_inventory";
import { useLanguage } from "../providers/LanguageProvider";

const { width } = Dimensions.get("window");
const BARCODE_PER_PAGE = 21; 
const EXTRA_BLANK_BARCODES = 5;

export default function BarcodeSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  
  // Pick the current language text
  const t = LANGUAGE_TEXT_BARCODE_SHEET[language] || LANGUAGE_TEXT_BARCODE_SHEET.en;

  const [products, setProducts] = useState<any[]>([]);
  const [shopName, setShopName] = useState("My Shop");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, productRes] = await Promise.all([
          getDashboard(),
          getProducts(),
        ]);

        setShopName(dashboardRes.data.dashboard?.shop?.shopName || "My Shop");

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

  const downloadPDF = async () => {
    const html = `
    <html>
      <head>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Helvetica', Arial; margin: 0; padding: 15mm; background-color: white; }
          .header-container { text-align: center; margin-bottom: 8mm; }
          .shop-title { 
            text-transform: uppercase; 
            letter-spacing: 2px; 
            font-size: 16px; 
            font-weight: bold;
            margin: 0;
            color: black;
          }
          .sub-script { 
            font-size: 9px; 
            color: black; 
            display: block; 
            margin-top: 2px;
            font-weight: bold;
          }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(7, 38mm); gap: 5mm; width: 100%; }
          .label { border: 0.2px solid #ccc; padding: 4mm; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 1mm; }
          .name { font-size: 9px; font-weight: bold; margin-bottom: 3mm; height: 12px; overflow: hidden; color: black; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
          img { height: 18mm; width: auto; max-width: 100%; }
          .b-code { font-size: 8px; margin-top: 1mm; color: black; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-container">
          <p class="shop-title">${shopName}</p>
          <span class="sub-script">${t.poweredBy} Store Saathi</span>
        </div>
        <div class="grid">
          ${products.slice(0, BARCODE_PER_PAGE).map((p) => `
            <div class="label">
              <div class="name">${p.name ? `${p.name}${p.size ? " - " + p.size : ""}` : "&nbsp;"}</div>
              <img src="https://barcode.tec-it.com/barcode.ashx?data=${p.barcode}&code=Code128" />
              <div class="b-code">${p.barcode}</div>
            </div>
          `).join("")}
        </div>
      </body>
    </html>
    `;

    const file = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(file.uri);
  };

  if (loading) {
    return (
      <PageLoader/>
    );
  }

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.headerTitle}</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="barcode-outline" size={80} color="#1E3A8A" />
          </View>
        </View>

        <View style={styles.textSection}>
          <Text style={styles.mainTitle}>{t.readyTitle}</Text>
          <Text style={styles.description}>
            {t.descStart}<Text style={styles.boldText}>{products.length}</Text>{t.descEnd}
          </Text>
        </View>

        {/* SINGLE LARGE DOWNLOAD BUTTON */}
        <TouchableOpacity style={styles.mainDownloadBtn} onPress={downloadPDF}>
          <Ionicons name="cloud-download" size={24} color="#fff" />
          <Text style={styles.mainDownloadText}>{t.downloadBtn}</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Ionicons name="print-outline" size={20} color="#1E3A8A" />
          <View>
            <Text style={styles.infoText}>{t.formatInfo}</Text>
            <Text style={styles.infoText}>{t.recommendInfo}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.footerText}>{t.poweredBy} <Text style={{fontWeight: '800'}}>Store Saathi</Text></Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
  },
  backBtn: {
    padding: 4,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  illustrationContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  textSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
  },
  boldText: {
    color: "#1E3A8A",
    fontWeight: "800",
  },
  mainDownloadBtn: {
    flexDirection: "row",
    backgroundColor: "#1E3A8A",
    width: "100%",
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    elevation: 8,
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  mainDownloadText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    backgroundColor: "#E0E7FF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    color: "#1E3A8A",
    fontWeight: "600",
    lineHeight: 18,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#94A3B8",
  },
});