import "server-only";

import {
  detectParcel2GoEnvironment,
  isParcel2GoConfigured,
  tryGetParcel2GoApiUrl,
  tryGetParcel2GoAuthUrl,
} from "@/src/services/shipping/env";
import {
  getCachedTokenExpiresAtIso,
  getParcel2GoAccessToken,
  isCachedTokenValid,
} from "@/src/services/shipping/parcel2go/auth";
import { Parcel2GoClient, PARCEL2GO_PROVIDER_VERSION } from "@/src/services/shipping/parcel2go/client";
import { toShippingError } from "@/src/services/shipping/errors";
import { createCorrelationId, ShippingLogger } from "@/src/services/shipping/logger";
import type { ShippingHealthCheck, ShippingHealthResult } from "@/src/services/shipping/types";

function buildBaseReport(): ShippingHealthResult {
  const authUrl = tryGetParcel2GoAuthUrl();
  const apiUrl = tryGetParcel2GoApiUrl();
  const credentialsLoaded = isParcel2GoConfigured();

  return {
    provider: "parcel2go",
    version: PARCEL2GO_PROVIDER_VERSION,
    configured: credentialsLoaded,
    credentialsLoaded,
    status: "degraded",
    oauthOk: false,
    tokenObtained: false,
    tokenValid: false,
    tokenExpiresAt: null,
    apiReachable: false,
    environment: detectParcel2GoEnvironment(apiUrl),
    authUrl,
    apiUrl,
    latencyMs: 0,
    checks: [],
  };
}

function pushCheck(
  checks: ShippingHealthCheck[],
  check: ShippingHealthCheck,
): ShippingHealthCheck {
  checks.push(check);
  return check;
}

/**
 * Production OAuth health probe — confirms credentials, token acquisition, and API reachability.
 * Server-side only; never exposes secrets.
 */
export async function checkParcel2GoAuthHealth(correlationId?: string): Promise<ShippingHealthResult> {
  const logger = new ShippingLogger("parcel2go", correlationId ?? createCorrelationId());
  const startedAt = Date.now();
  const report = buildBaseReport();
  const checks = report.checks;

  const credentialsCheck = pushCheck(checks, {
    id: "credentials_loaded",
    label: "Credentials loaded",
    pass: report.credentialsLoaded,
    message: report.credentialsLoaded
      ? "PARCEL2GO_CLIENT_ID, PARCEL2GO_CLIENT_SECRET, PARCEL2GO_AUTH_URL, and PARCEL2GO_API_URL are set"
      : "Missing one or more Parcel2Go environment variables",
  });

  if (!credentialsCheck.pass) {
    report.message = credentialsCheck.message;
    report.latencyMs = Date.now() - startedAt;
    return report;
  }

  let tokenObtained = false;
  let oauthOk = false;

  const tokenStart = Date.now();
  try {
    await getParcel2GoAccessToken(logger);
    tokenObtained = true;
    oauthOk = true;

    pushCheck(checks, {
      id: "token_obtained",
      label: "OAuth token obtained",
      pass: true,
      durationMs: Date.now() - tokenStart,
      message: "POST /auth/connect/token succeeded (client credentials flow)",
    });
  } catch (error) {
    const shippingError = toShippingError(error, "authentication");
    pushCheck(checks, {
      id: "token_obtained",
      label: "OAuth token obtained",
      pass: false,
      durationMs: Date.now() - tokenStart,
      message: shippingError.message,
    });

    report.status = "unhealthy";
    report.message = shippingError.message;
    report.latencyMs = Date.now() - startedAt;
    return report;
  }

  const tokenValid = isCachedTokenValid();
  const tokenExpiresAt = getCachedTokenExpiresAtIso();

  pushCheck(checks, {
    id: "token_valid",
    label: "Token valid (cached)",
    pass: tokenValid,
    message: tokenValid
      ? `Token cached until ${tokenExpiresAt ?? "unknown"}`
      : "Token missing or within refresh buffer",
  });

  const probeStart = Date.now();
  const client = new Parcel2GoClient({ correlationId: logger.correlationId, retries: 0 });
  const probe = await client.probeApiReachability();

  pushCheck(checks, {
    id: "api_reachable",
    label: "API reachable",
    pass: probe.reachable,
    durationMs: Date.now() - probeStart,
    message: probe.reachable
      ? probe.message ?? "Parcel2Go API responded to authenticated probe"
      : probe.message ?? "Parcel2Go API unreachable",
  });

  report.oauthOk = oauthOk;
  report.tokenObtained = tokenObtained;
  report.tokenValid = tokenValid;
  report.tokenExpiresAt = tokenExpiresAt;
  report.apiReachable = probe.reachable;
  report.latencyMs = Date.now() - startedAt;

  const allPass = credentialsCheck.pass && tokenObtained && tokenValid && probe.reachable;
  const partialPass = credentialsCheck.pass && tokenObtained && tokenValid;

  report.status = allPass ? "healthy" : partialPass ? "degraded" : "unhealthy";
  report.message =
    report.status === "healthy"
      ? "Parcel2Go production OAuth authentication healthy"
      : report.status === "degraded"
        ? probe.message ?? "OAuth succeeded but API probe did not fully pass"
        : "Parcel2Go OAuth health check failed";

  logger.log({
    level: report.status === "healthy" ? "info" : report.status === "degraded" ? "warn" : "error",
    provider: "parcel2go",
    correlationId: logger.correlationId,
    event: "health",
    message: report.message,
    durationMs: report.latencyMs,
    details: {
      status: report.status,
      environment: report.environment,
      checks: checks.map((check) => ({ id: check.id, pass: check.pass })),
    },
  });

  return report;
}
