function required(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
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

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${trimmed}" is not a valid URL.`,
    );
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: "${trimmed}" must use http or https.`,
    );
  }

  if (!url.hostname.endsWith(".supabase.co")) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL hostname "${url.hostname}". Expected *.supabase.co`,
    );
  }

  const correctedHostname = SUPABASE_HOSTNAME_CORRECTIONS[url.hostname];
  if (correctedHostname) {
    url.hostname = correctedHostname;
  }

  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL: use the project origin only (no path).`,
    );
  }

  return url.origin;
}

export function getSupabaseUrl(): string {
  return normalizeSupabaseUrl(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  );
}

export function getSupabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseServiceRoleKey(): string {
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "http://localhost:3000";
}
