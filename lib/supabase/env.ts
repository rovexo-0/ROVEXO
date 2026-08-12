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

/**
 * Next.js only inlines NEXT_PUBLIC_* when accessed as static property paths.
 * Dynamic `process.env[name]` is undefined in the browser bundle → Realtime NO_CLIENT.
 */
function readPublicSupabaseUrlRaw(): string | undefined {
  const fromPublic = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (fromPublic && !isUnusableSecret(fromPublic)) return fromPublic;
  const fromAlias = process.env.SUPABASE_URL?.trim();
  if (fromAlias && !isUnusableSecret(fromAlias)) return fromAlias;
  return undefined;
}

function readPublicSupabaseAnonKeyRaw(): string | undefined {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anon && !isUnusableSecret(anon)) return anon;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishable && !isUnusableSecret(publishable)) return publishable;
  const alias = process.env.SUPABASE_ANON_KEY?.trim();
  if (alias && !isUnusableSecret(alias)) return alias;
  return undefined;
}

function readServiceRoleKeyRaw(): string | undefined {
  const primary = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (primary && !isUnusableSecret(primary)) return primary;
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (secret && !isUnusableSecret(secret)) return secret;
  return undefined;
}

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
  const raw = readPublicSupabaseUrlRaw();
  if (!raw) return null;
  try {
    return normalizeSupabaseUrl(raw);
  } catch {
    return null;
  }
}

export function tryGetSupabaseAnonKey(): string | null {
  return readPublicSupabaseAnonKeyRaw() ?? null;
}

export function tryGetSupabaseServiceRoleKey(): string | undefined {
  return readServiceRoleKeyRaw();
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
      readPublicSupabaseUrlRaw(),
    ),
  );
}

export function getSupabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY (or supported alias)",
    readPublicSupabaseAnonKeyRaw(),
  );
}

export function getSupabaseServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY alias)",
    readServiceRoleKeyRaw(),
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

/** Loopback origins are valid for local development only — never for production CSRF/app identity. */
export function isLoopbackAppOrigin(raw: string): boolean {
  try {
    const host = new URL(normalizeAppOrigin(raw)).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

/**
 * Canonical app origin for auth callbacks, Stripe return URLs, sitemaps, and metadata.
 * Set `NEXT_PUBLIC_APP_URL` in production (e.g. https://www.rovexo.co.uk).
 * Not used by middleware redirects — missing values do not cause HTTP redirect loops.
 *
 * Production fail-closed: ignore loopback / placeholder env values so CSRF and
 * callbacks never resolve `http://localhost:3000` on a production runtime.
 */
export function getAppUrl(): string {
  const configured = readFirstEnv("NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL");
  if (configured) {
    const normalized = normalizeAppOrigin(configured);
    if (process.env.NODE_ENV === "production" && isLoopbackAppOrigin(normalized)) {
      // Fall through — local .env.local must not override production origin identity.
    } else {
      return normalized;
    }
  }

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionUrl && !isUnusableSecret(productionUrl) && !isLoopbackAppOrigin(productionUrl)) {
    return normalizeAppOrigin(productionUrl);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl && !isUnusableSecret(vercelUrl) && !isLoopbackAppOrigin(vercelUrl)) {
    return normalizeAppOrigin(vercelUrl);
  }

  if (process.env.NODE_ENV === "production") {
    return DEFAULT_APP_URL;
  }

  return "http://localhost:3000";
}
