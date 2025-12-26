import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileCard({ shop }: any) {
  const ownerName = shop?.ownerName || "robin jain";
  const shopName = shop?.shopName || "Jain Biryaani shop";
  const completion = shop?.profileCompletion || 80;

  return (
    <View style={styles.cardContainer}>
      {/* 1. Top Section: Greeting and Avatar */}
      <View style={styles.topRow}>
        <View style={styles.textContainer}>
          <Text style={styles.namasteText}>Namaste</Text>
          <Text style={styles.ownerName}>{ownerName}</Text>
          <Text style={styles.shopName}>{shopName}</Text>
        </View>

        {/* 2. Avatar with Notification Dot */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={24} color="#fff" />
          </View>
          <View style={styles.statusDot} />
        </View>
      </View>

      {/* 3. Progress Section with Thematic Colors */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Profile completion</Text>
          <Text style={styles.progressPercentage}>{completion}%</Text>
        </View>

        {/* Custom Yellow Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View 
            style={[styles.progressBarFill, { width: `${completion}%` }]} 
          />
        </View>
      </View>

      {/* 4. Action Link */}
      <TouchableOpacity style={styles.linkButton}>
        <Text style={styles.linkText}>Complete profile →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    paddingTop:50,
    backgroundColor: "#1e3a8a", // Primary brand blue
    padding: 24, // Increased padding for an airy feel
    borderBottomLeftRadius: 24, // Softened corners to match dashboard aesthetic
    borderBottomRightRadius: 24,
    paddingBottom: 70, // Extra padding to account for overlapping cards
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  textContainer: {
    flex: 1,
  },
  namasteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.9,
  },
  ownerName: {
    color: "#fff",
    fontSize: 26, // Larger heading for shop owner
    fontWeight: "800",
    textTransform: "lowercase",
    marginTop: 2,
  },
  shopName: {
    color: "#fff",
    fontSize: 16,
    opacity: 0.85,
    marginTop: 2,
    fontWeight: "500",
  },
  avatarContainer: {
    position: "relative",
  },
  avatarCircle: {
    width: 52, // Slightly larger avatar
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  statusDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFD700", // Bright gold/yellow notification dot
    borderWidth: 2,
    borderColor: "#1e4de4", // Matches background for a "cut-out" look
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.95,
  },
  progressPercentage: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  progressBarBackground: {
    height: 8, // Thicker progress bar for better visibility
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFD700", // Yellow fill
    borderRadius: 4,
  },
  linkButton: {
    marginTop: 16,
  },
  linkText: {
    color: "#FFAB91", // Thematic orange/peach action link
    fontSize: 15,
    fontWeight: "700",
  },
});