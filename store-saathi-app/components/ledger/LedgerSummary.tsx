import React from "react";
import { View, Text, StyleSheet } from "react-native";

/* 🛠 UTILS */
import { formatRupee } from "../../utils/formatCurrency";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_LEDGER_SUMMARY } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

interface Props {
  youGet: number;
  youGive: number;
}

export default function LedgerSummary({ youGet, youGive }: Props) {
  const { language } = useLanguage();
  const t = LANGUAGE_TEXT_LEDGER_SUMMARY[language] || LANGUAGE_TEXT_LEDGER_SUMMARY.en;

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {/* YOU GET SECTION */}
        <View style={[styles.block, styles.getBlock]}>
          <Text style={styles.labelGet}>{t.youGet}</Text>
          <Text style={styles.amountGet} numberOfLines={1} adjustsFontSizeToFit>
            {formatRupee(youGet)}
          </Text>
        </View>

        {/* VERTICAL DIVIDER */}
        <View style={styles.divider} />

        {/* YOU GIVE SECTION */}
        <View style={[styles.block, styles.giveBlock]}>
          <Text style={styles.labelGive}>{t.youGive}</Text>
          <Text style={styles.amountGive} numberOfLines={1} adjustsFontSizeToFit>
            {formatRupee(youGive)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: -55, // Adjusted to sit perfectly on the curved header
    paddingHorizontal: 16,
    zIndex: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#1e3a8a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  block: {
    flex: 1,
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  getBlock: {
    backgroundColor: "#f0fdf4", // Very light emerald
  },
  giveBlock: {
    backgroundColor: "#fef2f2", // Very light rose
  },
  divider: {
    width: 1,
    height: "60%",
    backgroundColor: "#e2e8f0",
  },
  labelGet: {
    fontSize: 11,
    color: "#15803d",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  labelGive: {
    fontSize: 11,
    color: "#b91c1c",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountGet: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "900",
    color: "#16a34a",
  },
  amountGive: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "900",
    color: "#dc2626",
  },
});