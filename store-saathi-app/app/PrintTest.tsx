import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Dimensions,
  Platform,
} from "react-native";
import { 
  SafeAreaProvider, 
  useSafeAreaInsets 
} from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

/* 🛠 PRINTER UTILS */
import {
  scanThermalPrinters,
  isThermalPrinterSaved,
  getConnectedThermalPrinter,
  safeDisconnectPrinter,
  clearSavedPrinter,
  reconnectSavedPrinter 
} from "../utils/printerManager";

import { connectPrinter, printTestBill } from "../utils/thermalPrinter";
import { requestBluetoothPermission } from "../utils/bluetoothPermission";
import { BluetoothEscposPrinter } from "@vardrz/react-native-bluetooth-escpos-printer";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_PRINTER } from "../constants/language_printer"; 
import { useLanguage } from "../providers/LanguageProvider";

const { width } = Dimensions.get("window");

type ConnectionStatus = "connected" | "offline" | "none";

function PrinterSetupContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_PRINTER[language] || LANGUAGE_TEXT_PRINTER.en;

  const [devices, setDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("none");
  const [connectedPrinter, setLocalConnectedPrinter] = useState<{
    address: string;
    name?: string;
  } | null>(null);

  const testRealConnection = async (): Promise<boolean> => {
    try {
      await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
      return true;
    } catch (e) {
      return false;
    }
  };

  const checkSavedPrinterStatus = async () => {
    const hasSaved = await isThermalPrinterSaved();
    if (!hasSaved) {
      setStatus("none");
      setLocalConnectedPrinter(null);
      return;
    }

    const printer = await getConnectedThermalPrinter();
    if (!printer) {
      setStatus("none");
      setLocalConnectedPrinter(null);
      return;
    }

    const isReachable = await testRealConnection();
    if (isReachable) {
      setStatus("connected");
      setLocalConnectedPrinter(printer);
    } else {
      setStatus("offline");
      setLocalConnectedPrinter(printer);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await requestBluetoothPermission();
      await checkSavedPrinterStatus();
    };
    initialize();

    const interval = setInterval(checkSavedPrinterStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = async () => {
    Alert.alert(
      t.forgetTitle,
      t.forgetMsg,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.forgetBtn,
          style: "destructive",
          onPress: async () => {
            await safeDisconnectPrinter();
            await clearSavedPrinter();
            setLocalConnectedPrinter(null);
            setStatus("none");
          },
        },
      ]
    );
  };

  const handleScan = async () => {
    setScanning(true);
    setDevices([]);
    try {
      const foundDevices = await scanThermalPrinters();
      setDevices(foundDevices);
      await checkSavedPrinterStatus();
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (device: any) => {
    setScanning(true);
    try {
      await connectPrinter(device.address, device.name);
      const isReachable = await testRealConnection();
      
      if (isReachable) {
        setStatus("connected");
      } else {
        setStatus("offline");
      }

      const savedPrinter = await getConnectedThermalPrinter();
      setLocalConnectedPrinter(savedPrinter);

      Alert.alert(
        t.successTitle,
        `${device.name || "Printer"} ${t.connectedMsg}\n\n${isReachable ? t.readyMsg : t.savedOfflineMsg}`,
        [
          { text: "OK" },
          ...(isReachable ? [{ text: t.testPrint, onPress: printTestBill }] : []),
        ]
      );
    } catch (error) {
      Alert.alert(t.failTitle, t.failMsg);
    } finally {
      setScanning(false);
    }
  };
const handleReconnectFromHeader = async () => {
  if (scanning) return;

  setScanning(true);
  try {
    const success = await reconnectSavedPrinter();

    if (!success) {
      setStatus("offline");
      Alert.alert(t.failTitle, t.savedOfflineMsg);
      return;
    }

    const isReachable = await testRealConnection();
    const printer = await getConnectedThermalPrinter();

    setStatus(isReachable ? "connected" : "offline");
    setLocalConnectedPrinter(printer);

    if (isReachable) {
      Alert.alert(
        t.successTitle,
        t.readyMsg,
        [{text: "OK"},
        { text: t.testPrint, onPress: printTestBill }]
      );
    }
  } finally {
    setScanning(false);
  }
};
  const renderDevice = ({ item }: { item: any }) => {
    const isSavedPrinter = connectedPrinter?.address === item.address;
    const isActuallyConnected = status === "connected" && isSavedPrinter;

    return (
      <TouchableOpacity
        style={[
          styles.deviceCard,
          isActuallyConnected && styles.connectedCard,
          scanning && styles.disabledCard,
        ]}
        // CHANGED: If not active, clicking always attempts to connect (even if saved)
        onPress={() => {
          if (isActuallyConnected) {
            Alert.alert(item.name || "Printer", t.readyMsg);
          } else {
            handleConnect(item);
          }
        }}
        // ADDED: Long press to Forget/Disconnect
        onLongPress={() => isSavedPrinter && handleDisconnect()}
        disabled={scanning}
      >
        <View style={[styles.deviceIconContainer, isActuallyConnected && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <MaterialCommunityIcons 
            name={isActuallyConnected ? "printer-check" : "printer-wireless"} 
            size={24} 
            color={isActuallyConnected ? "#fff" : "#1e3a8a"} 
          />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={[styles.deviceName, isActuallyConnected && styles.whiteText]}>
            {item.name || t.unknown}
          </Text>
          <Text style={[styles.deviceAddress, isActuallyConnected && styles.fadedWhiteText]}>
            {item.address}
          </Text>
        </View>

        {isSavedPrinter && (
          <View style={[styles.activeLabel, !isActuallyConnected && { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.activeLabelText}>
              {isActuallyConnected ? t.onlineLabel : t.savedLabel}
            </Text>
          </View>
        )}

        {!isActuallyConnected && <Feather name="chevron-right" size={20} color="#cbd5e1" />}
      </TouchableOpacity>
    );
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected": return "#10b981";  
      case "offline": return "#f59e0b";   
      default: return "#ef4444";          
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected": return t.online;
      case "offline": return t.offline;
      default: return t.none;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push("/dashboard")}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerGreeting}>{t.title}</Text>
            <Text style={styles.headerSubtitle}>{getStatusText()}</Text>
          </View>
          <TouchableOpacity 
            style={styles.statusBadge}
            onPress={checkSavedPrinterStatus}
          >
            <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.statusText}>
              {status === "connected" ? t.statusOnline : status === "offline" ? t.statusOffline : t.statusNone}
            </Text>
          </TouchableOpacity>
        </View>

       {connectedPrinter && (
  <TouchableOpacity 
    style={styles.printerChip}
    onPress={ handleReconnectFromHeader }   // 👈 ADD THIS
    onLongPress={handleDisconnect}        // 👈 KEEP THIS
  >

            <Feather 
              name={status === "connected" ? "check-circle" : "alert-circle"} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.printerChipText}>
              {connectedPrinter.name || connectedPrinter.address}
            </Text>
            <Feather name="more-vertical" size={14} color="#fff" style={{marginLeft: 4}} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.availableDevices}</Text>
          {scanning && <ActivityIndicator size="small" color="#1e3a8a" />}
        </View>

        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.address}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 140 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !scanning ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Feather name="bluetooth" size={40} color="#94a3b8" />
                </View>
                <Text style={styles.emptyTitle}>{t.noPrinters}</Text>
                <Text style={styles.emptySubtitle}>{t.noPrintersSub}</Text>
                <TouchableOpacity style={styles.outlineButton} onPress={handleScan}>
                  <Text style={styles.outlineButtonText}>{t.scanAgain}</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.primaryButton, scanning && styles.buttonDisabled]}
          onPress={handleScan}
          disabled={scanning}
        >
          {scanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="refresh-cw" size={20} color="#fff" />
              <Text style={styles.buttonText}>{t.scanBtn}</Text>
            </>
          )}
        </TouchableOpacity>

        {status === "connected" && (
          <TouchableOpacity style={styles.secondaryButton} onPress={printTestBill}>
            <Feather name="file-text" size={20} color="#fff" />
            <Text style={styles.buttonText}>{t.testPrint}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function PrintTest() {
  return (
    <SafeAreaProvider>
      <PrinterSetupContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    backgroundColor: "#1e3a8a",
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center", marginBottom: 15,
  },
  headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerGreeting: { fontSize: 26, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: "#bfdbfe", marginTop: 4, fontWeight: '600' },
  statusBadge: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  printerChip: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,215,0,0.2)",
    alignSelf: "flex-start", marginTop: 20, paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)'
  },
  printerChipText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  content: { flex: 1, paddingHorizontal: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 30, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: "#94a3b8", textTransform: 'uppercase', letterSpacing: 1 },
  list: { paddingTop: 8 },
  deviceCard: {
    backgroundColor: "#fff", padding: 18, borderRadius: 24,
    flexDirection: "row", alignItems: "center", marginBottom: 12,
    elevation: 3, shadowColor: "#1e3a8a", shadowOpacity: 0.05, shadowRadius: 10
  },
  connectedCard: { backgroundColor: "#1e3a8a" },
  disabledCard: { opacity: 0.6 },
  deviceIconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginRight: 16 },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 16, fontWeight: "800", color: "#1e293b" },
  deviceAddress: { fontSize: 12, color: "#64748b", marginTop: 2, fontWeight: '500' },
  whiteText: { color: "#fff" },
  fadedWhiteText: { color: "#bfdbfe" },
  activeLabel: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  activeLabelText: { color: "#fff", fontSize: 9, fontWeight: "900" },
  emptyContainer: { alignItems: "center", justifyContent: "center", marginTop: 60 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#475569" },
  emptySubtitle: { fontSize: 14, color: "#94a3b8", textAlign: "center", marginTop: 8, paddingHorizontal: 40, lineHeight: 20, fontWeight: '500' },
  outlineButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, borderWidth: 2, borderColor: "#1e3a8a" },
  outlineButtonText: { color: "#1e3a8a", fontWeight: "800" },
  footer: { padding: 24, backgroundColor: "#f8fafc", gap: 12 },
  primaryButton: { backgroundColor: "#1e3a8a", height: 60, borderRadius: 20, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12, elevation: 4 },
  secondaryButton: { backgroundColor: "#10b981", height: 60, borderRadius: 20, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12 },
  buttonDisabled: { backgroundColor: "#94a3b8" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "900", letterSpacing: 0.5 },
});