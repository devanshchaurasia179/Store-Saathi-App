import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatRupee } from "../../utils/formatCurrency";

interface Props {
  youGet: number;
  youGive: number;
}

export default function LedgerSummary({ youGet, youGive }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {/* YOU GET */}
        <View style={[styles.block, styles.getBlock]}>
          <Text style={styles.labelGet}>You will get</Text>
          <Text style={styles.amountGet}>
            {formatRupee(youGet)}
          </Text>
        </View>

        {/* YOU GIVE */}
        <View style={[styles.block, styles.giveBlock]}>
          <Text style={styles.labelGive}>You will give</Text>
          <Text style={styles.amountGive}>
            {formatRupee(youGive)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: -70,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  block: {
    flex: 1,
    paddingVertical: 18,
    alignItems: "center",
  },
  getBlock: {
    backgroundColor: "#ecfdf5",
  },
  giveBlock: {
    backgroundColor: "#fef2f2",
  },
  labelGet: {
    fontSize: 12,
    color: "#047857",
    fontWeight: "600",
  },
  labelGive: {
    fontSize: 12,
    color: "#b91c1c",
    fontWeight: "600",
  },
  amountGet: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "800",
    color: "#16a34a",
  },
  amountGive: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: "800",
    color: "#dc2626",
  },
});
