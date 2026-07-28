/**
 * UK FIRST Address Lookup — mandatory for UK addresses (Addresses v1.0).
 *
 * Provider order:
 * 1. Ideal Postcodes (IDEAL_POSTCODES_API_KEY)
 * 2. getAddress.io (GETADDRESS_API_KEY)
 * 3. Non-production curated Owner QA postcodes only (never invent streets)
 *
 * Address Engine v1.0: one postcode → ALL available addresses (unlimited).
 */

import { isActiveUkMarketCountry, UK_DEFAULT_COUNTRY } from "@/lib/i18n/uk-first";
import { validatePostcodeForCountry } from "@/lib/account/countries";

export type UkLookupAddress = {
  id: string;
  line1: string;
  line2: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  label: string;
};

export function normalizeUkPostcode(postcode: string): string {
  const compact = postcode.replace(/\s+/g, "").toUpperCase();
  if (compact.length < 5) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

/** Owner / Full Demo curated results when no provider key is configured (local/QA only). */
const CURATED_UK_LOOKUP: Record<string, UkLookupAddress[]> = {
  "WS2 9AJ": [
    {
      id: "curated-ws2-9aj-92",
      line1: "92 Dora Street",
      line2: "",
      city: "Walsall",
      county: "West Midlands",
      postcode: "WS2 9AJ",
      country: UK_DEFAULT_COUNTRY,
      label: "92 Dora Street, Walsall, WS2 9AJ",
    },
  ],
  "WS2 9RD": [
    {
      id: "curated-ws2-9rd-83",
      line1: "83 Darlaston Road",
      line2: "",
      city: "Walsall",
      county: "West Midlands",
      postcode: "WS2 9RD",
      country: UK_DEFAULT_COUNTRY,
      label: "83 Darlaston Road, Walsall, WS2 9RD",
    },
    {
      id: "curated-ws2-9rd-85",
      line1: "85 Darlaston Road",
      line2: "",
      city: "Walsall",
      county: "West Midlands",
      postcode: "WS2 9RD",
      country: UK_DEFAULT_COUNTRY,
      label: "85 Darlaston Road, Walsall, WS2 9RD",
    },
    {
      id: "curated-ws2-9rd-87",
      line1: "87 Darlaston Road",
      line2: "",
      city: "Walsall",
      county: "West Midlands",
      postcode: "WS2 9RD",
      country: UK_DEFAULT_COUNTRY,
      label: "87 Darlaston Road, Walsall, WS2 9RD",
    },
    {
      id: "curated-ws2-9rd-89",
      line1: "89 Darlaston Road",
      line2: "",
      city: "Walsall",
      county: "West Midlands",
      postcode: "WS2 9RD",
      country: UK_DEFAULT_COUNTRY,
      label: "89 Darlaston Road, Walsall, WS2 9RD",
    },
    {
      id: "curated-ws2-9rd-flat-1",
      line1: "Flat 1",
      line2: "83 Darlaston Road",
      city: "Walsall",
      county: "West Midlands",
      postcode: "WS2 9RD",
      country: UK_DEFAULT_COUNTRY,
      label: "Flat 1, 83 Darlaston Road, Walsall, WS2 9RD",
    },
    {
      id: "curated-ws2-9rd-flat-2",
      line1: "Flat 2",
      line2: "83 Darlaston Road",
      city: "Walsall",
      county: "West Midlands",
      postcode: "WS2 9RD",
      country: UK_DEFAULT_COUNTRY,
      label: "Flat 2, 83 Darlaston Road, Walsall, WS2 9RD",
    },
    {
      id: "curated-ws2-9rd-warehouse",
      line1: "Warehouse",
      line2: "Darlaston Road",
      city: "Walsall",
      county: "West Midlands",
      postcode: "WS2 9RD",
      country: UK_DEFAULT_COUNTRY,
      label: "Warehouse, Darlaston Road, Walsall, WS2 9RD",
    },
    {
      id: "curated-ws2-9rd-office",
      line1: "Office",
      line2: "Darlaston Road",
      city: "Walsall",
      county: "West Midlands",
      postcode: "WS2 9RD",
      country: UK_DEFAULT_COUNTRY,
      label: "Office, Darlaston Road, Walsall, WS2 9RD",
    },
    {
      id: "curated-ws2-9rd-unit-1",
      line1: "Unit 1",
      line2: "Darlaston Road",
      city: "Walsall",
      county: "West Midlands",
      postcode: "WS2 9RD",
      country: UK_DEFAULT_COUNTRY,
      label: "Unit 1, Darlaston Road, Walsall, WS2 9RD",
    },
    {
      id: "curated-ws2-9rd-unit-2",
      line1: "Unit 2",
      line2: "Darlaston Road",
      city: "Walsall",
      county: "West Midlands",
      postcode: "WS2 9RD",
      country: UK_DEFAULT_COUNTRY,
      label: "Unit 2, Darlaston Road, Walsall, WS2 9RD",
    },
  ],
  "WC2H 9JQ": [
    {
      id: "curated-wc2h-9jq-71",
      line1: "71-75 Shelton Street",
      line2: "",
      city: "London",
      county: "Greater London",
      postcode: "WC2H 9JQ",
      country: UK_DEFAULT_COUNTRY,
      label: "71-75 Shelton Street, London, WC2H 9JQ",
    },
  ],
  "SW1A 1AA": [
    {
      id: "curated-sw1a-1aa-1",
      line1: "1 Buckingham Palace Road",
      line2: "",
      city: "London",
      county: "Greater London",
      postcode: "SW1A 1AA",
      country: UK_DEFAULT_COUNTRY,
      label: "1 Buckingham Palace Road, London, SW1A 1AA",
    },
  ],
  "B74 2NW": [
    {
      id: "curated-b74-2nw-1",
      line1: "1 Gracechurch Shopping Centre",
      line2: "",
      city: "Sutton Coldfield",
      county: "West Midlands",
      postcode: "B74 2NW",
      country: UK_DEFAULT_COUNTRY,
      label: "1 Gracechurch Shopping Centre, Sutton Coldfield, B74 2NW",
    },
  ],
  "CV1 2WT": [
    {
      id: "curated-cv1-2wt-1",
      line1: "1 Fairfax Street",
      line2: "",
      city: "Coventry",
      county: "West Midlands",
      postcode: "CV1 2WT",
      country: UK_DEFAULT_COUNTRY,
      label: "1 Fairfax Street, Coventry, CV1 2WT",
    },
  ],
  "M1 1AE": [
    {
      id: "curated-m1-1ae-1",
      line1: "1 Piccadilly",
      line2: "",
      city: "Manchester",
      county: "Greater Manchester",
      postcode: "M1 1AE",
      country: UK_DEFAULT_COUNTRY,
      label: "1 Piccadilly, Manchester, M1 1AE",
    },
  ],
  "DY1 1DB": [
    {
      id: "curated-dy1-1db-1",
      line1: "1 Priory Street",
      line2: "",
      city: "Dudley",
      county: "West Midlands",
      postcode: "DY1 1DB",
      country: UK_DEFAULT_COUNTRY,
      label: "1 Priory Street, Dudley, DY1 1DB",
    },
  ],
};

type IdealPostcodesResult = {
  result?: Array<{
    line_1?: string;
    line_2?: string;
    post_town?: string;
    county?: string;
    postcode?: string;
  }>;
};

async function lookupIdealPostcodes(
  postcode: string,
  apiKey: string,
): Promise<UkLookupAddress[]> {
  const encoded = encodeURIComponent(postcode.replace(/\s+/g, ""));
  const url = `https://api.ideal-postcodes.co.uk/v1/postcodes/${encoded}?api_key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error("Address lookup temporarily unavailable.");
  }
  const payload = (await response.json()) as IdealPostcodesResult;
  const rows = payload.result ?? [];
  return rows.map((row, index) => {
    const line1 = (row.line_1 ?? "").trim();
    const line2 = (row.line_2 ?? "").trim();
    const city = (row.post_town ?? "").trim();
    const county = (row.county ?? "").trim();
    const pc = normalizeUkPostcode(row.postcode ?? postcode);
    return {
      id: `ideal-${pc.replace(/\s+/g, "")}-${index}`,
      line1,
      line2,
      city,
      county,
      postcode: pc,
      country: UK_DEFAULT_COUNTRY,
      label: [line1, line2, city, pc].filter(Boolean).join(", "),
    };
  });
}

type GetAddressExpandedRow = {
  line_1?: string;
  line_2?: string;
  town_or_city?: string;
  county?: string;
  postcode?: string;
};

type GetAddressResult = {
  addresses?: string[] | GetAddressExpandedRow[];
  postcode?: string;
  Message?: string;
};

async function lookupGetAddress(postcode: string, apiKey: string): Promise<UkLookupAddress[]> {
  const encoded = encodeURIComponent(postcode.replace(/\s+/g, ""));
  const url = `https://api.getAddress.io/find/${encoded}?api-key=${encodeURIComponent(apiKey)}&expand=true`;
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (response.status === 404) return [];
  if (!response.ok) {
    throw new Error("Address lookup temporarily unavailable.");
  }
  const payload = (await response.json()) as GetAddressResult;
  const addresses = payload.addresses ?? [];

  if (addresses.length && typeof addresses[0] === "object" && addresses[0] !== null) {
    return (addresses as GetAddressExpandedRow[]).map((row, index) => {
      const line1 = (row.line_1 ?? "").trim();
      const line2 = (row.line_2 ?? "").trim();
      const city = (row.town_or_city ?? "").trim();
      const county = (row.county ?? "").trim();
      const pc = normalizeUkPostcode(row.postcode ?? postcode);
      return {
        id: `getaddress-${pc.replace(/\s+/g, "")}-${index}`,
        line1,
        line2,
        city,
        county,
        postcode: pc,
        country: UK_DEFAULT_COUNTRY,
        label: [line1, line2, city, pc].filter(Boolean).join(", "),
      };
    });
  }

  // Legacy string array format: "line1, line2, town, county, …"
  return (addresses as string[]).map((raw, index) => {
    const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
    const line1 = parts[0] ?? "";
    const line2 = parts[1] ?? "";
    const city = parts[2] ?? "";
    const county = parts[3] ?? "";
    const pc = normalizeUkPostcode(postcode);
    return {
      id: `getaddress-${pc.replace(/\s+/g, "")}-${index}`,
      line1,
      line2,
      city,
      county,
      postcode: pc,
      country: UK_DEFAULT_COUNTRY,
      label: [line1, line2, city, pc].filter(Boolean).join(", "),
    };
  });
}

export async function lookupUkAddressesByPostcode(postcodeRaw: string): Promise<UkLookupAddress[]> {
  const postcode = normalizeUkPostcode(postcodeRaw.trim());
  if (!postcode || !validatePostcodeForCountry(UK_DEFAULT_COUNTRY, postcode)) {
    throw new Error("Enter a valid UK postcode.");
  }
  if (!isActiveUkMarketCountry(UK_DEFAULT_COUNTRY)) {
    throw new Error("Address lookup is only available for United Kingdom.");
  }

  const idealKey = process.env.IDEAL_POSTCODES_API_KEY?.trim();
  if (idealKey) {
    return lookupIdealPostcodes(postcode, idealKey);
  }

  const getAddressKey = process.env.GETADDRESS_API_KEY?.trim();
  if (getAddressKey) {
    return lookupGetAddress(postcode, getAddressKey);
  }

  // Local / QA / certification without provider credentials — curated only, never invent.
  if (process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production") {
    throw new Error("Address lookup temporarily unavailable.");
  }

  return CURATED_UK_LOOKUP[postcode] ?? [];
}
