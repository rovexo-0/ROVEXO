import { servicePointEngineDisabledResponse } from "@/lib/shipping/service-point-engine-v1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Service Point Engine v1.0 — list/search.
 * Gate 0: always fail closed until SERVICE_POINT_ENGINE_ENABLED=true
 * and Sendcloud API integration is certified.
 */
export async function GET() {
  return servicePointEngineDisabledResponse();
}

export async function POST() {
  return servicePointEngineDisabledResponse();
}
