// Inside components/LanguageCard.tsx
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function LanguageCard({ title, symbol, onPress, backgroundColor, symbolColor }) {
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: backgroundColor }]} 
      onPress={onPress}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.symbol, { color: symbolColor }]}>{symbol}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, // This is key! It makes both cards equal width
    height: 110,
    borderRadius: 15,
    padding: 12,
    justifyContent: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
    // Optional: Add a very slight shadow to match the "card" feel
    elevation: 2, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    zIndex: 2,
  },
  symbol: {
    fontSize: 70,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: -10,
    right: 5,
    zIndex: 1,
    opacity: 0.9,
  }
});