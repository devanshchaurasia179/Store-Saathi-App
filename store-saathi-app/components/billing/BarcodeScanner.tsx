import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onScan: (barcode: string) => void;
  onClose?: () => void;
};

const { width: screenWidth } = Dimensions.get("window");

// Scan box dimensions (centered)
const SCAN_BOX_SIZE = { width: 260, height: 160 };
const SCAN_BOX_LEFT = (screenWidth - SCAN_BOX_SIZE.width) / 2;
const SCAN_BOX_TOP = 200; // Adjust if you want it higher/lower (from top of screen)

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

  /* ---------------- HELPER: Check if barcode is fully inside scan box ---------------- */
  const isBarcodeInScanBox = (result: BarcodeScanningResult): boolean => {
    if (!result.cornerPoints || result.cornerPoints.length < 4) return false;

    const points = result.cornerPoints;

    // Check all four corners are inside the scan box
    return points.every((point) => {
      return (
        point.x >= SCAN_BOX_LEFT &&
        point.x <= SCAN_BOX_LEFT + SCAN_BOX_SIZE.width &&
        point.y >= SCAN_BOX_TOP &&
        point.y <= SCAN_BOX_TOP + SCAN_BOX_SIZE.height
      );
    });
  };

  /* ---------------- HANDLE SCAN ---------------- */
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    const { data } = result;

    if (!data || !active) return;
    if (scannedRef.current === data) return;

    // Only accept if the barcode is fully inside the green box
    if (!isBarcodeInScanBox(result)) return;

    scannedRef.current = data;
    setActive(false);

    onScan(data);

    // Re-enable scanning after delay
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
            "upc_a",
            "upc_e",
            "code128",
            "code39",
            "code93",
            "codabar",
            "itf14",
          ],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* DARK OVERLAY + SCAN BOX WITH CORNERS */}
      <View style={styles.overlayContainer}>
        {/* Top mask */}
        <View style={styles.maskRow} />
        {/* Middle row with cutout */}
        <View style={styles.middleRow}>
          <View style={styles.maskSide} />
          <View style={styles.scanWindow}>
            {/* Corner lines */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.maskSide} />
        </View>
        {/* Bottom mask */}
        <View style={styles.maskRow} />
      </View>

      {/* TOP BAR */}
      <View style={styles.topBar}>
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
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  maskRow: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  middleRow: {
    flexDirection: "row",
  },
  maskSide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  scanWindow: {
    width: SCAN_BOX_SIZE.width,
    height: SCAN_BOX_SIZE.height,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#22c55e",
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
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
    textAlign: "center",
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