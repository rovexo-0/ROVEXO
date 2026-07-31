/**
 * ROVEXO SERVICE POINT ENGINE v1.0 — Gate 0
 *
 * STATUS: GATE 0 FREEZE · FAIL CLOSED
 * SERVICE_POINT_ENGINE_ENABLED defaults to false.
 * No Service Point picker · persistence · parcel SP fields until Gate 0 PASS
 * (Sendcloud API integration certified for service_point_enabled Save).
 *
 * SSOT for flag + fail-closed responses.
 */

export const SERVICE_POINT_ENGINE_V1 = {
  version: "1.0.0",
  id: "service-point-engine-v1",
  envKey: "SERVICE_POINT_ENGINE_ENABLED",
  feature: "service_points",
  gate0Reason: "Sendcloud API integration not certified",
} as const;

export type ServicePointDisabledBody = {
  feature: "service_points";
  status: "disabled";
  reason: string;
};

/** Default false — unset / empty / anything other than 1|true → disabled. */
export function isServicePointEngineEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = env[SERVICE_POINT_ENGINE_V1.envKey]?.trim().toLowerCase();
  return raw === "1" || raw === "true";
}

export function servicePointEngineDisabledBody(): ServicePointDisabledBody {
  return {
    feature: SERVICE_POINT_ENGINE_V1.feature,
    status: "disabled",
    reason: SERVICE_POINT_ENGINE_V1.gate0Reason,
  };
}

/**
 * Gate 0 fail-closed JSON for Service Point HTTP routes.
 * Always 503 while the engine is disabled.
 */
export function servicePointEngineDisabledResponse(): Response {
  return Response.json(servicePointEngineDisabledBody(), { status: 503 });
}

/** Throw if code paths attempt SP side effects while Gate 0 is closed. */
export function assertServicePointEngineEnabled(): void {
  if (!isServicePointEngineEnabled()) {
    throw new Error(
      `[SERVICE POINT ENGINE v1.0] GATE 0 BLOCKED — ${SERVICE_POINT_ENGINE_V1.gate0Reason}`,
    );
  }
}
