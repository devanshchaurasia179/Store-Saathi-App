import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  scanThermalPrinters,
  setConnectedPrinter,
  isThermalPrinterConnected,
  getConnectedThermalPrinter,
} from "../utils/printerManager";
import { connectPrinter, printTestBill } from "../utils/thermalPrinter";
import { requestBluetoothPermission } from "../utils/bluetoothPermission";

export default function PrintTest() {
  const [devices, setDevices] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectedPrinter, setConnectedPrinter] = useState<{ address: string; name?: string } | null>(null);

  useEffect(() => {
    const initialize = async () => {
      await requestBluetoothPermission();
      const connected = await isThermalPrinterConnected();
      if (connected) {
        const printer = await getConnectedThermalPrinter();
        setConnectedPrinter(printer);
      }
    };
    initialize();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    setDevices([]);
    try {
      const foundDevices = await scanThermalPrinters();
      setDevices(foundDevices);
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (device: any) => {
    setScanning(true);
    try {
      // Connect using thermalPrinter
      await connectPrinter(device.address);

      // Save to printerManager (persistence)
      await setConnectedPrinter(device.address, device.name);

      // Update UI
      const savedPrinter = await getConnectedThermalPrinter();
      setConnectedPrinter(savedPrinter);

      Alert.alert(
        "Connection Successful! 🖨️",
        `Connected to ${device.name || "printer"}\n\nPrint a test bill to verify?`,
        [
          { text: "Later", style: "cancel" },
          {
            text: "Print Test",
            onPress: async () => {
              try {
                await printTestBill();
              } catch (e) {
                Alert.alert("Test Failed", "Printer connected but print failed. Check paper/power.");
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Connection Failed", error?.message || "Could not connect to printer");
    } finally {
      setScanning(false);
    }
  };

  const renderDevice = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.deviceCard, scanning && styles.disabledCard]}
      onPress={() => handleConnect(item)}
      disabled={scanning}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || "Unknown Printer"}</Text>
        <Text style={styles.deviceAddress}>{item.address}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type}</Text>
        </View>
      </View>
      <Feather name="printer" size={28} color="#4f46e5" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Thermal Printer Setup</Text>
        {connectedPrinter ? (
          <Text style={styles.connectedText}>
            Connected to {connectedPrinter.name || "Printer"} ✓
          </Text>
        ) : (
          <Text style={styles.subtitle}>Scan and connect your 58mm thermal printer</Text>
        )}
      </View>

      {/* Scan Button */}
      <TouchableOpacity
        style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
        onPress={handleScan}
        disabled={scanning}
      >
        {scanning ? (
          <>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.scanButtonText}>Scanning for printers...</Text>
          </>
        ) : (
          <>
            <Feather name="search" size={20} color="#fff" />
            <Text style={styles.scanButtonText}>Scan for Printers</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Device List */}
      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.address}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !scanning && devices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="printer" size={80} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No printers found</Text>
              <Text style={styles.emptySubtitle}>
                Make sure your printer is powered on and in pairing mode (hold FEED button).
              </Text>
            </View>
          ) : null
        }
      />

      {/* Test Print Button */}
      {connectedPrinter && (
        <TouchableOpacity style={styles.printTestButton} onPress={printTestBill}>
          <Feather name="printer" size={20} color="#fff" />
          <Text style={styles.printTestButtonText}>Print Test Bill</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    backgroundColor: "#4f46e5",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    fontSize: 15,
    color: "#e0e7ff",
    marginTop: 8,
    textAlign: "center",
  },
  connectedText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#10b981",
    marginTop: 8,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
    marginHorizontal: 20,
    marginBottom: 10,
    paddingVertical: 18,
    borderRadius: 18,
    gap: 12,
    elevation: 4,
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  deviceCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  disabledCard: {
    opacity: 0.6,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  deviceAddress: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 6,
  },
  typeBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4f46e5",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  printTestButton: {
    flexDirection: "row",
    backgroundColor: "#10b981",
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 18,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    elevation: 4,
  },
  printTestButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});