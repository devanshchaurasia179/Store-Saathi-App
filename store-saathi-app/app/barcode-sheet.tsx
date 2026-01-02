import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PageLoader from "@/components/PageLoader";
import { getDashboard } from "../constants/dashboard.api";
import { getProducts } from "../constants/inventory.api";
import { nanoid } from "nanoid/non-secure";
import { generateBarcode } from "../utils/generateBarcode";

/* 🔤 LANGUAGE & THEME */
import { LANGUAGE_TEXT_BARCODE_SHEET } from "../constants/language_inventory";
import { useLanguage } from "../providers/LanguageProvider";

const ITEMS_PER_PAGE = 18; 
const EXTRA_BLANK_BARCODES = 6; 

interface Product {
  _id: string;
  name: string;
  size?: string;
  barcode: string;
  isBlank?: boolean;
}

export default function BarcodeSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  
  const t = LANGUAGE_TEXT_BARCODE_SHEET[language] || LANGUAGE_TEXT_BARCODE_SHEET.en;

  const [products, setProducts] = useState<Product[]>([]);
  const [shopName, setShopName] = useState("My Shop");
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, productRes] = await Promise.all([
          getDashboard(),
          getProducts(),
        ]);

        setShopName(dashboardRes?.data?.dashboard?.shop?.shopName || "My Shop");

        const listed = (productRes?.data?.products || [])
          .filter((p: any) => p.isBarcodeListed && p.barcode)
          .map((p: any) => ({
            _id: p._id,
            name: p.name,
            size: p.size,
            barcode: p.barcode,
            isBlank: false,
          }));

        const blanks = Array.from({ length: EXTRA_BLANK_BARCODES }).map(() => ({
          _id: nanoid(),
          name: "",
          size: "",
          barcode: generateBarcode(),
          isBlank: true,
        }));

        setProducts([...listed, ...blanks]);
      } catch (e) {
        console.error("Barcode Fetch Error:", e);
        Alert.alert("Error", "Failed to load products.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const generateHTML = useCallback(() => {
    const pages = [];
    for (let i = 0; i < products.length; i += ITEMS_PER_PAGE) {
      pages.push(products.slice(i, i + ITEMS_PER_PAGE));
    }

    // Fixed the HTML structure to prevent blank leading page
    const pageHTML = pages.map((pageProducts, index) => `
      <div class="page">
        <div class="header-container">
          <p class="shop-title">${shopName}</p>
          <span class="sub-script">${t.poweredBy} Store Saathi — Page ${index + 1}/${pages.length}</span>
        </div>
        <div class="grid">
          ${pageProducts.map((p) => `
            <div class="label">
              <div class="name">${p.name ? `${p.name}${p.size ? " - " + p.size : ""}` : "&nbsp;"}</div>
              <div class="barcode-wrapper">
                <img src="https://barcode.tec-it.com/barcode.ashx?data=${p.barcode}&code=Code128&dpi=96" />
              </div>
              <div class="b-code">${p.barcode}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; font-family: 'Helvetica', Arial, sans-serif; background-color: white; }
          
          /* Ensures the first page starts immediately without a break */
          .page {
            width: 210mm;
            height: 297mm;
            padding: 12mm;
            box-sizing: border-box;
            page-break-after: always;
            display: flex;
            flex-direction: column;
          }

          /* Remove break from the very last page to prevent a final blank page */
          .page:last-child {
            page-break-after: auto;
          }

          .header-container { text-align: center; margin-bottom: 8mm; }
          .shop-title { 
            text-transform: uppercase; 
            letter-spacing: 2px; 
            font-size: 16px; 
            font-weight: bold;
            margin: 0;
          }
          .sub-script { font-size: 9px; color: #555; display: block; margin-top: 2px; }

          .grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            grid-template-rows: repeat(6, 42mm); /* 18 items = 3x6 grid */
            gap: 4mm; 
            width: 100%; 
          }

          .label { 
            border: 0.1mm solid #ccc; 
            padding: 3mm; 
            text-align: center; 
            display: flex; 
            flex-direction: column; 
            justify-content: center; 
            align-items: center; 
            border-radius: 1.5mm; 
          }

          .name { 
            font-size: 8px; 
            font-weight: bold; 
            margin-bottom: 2mm;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }

          .barcode-wrapper { height: 18mm; display: flex; align-items: center; }
          img { height: 100%; width: auto; max-width: 55mm; }
          .b-code { font-size: 9px; margin-top: 1mm; font-weight: bold; }
        </style>
      </head>
      <body>
        ${pageHTML}
      </body>
    </html>
    `;
  }, [products, shopName, t.poweredBy]);

  const downloadPDF = async () => {
    if (products.length === 0) return;
    try {
      setIsGenerating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.headerTitle}</Text>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.illustrationContainer}>
          <View style={styles.iconCircle}>
            <View style={styles.pulseRing} />
            <Ionicons name="barcode-outline" size={80} color="#1E3A8A" />
          </View>
        </View>

        <View style={styles.textSection}>
          <Text style={styles.mainTitle}>{t.readyTitle}</Text>
          <Text style={styles.description}>
            {t.descStart}<Text style={styles.boldText}> {products.length} </Text>{t.descEnd}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.mainDownloadBtn, isGenerating && styles.disabledBtn]} 
          onPress={downloadPDF}
          disabled={isGenerating}
        >
          {isGenerating ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="cloud-download" size={24} color="#fff" />
              <Text style={styles.mainDownloadText}>{t.downloadBtn}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={22} color="#1E3A8A" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoText}>{t.formatInfo}</Text>
            <Text style={styles.infoText}>{t.recommendInfo}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Labels</Text>
            <Text style={styles.statValue}>{products.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Pages</Text>
            <Text style={styles.statValue}>{Math.ceil(products.length / ITEMS_PER_PAGE)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.footerText}>{t.poweredBy} <Text style={{ fontWeight: '800' }}>Store Saathi</Text></Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, height: 60 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
  backBtn: { padding: 4, backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  scrollContent: { alignItems: "center", paddingHorizontal: 30, paddingTop: 40 },
  illustrationContainer: { marginBottom: 40 },
  iconCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 10 },
  pulseRing: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: '#E0E7FF' },
  textSection: { alignItems: "center", marginBottom: 40 },
  mainTitle: { fontSize: 28, fontWeight: "900", color: "#1E293B", textAlign: 'center' },
  description: { fontSize: 16, color: "#64748B", textAlign: "center" },
  boldText: { color: "#1E3A8A", fontWeight: "800" },
  mainDownloadBtn: { flexDirection: "row", backgroundColor: "#1E3A8A", width: "100%", height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center", gap: 12 },
  disabledBtn: { backgroundColor: '#94A3B8' },
  mainDownloadText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  infoCard: { flexDirection: 'row', marginTop: 30, backgroundColor: "#EFF6FF", padding: 16, borderRadius: 18, gap: 12, borderWidth: 1, borderColor: '#DBEAFE' },
  infoText: { fontSize: 13, color: "#1E40AF", fontWeight: "600" },
  statsRow: { flexDirection: 'row', marginTop: 30, backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%', elevation: 2 },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#F1F5F9' },
  statLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  statValue: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  footer: { alignItems: "center" },
  footerText: { fontSize: 14, color: "#CBD5E1" },
});