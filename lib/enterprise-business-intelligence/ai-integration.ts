import type { ForecastResult } from "@/lib/enterprise-business-intelligence/types";
import { AI_BI_SOURCES } from "@/lib/enterprise-business-intelligence/registry";

export function generateBiAiInsights(forecasts: ForecastResult[]) {
  return forecasts.map((f) => ({
    id: `ai-${f.id}`,
    source: f.source,
    type: f.type,
    summary: f.summary,
    confidence: f.confidence,
  }));
}

export function allAiSourcesPresent(forecasts: ForecastResult[]): boolean {
  return AI_BI_SOURCES.every((s) => forecasts.some((f) => f.source === s));
}

export function scanPatternCount(forecasts: ForecastResult[]): number {
  return forecasts.filter((f) => f.source === "scan").length;
}

export function sentinelRiskCount(forecasts: ForecastResult[]): number {
  return forecasts.filter((f) => f.source === "sentinel").length;
}

export function omegaForecastCount(forecasts: ForecastResult[]): number {
  return forecasts.filter((f) => f.source === "omega").length;
}
