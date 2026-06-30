import type { AiPrediction, PredictionType } from "@/lib/enterprise-ai-operating-system/types";
import { PREDICTION_TYPES } from "@/lib/enterprise-ai-operating-system/registry";

const UNITS: Record<PredictionType, string> = {
  traffic: "sessions",
  sales: "orders",
  revenue: "USD",
  fraud: "score",
  chargebacks: "count",
  "server-load": "percent",
  "storage-growth": "GB",
  "database-growth": "GB",
  "cpu-usage": "percent",
  "memory-usage": "percent",
  bandwidth: "Mbps",
  "marketplace-growth": "percent",
  "business-growth": "percent",
};

export function generatePrediction(type: PredictionType, horizon: AiPrediction["horizon"] = "7d"): AiPrediction {
  const base = type.includes("usage") || type.includes("load") || type.includes("growth") ? 45 : 1200;
  return {
    id: `pred-${type}-${Date.now()}`,
    type,
    horizon,
    value: base + Math.floor(Math.random() * 100),
    unit: UNITS[type],
    confidence: 0.7 + Math.random() * 0.25,
    trend: Math.random() > 0.5 ? "up" : "stable",
    generatedAt: new Date().toISOString(),
  };
}

export function generateAllPredictions(): AiPrediction[] {
  return PREDICTION_TYPES.map((type) => generatePrediction(type));
}

export function filterPredictionsByType(predictions: AiPrediction[], type: PredictionType): AiPrediction[] {
  return predictions.filter((p) => p.type === type);
}

export function averagePredictionConfidence(predictions: AiPrediction[]): number {
  if (predictions.length === 0) return 0;
  return Math.round((predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length) * 100);
}
