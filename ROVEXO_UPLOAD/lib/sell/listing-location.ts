import { UK_CITIES, UK_TOWNS } from "@/lib/seo/locations/uk";

const LEGACY_LOCATION_MARKER_REGEX = /<!--rovexo-city:([^>]+)-->/;

const ROMANIAN_CITIES = ["Galați", "Cluj-Napoca", "Brașov"] as const;

const FEATURED_CITIES = [
  "London",
  "Manchester",
  "Birmingham",
  "Liverpool",
  ...ROMANIAN_CITIES,
] as const;

function normalizeCityName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim()
    .toLowerCase();
}

function uniqueSortedCities(names: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const key = normalizeCityName(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export const MANUAL_LISTING_CITIES = uniqueSortedCities([
  ...FEATURED_CITIES,
  ...UK_CITIES.map((city) => city.name),
  ...UK_TOWNS.map((town) => town.name),
]);

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  hamlet?: string;
  suburb?: string;
  county?: string;
};

type NominatimReverseResponse = {
  address?: NominatimAddress;
  error?: string;
};

/** Strip legacy Stage 1 markers from descriptions for display only. */
export function stripListingLocationMarker(description: string | null | undefined): string {
  if (!description) return "";
  return description.replace(LEGACY_LOCATION_MARKER_REGEX, "").trimEnd();
}

/** Read legacy marker from description (pre-location_city column listings only). */
export function extractLegacyListingLocation(description: string | null | undefined): string | null {
  if (!description) return null;
  const match = description.match(LEGACY_LOCATION_MARKER_REGEX);
  const city = match?.[1]?.trim();
  return city || null;
}

export function resolveProductLocationCity(
  locationCity: string | null | undefined,
  description: string | null | undefined,
): string | undefined {
  const fromColumn = sanitizeListingLocationCity(locationCity);
  if (fromColumn) return fromColumn;
  return extractLegacyListingLocation(description) ?? undefined;
}

export function sanitizeListingLocationCity(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.length > 80) return null;
  if (/[<>]/.test(trimmed)) return null;
  return trimmed;
}

export function resolveCityFromGeocodeAddress(address: NominatimAddress | undefined): string | null {
  if (!address) return null;

  const candidates = [
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.hamlet,
    address.suburb,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const matched = matchManualCity(candidate);
    if (matched) return matched;
  }

  const first = candidates[0]?.trim();
  return first ? sanitizeListingLocationCity(first) : null;
}

export function matchManualCity(value: string): string | null {
  const normalized = normalizeCityName(value);
  return MANUAL_LISTING_CITIES.find((city) => normalizeCityName(city) === normalized) ?? null;
}

export async function reverseGeocodeListingCity(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "json",
    zoom: "10",
    addressdetails: "1",
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as NominatimReverseResponse;
  if (payload.error) return null;

  return resolveCityFromGeocodeAddress(payload.address);
}
