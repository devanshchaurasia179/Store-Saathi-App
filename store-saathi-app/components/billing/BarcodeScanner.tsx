import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

type Props = {
  onScan: (barcode: string) => void;
  onClose: () => void;
};

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    // Prevent multiple scans
    if (hasScanned || !data) return;

    setHasScanned(true); // Lock the scanner immediately
    onScan(data);
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Camera permission is required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      {/* White Card Container */}
      <View style={styles.card}>
        
        {/* Black Scanner Window */}
        <View style={styles.cameraWrapper}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "code128", "upc_a", "upc_e"],
            }}
            // Only fire the event if we haven't scanned yet
            onBarcodeScanned={hasScanned ? undefined : handleBarcodeScanned}
          />
        </View>

        {/* Cancel Button Section */}
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Dimmed background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 12,
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Elevation for Android
    elevation: 5,
  },
  cameraWrapper: {
    width: '100%',
    aspectRatio: 1.5, // Matches the rectangular look of your image
    borderRadius: 16,
    overflow: "hidden", 
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 16,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "400",
  },
  /* Permission Styles */
  center: { flex: 1, justifyContent: 'center', alignItems: "center" },
  permissionText: { marginBottom: 10 },
  permissionBtn: { padding: 10, backgroundColor: "#2563eb", borderRadius: 8 },
  permissionBtnText: { color: "#fff" },
});