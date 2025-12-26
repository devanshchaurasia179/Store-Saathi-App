import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { formatRupee } from "../../utils/formatCurrency";
import { formatTime } from "../../utils/formatTime";
import { Ionicons } from "@expo/vector-icons";

export default function LedgerChatBubble({
  entry,
  onViewBill,
}: any) {
  const isDebit = entry.type === "DEBIT";

  const alignment = isDebit ? "flex-end" : "flex-start";
  const isGreen = !isDebit;

  return (
    <View style={[styles.wrapper, { justifyContent: alignment }]}>
      <View
        style={[
          styles.bubble,
          isGreen ? styles.greenBubble : styles.redBubble,
        ]}
      >
        {/* HEADER LABEL */}
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.typeLabel,
              { color: isGreen ? "#15803d" : "#991b1b" },
            ]}
          >
            {isGreen ? "YOU GOT" : "YOU GAVE"}
          </Text>

          <Ionicons
            name={isGreen ? "arrow-down" : "arrow-up"}
            size={12}
            color={isGreen ? "#15803d" : "#991b1b"}
            style={{ transform: [{ rotate: "45deg" }] }}
          />
        </View>

        {/* AMOUNT */}
        <Text
          style={[
            styles.amount,
            { color: isGreen ? "#064e3b" : "#7f1d1d" },
          ]}
        >
          {formatRupee(entry.amount)}
        </Text>

        {/* NOTE */}
        {entry.note && <Text style={styles.note}>{entry.note}</Text>}

        {/* VIEW BILL */}
        {entry.billId && (
          <TouchableOpacity
            style={styles.billBtn}
            onPress={() => onViewBill(entry.billId)}
          >
            <View style={styles.billBadge}>
              <Ionicons
                name="document-text"
                size={14}
                color="#374151"
              />
              <Text style={styles.billText}>View Full Bill</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* TIME */}
        <Text style={styles.time}>
          {formatTime(entry.createdAt)}
        </Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    marginVertical: 8,
    width: "100%",
  },
  bubble: {
    maxWidth: "78%",
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  greenBubble: {
    backgroundColor: "#dcfce7", 
    borderTopLeftRadius: 4,
  },
  redBubble: {
    backgroundColor: "#fee2e2", 
    borderTopRightRadius: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  amount: {
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: -0.5,
  },
  note: {
    marginTop: 4,
    fontSize: 14,
    color: "#475569",
    lineHeight: 18,
  },
  billBtn: {
    marginTop: 12,
  },
  billBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
    alignSelf: "flex-start",
  },
  billText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555353ff",
  },
  time: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "right",
    marginTop: 8,
    fontWeight: "500",
  },
});