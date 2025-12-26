import { View, Text, FlatList, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // Recommended import
import LanguageCard from "../components/LanguageCard";
import WelcomeHeader from "../components/WelcomeHeader";
import { LANGUAGES } from "../constants/language";
import { useLanguage } from "../providers/LanguageProvider";
import { useRouter } from "expo-router";

export default function LanguagePage() {
  const { changeLanguage } = useLanguage();
  const router = useRouter();

  const handleSelect = (code: string) => {
    changeLanguage(code);
    router.push("/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Increased margin here via styles.headerWrapper */}
      <View style={styles.headerWrapper}>
        <WelcomeHeader />
      </View>

      <View style={styles.textSection}>
        <Text style={styles.titleText}>Choose Language</Text>
        <Text style={styles.subtitleText}>भाषा चुनें</Text>
      </View>

      <FlatList
        data={LANGUAGES}
        numColumns={2}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <LanguageCard
            title={item.title}
            symbol={item.symbol}
            backgroundColor={item.bgColor}
            symbolColor={item.symbolColor}
            onPress={() => handleSelect(item.code)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20, 
  },
  headerWrapper: {
    marginTop: 10, 
    paddingHorizontal: 20,
    alignItems: "center",
  },
  textSection: {
    marginTop: 40,
    marginBottom: 25,
    alignItems: "center",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 4,
    color: "#000",
  },
  listContent: {
    paddingHorizontal: 20, // Match the image's side padding
    paddingBottom: 40,
  },
  columnWrapper: {
    // REMOVE justifyContent: "space-between"
    gap: 16, // This creates the horizontal gap between the two cards
    marginBottom: 16, // This creates the vertical gap between rows
  },
});