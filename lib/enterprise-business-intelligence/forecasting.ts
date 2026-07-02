import type { ForecastResult, ForecastType } from "@/lib/enterprise-business-intelligence/types";
import { FORECAST_TYPES } from "@/lib/enterprise-business-intelligence/registry";

export function isValidForecastType(value: string): value is ForecastType {
  return (FORECAST_TYPES as readonly string[]).includes(value);
}

export function generateForecasts(): ForecastResult[] {
  const configs: Array<{ type: ForecastType; source: ForecastResult["source"]; value: number; confidence: number; summary: string }> = [
    { type: "revenue", source: "omega", value: 3120000, confidence: 88, summary: "OMEGA predicts 9.6% revenue growth next quarter" },
    { type: "growth", source: "scan", value: 12.4, confidence: 82, summary: "SCAN detected positive growth pattern in marketplace GMV" },
    { type: "demand", source: "omega", value: 19800, confidence: 85, summary: "OMEGA forecasts 7.5% increase in order demand" },
    { type: "capacity", source: "sentinel", value: 78, confidence: 79, summary: "SENTINEL assesses infrastructure capacity at 78% utilization" },
    { type: "marketplace-trends", source: "scan", value: 15.2, confidence: 74, summary: "SCAN identifies electronics category trending +15.2%" },
  ];

  return configs.map((c, i) => ({
    id: `forecast-${i + 1}`,
    type: c.type,
    source: c.source,
    period: "next-quarter",
    predictedValue: c.value,
    confidence: c.confidence,
    summary: c.summary,
  }));
}

export function runForecast(type: ForecastType): ForecastResult | undefined {
  return generateForecasts().find((f) => f.type === type);
}

export function averageForecastConfidence(forecasts: ForecastResult[]): number {
  if (forecasts.length === 0) return 0;
  return Math.round(forecasts.reduce((s, f) => s + f.confidence, 0) / forecasts.length);
}

export function coversAllForecastTypes(forecasts: ForecastResult[]): boolean {
  return FORECAST_TYPES.every((t) => forecasts.some((f) => f.type === t));
}
