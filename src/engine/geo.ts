import type { Center } from "../types";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two points on Earth, in kilometres (Haversine formula). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Returns a copy of the centers annotated with distanceKm from (lat, lng), closest first. */
export function sortByDistance(
  centers: Center[],
  lat: number,
  lng: number,
): (Center & { distanceKm: number })[] {
  return centers
    .map((c) => ({ ...c, distanceKm: haversineKm(lat, lng, c.lat, c.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * A 6-digit query matches pincode exactly. Anything else is a case-insensitive
 * substring match against district, name or address.
 */
export function filterByPincodeOrDistrict(centers: Center[], query: string): Center[] {
  const q = query.trim();
  if (/^\d{6}$/.test(q)) {
    return centers.filter((c) => c.pincode === q);
  }
  const needle = q.toLowerCase();
  return centers.filter(
    (c) =>
      c.district.toLowerCase().includes(needle) ||
      c.name.toLowerCase().includes(needle) ||
      c.address.toLowerCase().includes(needle),
  );
}
