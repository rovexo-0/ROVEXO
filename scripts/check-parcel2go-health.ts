#!/usr/bin/env node
/**
 * Parcel2Go Production OAuth live health check.
 * Usage: npx tsx scripts/check-parcel2go-health.ts
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile(file: string): void {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const PRODUCTION_AUTH_URL = "https://www.parcel2go.com/auth";
const PRODUCTION_API_URL = "https://www.parcel2go.com";
const OAUTH_SCOPE = "public-api payment";

type HealthCheck = {
  id: string;
  label: string;
  pass: boolean;
  message?: string;
  durationMs?: number;
};

type HealthReport = {
  ok: boolean;
  provider: string;
  version: string;
  environment: string;
  status: "healthy" | "degraded" | "unhealthy";
  credentialsLoaded: boolean;
  clientIdPresent: boolean;
  clientSecretPresent: boolean;
  oauthOk: boolean;
  tokenObtained: boolean;
  tokenValid: boolean;
  tokenExpiresAt: string | null;
  apiReachable: boolean;
  authUrl: string | null;
  apiUrl: string | null;
  tokenUrl: string | null;
  latencyMs: number;
  checks: HealthCheck[];
  message?: string;
  configurationFixes?: string[];
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveTokenUrl(authUrl: string): string {
  const base = normalizeBaseUrl(authUrl);
  if (base.endsWith("/connect/token")) return base;
  if (base.endsWith("/auth")) return `${base}/connect/token`;
  return `${base}/auth/connect/token`;
}

function detectEnvironment(apiUrl: string | null): string {
  if (!apiUrl) return "unknown";
  const normalized = apiUrl.toLowerCase();
  if (normalized.includes("sandbox.parcel2go.com")) return "sandbox";
  if (
    normalized.includes("www.parcel2go.com") ||
    normalized.includes("api.parcel2go.com") ||
    normalized === "https://parcel2go.com"
  ) {
    return "production";
  }
  return "unknown";
}

function maskClientId(clientId: string): string {
  if (clientId.length <= 8) return "[set]";
  return `${clientId.slice(0, 4)}…${clientId.slice(-4)}`;
}

async function requestToken(tokenUrl: string, clientId: string, clientSecret: string): Promise<{
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: OAUTH_SCOPE,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "*/*",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = (await response.json()) as {
        error?: string;
        error_description?: string;
        message?: string;
      };
      message = payload.error_description ?? payload.message ?? payload.error ?? message;
    } catch {
      // keep status text
    }
    throw new Error(`OAuth failed (${response.status}): ${message}`);
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
  };

  if (!payload.access_token || !payload.expires_in) {
    throw new Error("OAuth response missing access_token or expires_in");
  }

  return {
    accessToken: payload.access_token,
    expiresIn: payload.expires_in,
    tokenType: payload.token_type ?? "Bearer",
  };
}

async function probeApi(apiUrl: string, accessToken: string): Promise<{
  reachable: boolean;
  message?: string;
}> {
  const url = `${normalizeBaseUrl(apiUrl)}/api/orders?page=1&pageSize=1`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (response.ok) {
    return { reachable: true, message: "Parcel2Go API responded OK to authenticated probe" };
  }

  if (response.status >= 400 && response.status < 500) {
    let message = response.statusText;
    try {
      const payload = (await response.json()) as { message?: string; detail?: string };
      message = payload.detail ?? payload.message ?? message;
    } catch {
      // keep status text
    }
    return {
      reachable: true,
      message: `Parcel2Go API reachable (HTTP ${response.status}: ${message})`,
    };
  }

  return {
    reachable: false,
    message: `Parcel2Go API unreachable (HTTP ${response.status})`,
  };
}

async function runHealthCheck(): Promise<HealthReport> {
  const startedAt = Date.now();
  const checks: HealthCheck[] = [];
  const configurationFixes: string[] = [];

  const clientId = process.env.PARCEL2GO_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.PARCEL2GO_CLIENT_SECRET?.trim() ?? "";
  let authUrl = process.env.PARCEL2GO_AUTH_URL?.trim() ?? "";
  let apiUrl = process.env.PARCEL2GO_API_URL?.trim() ?? "";

  const clientIdPresent = Boolean(clientId);
  const clientSecretPresent = Boolean(clientSecret);
  const credentialsLoaded = clientIdPresent && clientSecretPresent && Boolean(authUrl) && Boolean(apiUrl);

  checks.push({
    id: "client_id",
    label: "Client ID",
    pass: clientIdPresent,
    message: clientIdPresent ? `Client ID loaded (${maskClientId(clientId)})` : "PARCEL2GO_CLIENT_ID is missing",
  });

  checks.push({
    id: "client_secret",
    label: "Client Secret",
    pass: clientSecretPresent,
    message: clientSecretPresent ? "Client secret loaded" : "PARCEL2GO_CLIENT_SECRET is missing",
  });

  checks.push({
    id: "credentials_loaded",
    label: "Credentials loaded",
    pass: credentialsLoaded,
    message: credentialsLoaded
      ? "All Parcel2Go environment variables are set"
      : "Missing one or more Parcel2Go environment variables",
  });

  if (!credentialsLoaded) {
    return {
      ok: false,
      provider: "parcel2go",
      version: "1.0.0",
      environment: detectEnvironment(apiUrl || null),
      status: "degraded",
      credentialsLoaded: false,
      clientIdPresent,
      clientSecretPresent,
      oauthOk: false,
      tokenObtained: false,
      tokenValid: false,
      tokenExpiresAt: null,
      apiReachable: false,
      authUrl: authUrl || null,
      apiUrl: apiUrl || null,
      tokenUrl: authUrl ? resolveTokenUrl(authUrl) : null,
      latencyMs: Date.now() - startedAt,
      checks,
      message: "Parcel2Go credentials incomplete",
      configurationFixes,
    };
  }

  // Auto-fix known production URL misconfiguration (api.parcel2go.com → www.parcel2go.com)
  const normalizedApi = normalizeBaseUrl(apiUrl).toLowerCase();
  const normalizedAuth = normalizeBaseUrl(authUrl).toLowerCase();

  if (normalizedApi === "https://api.parcel2go.com") {
    apiUrl = PRODUCTION_API_URL;
    process.env.PARCEL2GO_API_URL = apiUrl;
    configurationFixes.push("PARCEL2GO_API_URL corrected to https://www.parcel2go.com");
  }

  if (normalizedAuth === "https://api.parcel2go.com/auth") {
    authUrl = PRODUCTION_AUTH_URL;
    process.env.PARCEL2GO_AUTH_URL = authUrl;
    configurationFixes.push("PARCEL2GO_AUTH_URL corrected to https://www.parcel2go.com/auth");
  }

  const tokenUrl = resolveTokenUrl(authUrl);
  let oauthOk = false;
  let tokenObtained = false;
  let tokenValid = false;
  let tokenExpiresAt: string | null = null;
  let accessToken = "";

  const tokenStart = Date.now();
  try {
    const token = await requestToken(tokenUrl, clientId, clientSecret);
    accessToken = token.accessToken;
    oauthOk = true;
    tokenObtained = true;
    tokenValid = true;
    tokenExpiresAt = new Date(Date.now() + token.expiresIn * 1_000).toISOString();

    checks.push({
      id: "token_obtained",
      label: "OAuth token",
      pass: true,
      durationMs: Date.now() - tokenStart,
      message: `POST /auth/connect/token succeeded (${token.tokenType}, expires in ${token.expiresIn}s)`,
    });

    checks.push({
      id: "token_valid",
      label: "Token valid",
      pass: true,
      message: `Token expires at ${tokenExpiresAt}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth failed";
    checks.push({
      id: "token_obtained",
      label: "OAuth token",
      pass: false,
      durationMs: Date.now() - tokenStart,
      message,
    });

    return {
      ok: false,
      provider: "parcel2go",
      version: "1.0.0",
      environment: detectEnvironment(apiUrl),
      status: "unhealthy",
      credentialsLoaded: true,
      clientIdPresent,
      clientSecretPresent,
      oauthOk: false,
      tokenObtained: false,
      tokenValid: false,
      tokenExpiresAt: null,
      apiReachable: false,
      authUrl,
      apiUrl,
      tokenUrl,
      latencyMs: Date.now() - startedAt,
      checks,
      message,
      configurationFixes,
    };
  }

  const probeStart = Date.now();
  let apiReachable = false;
  let probeMessage: string | undefined;

  try {
    const probe = await probeApi(apiUrl, accessToken);
    apiReachable = probe.reachable;
    probeMessage = probe.message;
  } catch (error) {
    probeMessage = error instanceof Error ? error.message : "API probe failed";
  }

  checks.push({
    id: "api_reachable",
    label: "API reachable",
    pass: apiReachable,
    durationMs: Date.now() - probeStart,
    message: probeMessage,
  });

  const allPass = credentialsLoaded && oauthOk && tokenValid && apiReachable;
  const partialPass = credentialsLoaded && oauthOk && tokenValid;

  return {
    ok: allPass,
    provider: "parcel2go",
    version: "1.0.0",
    environment: detectEnvironment(apiUrl),
    status: allPass ? "healthy" : partialPass ? "degraded" : "unhealthy",
    credentialsLoaded: true,
    clientIdPresent,
    clientSecretPresent,
    oauthOk,
    tokenObtained,
    tokenValid,
    tokenExpiresAt,
    apiReachable,
    authUrl,
    apiUrl,
    tokenUrl,
    latencyMs: Date.now() - startedAt,
    checks,
    message: allPass
      ? "Parcel2Go production OAuth authentication healthy"
      : partialPass
        ? probeMessage ?? "OAuth succeeded but API probe did not fully pass"
        : "Parcel2Go OAuth health check failed",
    configurationFixes: configurationFixes.length ? configurationFixes : undefined,
  };
}

function applyConfigurationFixes(fixes: string[] | undefined): void {
  if (!fixes?.length) return;

  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  let content = readFileSync(envPath, "utf8");
  let changed = false;

  for (const fix of fixes) {
    if (fix.includes("PARCEL2GO_API_URL")) {
      if (/^PARCEL2GO_API_URL=.*$/m.test(content)) {
        content = content.replace(/^PARCEL2GO_API_URL=.*$/m, `PARCEL2GO_API_URL=${PRODUCTION_API_URL}`);
      } else {
        content += `\nPARCEL2GO_API_URL=${PRODUCTION_API_URL}`;
      }
      changed = true;
    }
    if (fix.includes("PARCEL2GO_AUTH_URL")) {
      if (/^PARCEL2GO_AUTH_URL=.*$/m.test(content)) {
        content = content.replace(/^PARCEL2GO_AUTH_URL=.*$/m, `PARCEL2GO_AUTH_URL=${PRODUCTION_AUTH_URL}`);
      } else {
        content += `\nPARCEL2GO_AUTH_URL=${PRODUCTION_AUTH_URL}`;
      }
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(envPath, content, "utf8");
    loadEnvFile(".env.local");
  }
}

async function main(): Promise<void> {
  const firstReport = await runHealthCheck();

  if (firstReport.configurationFixes?.length) {
    applyConfigurationFixes(firstReport.configurationFixes);
    const secondReport = await runHealthCheck();
    secondReport.configurationFixes = [
      ...(firstReport.configurationFixes ?? []),
      ...(secondReport.configurationFixes ?? []),
    ];
    console.log(JSON.stringify(secondReport, null, 2));
    process.exit(secondReport.ok ? 0 : 1);
  }

  console.log(JSON.stringify(firstReport, null, 2));
  process.exit(firstReport.ok ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
