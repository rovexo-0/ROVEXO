import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/supabase/env";

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function allowedHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const key of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL"]) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      hosts.add(new URL(raw.startsWith("http") ? raw : `https://${raw}`).host);
    } catch {
      // ignore invalid URL
    }
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) hosts.add(vercel);

  if (process.env.NODE_ENV !== "production") {
    hosts.add("localhost:3000");
    hosts.add("127.0.0.1:3000");
  }

  return hosts;
}

function hostFromHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

/** Blocks cross-site mutation requests when Origin/Referer do not match the app host. */
export function validateMutationOrigin(request: Request): NextResponse | null {
  if (!MUTATION_METHODS.has(request.method.toUpperCase())) {
    return null;
  }

  const hosts = allowedHosts();
  if (hosts.size === 0) {
    return null;
  }

  const originHost = hostFromHeader(request.headers.get("origin"));
  if (originHost && hosts.has(originHost)) {
    return null;
  }

  const refererHost = hostFromHeader(request.headers.get("referer"));
  if (refererHost && hosts.has(refererHost)) {
    return null;
  }

  if (!originHost && !refererHost && process.env.NODE_ENV !== "production") {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      error: "Cross-origin mutation blocked.",
      diagnostics: { guard: "csrf-origin", appUrl: getAppUrl() },
    },
    { status: 403 },
  );
}
