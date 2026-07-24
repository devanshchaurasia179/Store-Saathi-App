import { Share, Platform, Alert } from 'react-native';

/**
 * Generates a Google Maps URL from latitude and longitude.
 */
function buildGoogleMapsUrlFromCoords(latitude: number, longitude: number): string {
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}

/**
 * Generates a Google Maps search URL from a text address.
 * Used as fallback when coordinates are not available.
 */
function buildGoogleMapsUrlFromAddress(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;
}

/**
 * Opens the Android native Share Sheet with a Google Maps location link.
 *
 * Why this works without opening Google Maps:
 * - We use Android's ACTION_SEND intent (text/plain) via React Native's Share API.
 * - The OS presents its native Share Sheet listing all apps that accept shared text.
 * - Rapido (and other delivery apps) register as share targets for text content.
 * - When the user picks Rapido, it receives the Google Maps URL as shared text,
 *   parses the coordinates/address, and opens its booking flow.
 *
 * Supports two modes:
 * 1. Coordinates (preferred) — shares `https://maps.google.com/?q=lat,lng`
 * 2. Text address (fallback) — shares `https://maps.google.com/maps?q=<encoded address>`
 *
 * @param latitude  - Pickup location latitude (nullable)
 * @param longitude - Pickup location longitude (nullable)
 * @param addressText - Fallback text address when coordinates are unavailable
 */
export async function shareLocationToRapido(
  latitude?: number | null,
  longitude?: number | null,
  addressText?: string
): Promise<void> {
  let url: string;

  // Prefer coordinates if valid
  const hasCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  if (hasCoords) {
    url = buildGoogleMapsUrlFromCoords(latitude!, longitude!);
  } else if (addressText && addressText.trim().length > 0) {
    url = buildGoogleMapsUrlFromAddress(addressText.trim());
  } else {
    Alert.alert(
      'No Location Available',
      'This order does not have location coordinates or an address to share.'
    );
    return;
  }

  try {
    const result = await Share.share(
      {
        message: url,
        ...(Platform.OS === 'ios' && { url }),
      },
      {
        dialogTitle: 'Share delivery location',
      }
    );

    if (result.action === Share.sharedAction) {
      console.log('Location shared successfully');
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dismissed');
    }
  } catch (error: any) {
    Alert.alert('Share Failed', error?.message || 'Something went wrong while sharing.');
    console.error('Share error:', error);
  }
}
