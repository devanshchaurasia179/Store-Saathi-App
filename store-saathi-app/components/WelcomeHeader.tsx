import { View, Text, StyleSheet } from "react-native";

export default function WelcomeHeader() {
  return (
    <View style={styles.container}>
      {/* Welcome Text */}
      <Text style={styles.welcomeText}>Welcome</Text>

      {/* Decorative "to" with lines */}
      <View style={styles.separatorContainer}>
        <View style={styles.line} />
        <Text style={styles.toText}>to</Text>
        <View style={styles.line} />
      </View>

      {/* Brand Name */}
      <Text style={styles.brandContainer}>
        <Text style={styles.storeText}>Store </Text>
        <Text style={styles.saathiText}>Saathi</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "900", // Extra bold for the "Welcome"
    color: "#001a33",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    width: "40%", // Controls the width of the line/to section
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  toText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  brandContainer: {
    fontSize: 26,
    fontWeight: "bold",
  },
  storeText: {
    color: "#707070", // Greyish color from image
  },
  saathiText: {
    color: "#1E3A8A", // The bright blue color from image
  },
});