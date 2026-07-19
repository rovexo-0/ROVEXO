function isUnusableSecret(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return true;
  if (normalized === "[SENSITIVE]" || normalized.startsWith("[SEN")) return true;
  if (normalized === "placeholder" || normalized.endsWith("_placeholder")) return true;
  if (normalized === "sk_test_placeholder" || normalized === "whsec_placeholder") return true;
  return false;
}

function readFirstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value && !isUnusableSecret(value)) {
      return value;
    }
  }
  return undefined;
}

function required(label: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${label}`);
  }
  return value;
}

/** Canonical public Supabase URL (browser + server). */
const SUPABASE_URL_KEYS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"] as const;

/** Canonical public anon/publishable key (browser + server). */
const SUPABASE_ANON_KEYS = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
] as const;

/** Canonical server-only service role key. */
const SUPABASE_SERVICE_ROLE_KEYS = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"] as const;

/**
 * Invalid hostnames caused by an extra "n" when copying the project ref into Vercel.
 * Correct ref: pklotmwxtnnepaitedic (see supabase/.temp/project-ref).
 */
const SUPABASE_HOSTNAME_CORRECTIONS: Record<string, string> = {
  "pklotmwxtnnnepaitedic.supabase.co": "pklotmwxtnnepaitedic.supabase.co",
};

export function normalizeSupabaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`Invalid Supabase URL: "${trimmed}" is not a valid URL.`);
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`Invalid Supabase URL: "${trimmed}" must use http or https.`);
  }

  if (!url.hostname.endsWith(".supabase.co")) {
    throw new Error(
      `Invalid Supabase URL hostname "${url.hostname}". Expected https://<project-ref>.supabase.co`,
    );
  }

  if (url.hostname.includes("pooler.") || url.hostname.includes("supabase.com")) {
    throw new Error(
      `Invalid Supabase URL hostname "${url.hostname}". Use the project API URL (https://<project-ref>.supabase.co), not the database pooler URL.`,
    );
  }

  const correctedHostname = SUPABASE_HOSTNAME_CORRECTIONS[url.hostname];
  if (correctedHostname) {
    url.hostname = correctedHostname;
  }

  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error("Invalid Supabase URL: use the project origin only (no path).");
  }

  return url.origin;
}

export function tryGetSupabaseUrl(): string | null {
  const raw = readFirstEnv(...SUPABASE_URL_KEYS);
  if (!raw) return null;
  try {
    return normalizeSupabaseUrl(raw);
  } catch {
    return null;
  }
}

export function tryGetSupabaseAnonKey(): string | null {
  return readFirstEnv(...SUPABASE_ANON_KEYS) ?? null;
}

export function tryGetSupabaseServiceRoleKey(): string | undefined {
  return readFirstEnv(...SUPABASE_SERVICE_ROLE_KEYS);
}

/** True when public Supabase client credentials are available. */
export function isSupabaseConfigured(): boolean {
  return Boolean(tryGetSupabaseUrl() && tryGetSupabaseAnonKey());
}

/** True when server admin Supabase credentials are available. */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(tryGetSupabaseUrl() && tryGetSupabaseServiceRoleKey());
}

export function getSupabaseUrl(): string {
  return normalizeSupabaseUrl(
    required(
      "NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL alias)",
      readFirstEnv(...SUPABASE_URL_KEYS),
    ),
  );
}

export function getSupabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY (or supported alias)",
    readFirstEnv(...SUPABASE_ANON_KEYS),
  );
}

export function getSupabaseServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY alias)",
    readFirstEnv(...SUPABASE_SERVICE_ROLE_KEYS),
  );
}

/** Canonical production origin when env vars are unset (UK marketplace). */
export const DEFAULT_APP_URL = "https://www.rovexo.co.uk";

function normalizeAppOrigin(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Canonical app origin for auth callbacks, Stripe return URLs, sitemaps, and metadata.
 * Set `NEXT_PUBLIC_APP_URL` in production (e.g. https://www.rovexo.co.uk).
 * Not used by middleware redirects — missing values do not cause HTTP redirect loops.
 */
export function getAppUrl(): string {
  const configured = readFirstEnv("NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL");
  if (configured) {
    return normalizeAppOrigin(configured);
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl) {
    return normalizeAppOrigin(productionUrl);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return normalizeAppOrigin(vercelUrl);
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_APP_URL;
  }

  return "http://localhost:3000";
}
