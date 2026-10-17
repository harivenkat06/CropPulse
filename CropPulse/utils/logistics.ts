/**
 * Utility functions for the Shared Logistics feature.
 */

import type { LogisticsRequest, LogisticsStatus, FarmerLocation } from "@/types/logistics";

// ────────────────────────────────────────────
// Distance calculation (Haversine formula)
// ────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calculates the distance in km between two lat/lng coordinates
 * using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Returns a formatted distance string e.g. "8.4 km away".
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

// ────────────────────────────────────────────
// Location helpers
// ────────────────────────────────────────────

export function formatLocation(loc: FarmerLocation): string {
  return `${loc.town}, ${loc.district}`;
}

export function formatRoute(pickup: FarmerLocation, dest: FarmerLocation): string {
  return `${pickup.town} → ${dest.town}`;
}

// ────────────────────────────────────────────
// Request matching
// ────────────────────────────────────────────

/**
 * Finds requests within a given radius of a pickup location.
 */
export function findNearbyRequests(
  requests: LogisticsRequest[],
  pickupLat: number,
  pickupLng: number,
  radiusKm: number = 50
): (LogisticsRequest & { distanceKm: number })[] {
  return requests
    .map((r) => ({
      ...r,
      distanceKm: calculateDistance(
        pickupLat,
        pickupLng,
        r.pickupLocation.latitude,
        r.pickupLocation.longitude
      ),
    }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Finds requests compatible with a given request based on
 * destination, date, and open status.
 */
export function findCompatibleRequests(
  allRequests: LogisticsRequest[],
  targetRequest: LogisticsRequest,
  radiusKm: number = 50
): (LogisticsRequest & { distanceKm: number })[] {
  return findNearbyRequests(
    allRequests.filter((r) => {
      if (r.id === targetRequest.id) return false;
      if (r.status !== "OPEN" && r.status !== "CONFIRMED") return false;

      // Same destination (town match)
      const sameDestination =
        r.destination.town.toLowerCase() === targetRequest.destination.town.toLowerCase();

      // Same date
      const sameDate = r.preferredDate === targetRequest.preferredDate;

      return sameDestination && sameDate;
    }),
    targetRequest.pickupLocation.latitude,
    targetRequest.pickupLocation.longitude,
    radiusKm
  );
}

// ────────────────────────────────────────────
// Status helpers
// ────────────────────────────────────────────

interface StatusMeta {
  label: string;
  colorKey: "success" | "warning" | "danger" | "info" | "primary" | "onSurfaceVariant";
  icon: string;
}

const STATUS_MAP: Record<LogisticsStatus, StatusMeta> = {
  OPEN: { label: "Open", colorKey: "success", icon: "check-circle-outline" },
  PENDING: { label: "Pending", colorKey: "warning", icon: "clock-outline" },
  CONFIRMED: { label: "Confirmed", colorKey: "primary", icon: "check-decagram" },
  FULL: { label: "Full", colorKey: "info", icon: "account-group" },
  IN_PROGRESS: { label: "In Progress", colorKey: "info", icon: "truck-fast-outline" },
  COMPLETED: { label: "Completed", colorKey: "onSurfaceVariant", icon: "check-all" },
  CANCELLED: { label: "Cancelled", colorKey: "danger", icon: "close-circle-outline" },
};

export function getStatusMeta(status: LogisticsStatus): StatusMeta {
  return STATUS_MAP[status] || STATUS_MAP.OPEN;
}

// ────────────────────────────────────────────
// Date / time helpers
// ────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Formats an ISO date string to a display string like "12 Aug 2026".
 */
export function formatLogisticsDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Formats a timestamp to a short time display e.g. "2:30 PM".
 */
export function formatMessageTime(isoDatetime: string): string {
  const d = new Date(isoDatetime);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

/**
 * Returns a relative time string like "2h ago", "Just now".
 */
export function formatRelativeTime(isoDatetime: string): string {
  const now = Date.now();
  const then = new Date(isoDatetime).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatLogisticsDate(isoDatetime.split("T")[0]);
}

// ────────────────────────────────────────────
// ID generation
// ────────────────────────────────────────────

let counter = 1000;
export function generateId(prefix: string = "id"): string {
  counter++;
  return `${prefix}-${Date.now()}-${counter}`;
}
