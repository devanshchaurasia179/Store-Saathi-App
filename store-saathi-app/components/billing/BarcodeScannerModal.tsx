import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BarcodeScanner from "./BarcodeScanner";

interface BarcodeScannerModalProps {
  visible: boolean;
  isFocused: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function BarcodeScannerModal({
  visible,
  isFocused,
  onClose,
  onScan,
}: BarcodeScannerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={styles.scannerModal}>
        <View style={styles.scannerModalHeader}>
          <Text style={styles.scannerModalTitle}>Scan Barcode</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.scannerContainer}>
          {visible && isFocused ? (
            <BarcodeScanner onScan={(barcode) => {
              onScan(barcode);
              onClose();
            }} />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000" }]} />
          )}
          <View style={styles.overlay}>
            <View style={styles.maskTop} />
            <View style={styles.maskRow}>
              <View style={styles.maskSide} />
              <View style={styles.scanFrame} />
              <View style={styles.maskSide} />
            </View>
            <View style={[styles.maskTop, { flex: 1 }]} />
          </View>
        </View>
        
        <View style={styles.scannerInstructions}>
          <Text style={styles.scannerInstructionsText}>
            Position the barcode within the frame
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scannerModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  scannerModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  scannerContainer: { height: "22%", backgroundColor: "transparent" },
  overlay: { ...StyleSheet.absoluteFillObject },
  maskTop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  maskRow: { flexDirection: "row", height: 120 },
  maskSide: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  scanFrame: { width: 260, height: 120 },
  scannerInstructions: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannerInstructionsText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
