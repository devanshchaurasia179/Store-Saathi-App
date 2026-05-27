import React, { ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchOverlayProps {
  visible: boolean;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  items: any[];
  onSelect: (item: any) => void;
  renderItem: (item: any) => ReactNode;
  walkInOption?: boolean;
  walkInLabel?: string;
  extraTopOption?: ReactNode;
}

export default function SearchOverlay({
  visible,
  title,
  value,
  onChange,
  onClose,
  items,
  onSelect,
  renderItem,
  walkInOption,
  walkInLabel,
  extraTopOption,
}: SearchOverlayProps) {
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlayModal}>
        <View style={styles.sheet}>
          <View style={styles.searchHeader}>
            <Ionicons name="search" size={18} color="#94a3b8" />
            <TextInput
              autoFocus
              placeholder={title}
              placeholderTextColor="#94a3b8"
              value={value}
              onChangeText={onChange}
              style={styles.input}
            />
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {extraTopOption}
            {walkInOption && (
              <TouchableOpacity
                onPress={() => onSelect({ _id: "", name: "Walk-in" })}
                style={styles.walkIn}
              >
                <Ionicons name="people-outline" size={18} color="#2563eb" style={{ marginRight: 10 }} />
                <Text style={styles.walkInText}>{walkInLabel}</Text>
              </TouchableOpacity>
            )}
            {items.map((item: any) => (
              <TouchableOpacity
                key={item._id || item.id || Math.random()}
                onPress={() => onSelect(item)}
                style={styles.listItem}
              >
                {renderItem(item)}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayModal: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", paddingTop: 60 },
  sheet: { backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 24, maxHeight: "80%" },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  input: { flex: 1, fontSize: 15, color: "#1e293b", marginLeft: 10 },
  walkIn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
  },
  walkInText: { fontSize: 14, fontWeight: "700", color: "#2563eb" },
  listItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
});
