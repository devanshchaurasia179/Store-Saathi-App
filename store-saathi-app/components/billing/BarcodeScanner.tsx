import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onScan: (barcode: string) => void;
  onClose?: () => void;
};

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef<string | null>(null);
  const [active, setActive] = useState(true);

  /* ---------------- PERMISSION ---------------- */
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  /* ---------------- HANDLE SCAN ---------------- */
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!data) return;
    if (scannedRef.current === data) return;

    scannedRef.current = data;
    setActive(false);

    onScan(data);

    // allow next scan after short delay
    setTimeout(() => {
      scannedRef.current = null;
      setActive(true);
    }, 1200);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          Camera permission is required
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            "ean13",
            "ean8",
            "code128",
            "upc_a",
            "upc_e",
          ],
        }}
        onBarcodeScanned={active ? handleBarcodeScanned : undefined}
      />

      {/* SCAN FRAME */}
      <View style={styles.overlay}>
        <View style={styles.scanBox} />
      </View>

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={styles.scanText}>Scan Product Barcode</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanBox: {
    width: 260,
    height: 160,
    borderWidth: 2,
    borderColor: "#22c55e",
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  topBar: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scanText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionText: {
    color: "#333",
    fontSize: 14,
    marginBottom: 10,
  },
  permissionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#2563eb",
    borderRadius: 10,
  },
  permissionBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
