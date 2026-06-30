import { reverseGeocodeListingCity } from "@/lib/sell/listing-location";

export type SearchLocationMode = "current" | "nearby" | "any";

const MODE_KEY = "rovexo-search-location-mode";
const CITY_KEY = "rovexo-search-current-city";

export function getSearchLocationMode(): SearchLocationMode {
  if (typeof window === "undefined") return "any";
  const stored = window.localStorage.getItem(MODE_KEY);
  if (stored === "current" || stored === "nearby" || stored === "any") return stored;
  return "any";
}

export function setSearchLocationMode(mode: SearchLocationMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MODE_KEY, mode);
}

export function getSearchCurrentCity(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CITY_KEY)?.trim() || null;
}

export function setSearchCurrentCity(city: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CITY_KEY, city.trim());
}

export async function detectSearchCurrentCity(): Promise<string | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const city = await reverseGeocodeListingCity(
            position.coords.latitude,
            position.coords.longitude,
          );
          if (city) setSearchCurrentCity(city);
          resolve(city);
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  });
}

export function resolveActiveLocationCity(mode: SearchLocationMode): string | undefined {
  if (mode === "any") return undefined;
  return getSearchCurrentCity() ?? undefined;
}
