import * as Location from 'expo-location';
import { APP_CONFIG } from '../constants/config';

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

// ─── Geo-Fencing Utilities ────────────────────────────────────────────────────

/**
 * Calculate the distance (in km) between two GPS coordinates using the Haversine formula.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check whether the doctor is within the geo-fence radius of the hospital.
 * Returns an object with `withinFence` boolean and `distanceMeters`.
 */
export function checkGeoFence(
  doctorLat: number,
  doctorLng: number,
  hospitalLat: number | null,
  hospitalLng: number | null,
): { withinFence: boolean; distanceMeters: number | null } {
  // If hospital has no coordinates, skip the geo-fence check (allowed)
  if (hospitalLat == null || hospitalLng == null) {
    return { withinFence: true, distanceMeters: null };
  }

  const distanceKm = haversineDistanceKm(doctorLat, doctorLng, hospitalLat, hospitalLng);
  const distanceMeters = Math.round(distanceKm * 1000);

  return {
    withinFence: distanceKm <= APP_CONFIG.GEO_FENCE_RADIUS_KM,
    distanceMeters,
  };
}

/**
 * Compute the clock-in time window for a given shift start time.
 * Returns { earliest, latest } as Date objects.
 */
export function getClockInWindow(shiftStartTime: string): { earliest: Date; latest: Date } {
  const start = new Date(shiftStartTime);
  const earliest = new Date(start.getTime() - APP_CONFIG.CLOCK_IN_EARLY_MINUTES * 60 * 1000);
  const latest = new Date(start.getTime() + APP_CONFIG.CLOCK_IN_LATE_HOURS * 60 * 60 * 1000);
  return { earliest, latest };
}

/**
 * Determine the clock-in window status for UI display.
 */
export type ClockInWindowStatus = 'too_early' | 'open' | 'closed';

export function getClockInWindowStatus(shiftStartTime: string): {
  status: ClockInWindowStatus;
  minutesUntilOpen?: number;
  window: { earliest: Date; latest: Date };
} {
  const now = new Date();
  const { earliest, latest } = getClockInWindow(shiftStartTime);

  if (now < earliest) {
    const minutesUntilOpen = Math.ceil((earliest.getTime() - now.getTime()) / 60000);
    return { status: 'too_early', minutesUntilOpen, window: { earliest, latest } };
  }

  if (now > latest) {
    return { status: 'closed', window: { earliest, latest } };
  }

  return { status: 'open', window: { earliest, latest } };
}

/**
 * Calculate auto-approve deadline from clock-out time.
 * Returns the Date at which auto-approval happens.
 */
export function getAutoApproveDeadline(clockOutTime: string): Date {
  return new Date(new Date(clockOutTime).getTime() + APP_CONFIG.AUTO_APPROVE_HOURS * 60 * 60 * 1000);
}

/**
 * Format distance in meters to a readable string.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
