import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
  value: string;
  onChange: (v: string) => void;
  items: any[];
  onSelect: (item: any) => void;
  onClose: () => void;
  renderItem: (item: any) => React.ReactNode;
  walkInOption?: boolean;
};

export default function SearchOverlay({
  title,
  value,
  onChange,
  items,
  onSelect,
  onClose,
  renderItem,
  walkInOption = false,
}: Props) {
  return (
    <Modal transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          {/* HEADER */}
          <View style={styles.header}>
            <Ionicons name="search" size={16} />
            <TextInput
              autoFocus
              placeholder={title}
              value={value}
              onChangeText={onChange}
              style={styles.input}
            />
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={16} />
            </TouchableOpacity>
          </View>

          {/* LIST */}
          <ScrollView style={styles.list}>
            {walkInOption && (
              <TouchableOpacity
                style={styles.walkIn}
                onPress={() => onSelect({ _id: "" })}
              >
                <Text style={styles.walkInText}>
                  Walk-in Customer
                </Text>
              </TouchableOpacity>
            )}

            {items.map((item) => (
              <TouchableOpacity
                key={item._id}
                style={styles.item}
                onPress={() => onSelect(item)}
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    paddingTop: 80,
  },
  modal: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    borderRadius: 18,
    overflow: "hidden",
    maxHeight: "70%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  list: {
    maxHeight: 350,
  },
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  walkIn: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  walkInText: {
    fontWeight: "800",
    color: "#2563eb",
  },
});
