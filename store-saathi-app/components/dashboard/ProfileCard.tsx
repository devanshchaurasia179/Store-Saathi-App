import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

/* 🔤 LANGUAGE */
import { LANGUAGE_TEXT_PROFILE_CARD } from "../../constants/language";
import { useLanguage } from "../../providers/LanguageProvider";

export default function ProfileCard({ shop }: any) {
  const { language } = useLanguage();
  
  // Fetch current translations based on selected language
  const t = LANGUAGE_TEXT_PROFILE_CARD[language] || LANGUAGE_TEXT_PROFILE_CARD.en;

  // Logic: Fallback to localized "Partner" if ownerName is empty
  const ownerName = shop?.ownerName?.trim() || t.partner;
  
  // Logic: Fallback to localized "My Shop" if shopName is empty
  const shopName = shop?.shopName?.trim() || t.myShop;
  
  const completion =
    typeof shop?.profileCompletion === "number"
      ? shop.profileCompletion
      : 0;

  const isComplete = completion >= 100;

  /**
   * Helper to format Name + Honorific correctly
   * Example: "Rahul, Ji" (Hindi) vs "Rahul Garu" (Telugu)
   */
  const renderOwnerHeader = () => {
    if (language === 'te') {
      return `${ownerName} ${t.ji}`;
    }
    return `${ownerName}, ${t.ji}`;
  };

  return (
    <View style={styles.cardContainer}>
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={styles.namasteText}>{t.greeting}</Text>

          <Text style={styles.ownerName} numberOfLines={1}>
            {renderOwnerHeader()}
          </Text>

          {shopName ? (
            <View style={styles.shopBadge}>
              <Ionicons
                name="business"
                size={12}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.shopName} numberOfLines={1}>
                {shopName}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatarCircle,
              isComplete && styles.avatarComplete,
            ]}
          >
            <Ionicons
              name="person"
              size={isComplete ? 28 : 24}
              color="#fff"
            />
          </View>

          {!isComplete && <View style={styles.statusDot} />}
        </View>
      </View>

      {/* PROGRESS SECTION */}
      {!isComplete ? (
        <>
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                {t.profileCompletion}
              </Text>
              <Text style={styles.progressPercentage}>
                {completion}%
              </Text>
            </View>

            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${completion}%` },
                ]}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push("/profile")}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              {t.completeProfile} →
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.verifiedBadge}>
          <Ionicons
            name="checkmark-circle"
            size={14}
            color="#FFD700"
          />
          <Text style={styles.verifiedText}>
            {t.verifiedBusinessPartner}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    paddingTop: 40,
    backgroundColor: "#1e3a8a",
    padding: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingBottom: 40,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  namasteText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
  ownerName: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "capitalize",
  },
  shopBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  shopName: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.85,
    fontWeight: "500",
  },
  avatarContainer: {
    position: "relative",
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  avatarComplete: {
    borderColor: "rgba(255, 215, 0, 0.4)",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  statusDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFD700",
    borderWidth: 2,
    borderColor: "#1e3a8a",
  },
  progressSection: {
    marginTop: 24,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.9,
  },
  progressPercentage: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFD700",
    borderRadius: 3,
  },
  linkButton: {
    marginTop: 16,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  linkText: {
    color: "#FFAB91",
    fontSize: 14,
    fontWeight: "700",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    gap: 6,
    backgroundColor: "rgba(255,215,0,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  verifiedText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});