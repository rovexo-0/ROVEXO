import type { ShippingAddress } from "@/lib/shipping/types";

export type AddressValidationResult =
  | { valid: true; normalized: ShippingAddress }
  | { valid: false; errors: string[] };

/** Google Places adapter — interface only until credentials are available. */
export type PlacesAutocompleteAdapter = {
  isConfigured(): boolean;
  autocomplete(query: string): Promise<{ suggestions: { id: string; label: string }[] }>;
  resolvePlace(placeId: string): Promise<ShippingAddress | null>;
};

export class GooglePlacesAdapter implements PlacesAutocompleteAdapter {
  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_PLACES_API_KEY);
  }

  async autocomplete(query: string): Promise<{ suggestions: { id: string; label: string }[] }> {
    if (!this.isConfigured()) {
      return { suggestions: [] };
    }
    void query;
    return { suggestions: [] };
  }

  async resolvePlace(placeId: string): Promise<ShippingAddress | null> {
    if (!this.isConfigured()) return null;
    void placeId;
    return null;
  }
}

const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export function validateUkShippingAddress(address: ShippingAddress): AddressValidationResult {
  const errors: string[] = [];

  if (!address.fullName.trim()) errors.push("Full name is required.");
  if (!address.line1.trim()) errors.push("Address line 1 is required.");
  if (!address.city.trim()) errors.push("City is required.");
  if (!address.postcode.trim()) errors.push("Postcode is required.");
  if (!address.country.trim()) errors.push("Country is required.");

  if (address.country.toLowerCase().includes("united kingdom") || address.country === "GB") {
    if (!UK_POSTCODE.test(address.postcode.trim())) {
      errors.push("Enter a valid UK postcode.");
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    normalized: {
      ...address,
      fullName: address.fullName.trim(),
      line1: address.line1.trim(),
      line2: address.line2?.trim(),
      city: address.city.trim(),
      county: address.county?.trim(),
      postcode: address.postcode.trim().toUpperCase(),
      country: address.country.trim(),
      validated: true,
    },
  };
}

export function formatShippingAddress(address: ShippingAddress): string {
  return [
    address.fullName,
    address.line1,
    address.line2,
    address.city,
    address.county,
    address.postcode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");
}
