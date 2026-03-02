import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Request foreground location permission and return current GPS coordinates.
 * Returns null if permission is denied or location is unavailable.
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * Format coordinates as a readable string.
 */
export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
