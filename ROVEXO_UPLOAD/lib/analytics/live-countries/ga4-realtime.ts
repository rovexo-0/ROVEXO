import { createSign } from "node:crypto";
import {
  countryCodeToFlag,
  getCountryName,
  normalizeCountryCode,
} from "@/lib/analytics/live-countries/countries";
import type { LiveCountry } from "@/lib/analytics/live-countries/types";

export type Ga4RealtimeRow = {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
};

type Ga4RealtimeResponse = {
  rows?: Ga4RealtimeRow[];
};

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function isGa4Configured(): boolean {
  return Boolean(
    process.env.GA4_PROPERTY_ID?.trim() &&
      process.env.GA4_SERVICE_ACCOUNT_EMAIL?.trim() &&
      process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY?.trim(),
  );
}

async function getGa4AccessToken(): Promise<string | null> {
  const clientEmail = process.env.GA4_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!clientEmail || !privateKey) return null;

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: issuedAt + 3600,
      iat: issuedAt,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey, "base64url");
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as { access_token?: string };
  return payload.access_token ?? null;
}

function parseGa4Rows(rows: Ga4RealtimeRow[]): LiveCountry[] {
  const countries: LiveCountry[] = [];

  for (const row of rows) {
    const code = normalizeCountryCode(row.dimensionValues?.[0]?.value);
    const gaName = row.dimensionValues?.[1]?.value?.trim();
    const activeUsers = Number.parseInt(row.metricValues?.[0]?.value ?? "0", 10);

    if (!code || !Number.isFinite(activeUsers) || activeUsers <= 0) continue;

    countries.push({
      code,
      name: getCountryName(code, gaName),
      flag: countryCodeToFlag(code),
      activeUsers,
    });
  }

  return countries.sort((left, right) => right.activeUsers - left.activeUsers);
}

export async function runGa4RealtimeReport(
  dimensions: Array<{ name: string }>,
  metrics: Array<{ name: string }> = [{ name: "activeUsers" }],
  limit = 10_000,
): Promise<Ga4RealtimeRow[] | null> {
  if (!isGa4Configured()) return null;

  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const accessToken = await getGa4AccessToken();
  if (!propertyId || !accessToken) return null;

  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dimensions, metrics, limit }),
      cache: "no-store",
    },
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as Ga4RealtimeResponse;
  return payload.rows ?? [];
}

export async function fetchGa4LiveCountries(): Promise<LiveCountry[] | null> {
  const rows = await runGa4RealtimeReport([{ name: "countryId" }, { name: "country" }]);
  if (!rows) return null;
  return parseGa4Rows(rows);
}

export function isGa4RealtimeEnabled(): boolean {
  return isGa4Configured();
}
