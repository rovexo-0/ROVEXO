function readFirstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
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

export function getSupabaseUrl(): string {
  return normalizeSupabaseUrl(
    required(
      "SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL",
      readFirstEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"),
    ),
  );
}

export function getSupabaseAnonKey(): string {
  return required(
    "SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    readFirstEnv(
      "SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ),
  );
}

export function getSupabaseServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY",
    readFirstEnv("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"),
  );
}

export function getAppUrl(): string {
  const configured = readFirstEnv("NEXT_PUBLIC_APP_URL");
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "")}`;
  }

  return "http://localhost:3000";
}
