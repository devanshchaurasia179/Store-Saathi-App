import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { shareLocationToRapido } from '../../utils/shareLocation';

interface BookRapidoButtonProps {
  /** Pickup location latitude (optional — falls back to addressText) */
  latitude?: number | null;
  /** Pickup location longitude (optional — falls back to addressText) */
  longitude?: number | null;
  /** Fallback text address when coordinates are unavailable */
  addressText?: string;
  /** Optional custom button label */
  label?: string;
  /** Optional additional styling */
  style?: ViewStyle;
}

/**
 * A button that opens the Android Share Sheet with a Google Maps link
 * so the user can select Rapido (or any delivery app) to book a parcel pickup.
 *
 * Usage:
 * ```tsx
 * <BookRapidoButton latitude={30.7333} longitude={76.7794} />
 * // or with text address fallback:
 * <BookRapidoButton addressText="123, MG Road, Chandigarh, 160017" />
 * ```
 */
export function BookRapidoButton({
  latitude,
  longitude,
  addressText,
  label = 'Book with Rapido',
  style,
}: BookRapidoButtonProps) {
  const handlePress = () => {
    shareLocationToRapido(latitude, longitude, addressText);
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFCE00', // Rapido brand yellow
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
