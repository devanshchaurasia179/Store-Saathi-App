import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";

export interface BillTab {
  id: string;
  items: any[];
  customerId: string;
  customerName: string;
  displayName?: string;
}

interface BillingTabBarProps {
  tabs: BillTab[];
  activeTabId: string;
  editingTabId: string | null;
  editTabNameValue: string;
  onTabSelect: (id: string) => void;
  onAddTab: () => void;
  onCloseTab: (id: string) => void;
  onStartEditingTabName: (tab: BillTab) => void;
  onSaveTabName: () => void;
  onCancelEditTabName: () => void;
  onEditTabNameChange: (value: string) => void;
}

export default function BillingTabBar({
  tabs,
  activeTabId,
  editingTabId,
  editTabNameValue,
  onTabSelect,
  onAddTab,
  onCloseTab,
  onStartEditingTabName,
  onSaveTabName,
  onCancelEditTabName,
  onEditTabNameChange,
}: BillingTabBarProps) {
  return (
    <View style={styles.tabBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map((tab, index) => {
          const isActive = activeTabId === tab.id;
          const isEditing = editingTabId === tab.id;

          return (
            <View
              key={tab.id}
              style={[
                styles.tabWrapper,
                isActive && styles.activeTabWrapper,
              ]}
            >
              {isEditing ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editTabNameValue}
                    onChangeText={onEditTabNameChange}
                    autoFocus
                    selectTextOnFocus
                    onBlur={onSaveTabName}
                    onSubmitEditing={onSaveTabName}
                    returnKeyType="done"
                    maxLength={24}
                  />
                  <TouchableOpacity onPress={onCancelEditTabName} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="close" size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.tabContent}
                  onPress={() => onTabSelect(tab.id)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isActive && styles.activeTabText,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.displayName || tab.customerName || `Bill ${index + 1}`}
                  </Text>

                  {isActive && (
                    <TouchableOpacity
                      onPress={() => onStartEditingTabName(tab)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.pencilButton}
                    >
                      <Feather name="edit-2" size={14} color={isActive ? "#ffffff" : "#64748b"} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              )}

              {tabs.length > 1 && !isEditing && (
                <TouchableOpacity
                  onPress={() => onCloseTab(tab.id)}
                  style={styles.closeTabIcon}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={isActive ? "#fff" : "#cbd5e1"}
                  />
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <TouchableOpacity onPress={onAddTab} style={styles.addTabBtn}>
          <Ionicons name="add" size={20} color="#2563eb" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: "#f1f5f9", zIndex: 100 },
  tabWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginRight: 8,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 8,
    minWidth: 100,
    maxWidth: 180,
  },
  activeTabWrapper: {
    backgroundColor: "#1e3a8a",
    borderColor: "#1e3a8a",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    maxWidth: 120,
  },
  activeTabText: { color: "#fff" },
  pencilButton: {
    marginLeft: 6,
    padding: 2,
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  editInput: {
    minWidth: 80,
    maxWidth: 140,
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    padding: 0,
  },
  closeTabIcon: { marginLeft: 4 },
  addTabBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
});
