import type { MobileAiInsight, MobileAiSuggestion, MobileBuild, MobileDevice } from "@/lib/enterprise-mobile-control-center/types";
import { MOBILE_AI_MONITOR_TYPES, MOBILE_AI_SUGGESTION_TYPES } from "@/lib/enterprise-mobile-control-center/registry";
import { averageDeviceHealth } from "@/lib/enterprise-mobile-control-center/devices";

export function generateMobileAiInsights(devices: MobileDevice[], _builds: MobileBuild[]): MobileAiInsight[] {
  void _builds;
  const health = averageDeviceHealth(devices);
  return MOBILE_AI_MONITOR_TYPES.map((monitorType) => ({
    id: `ai-${monitorType}`,
    monitorType,
    score: monitorType === "device-health" ? health : 75 + Math.floor(Math.random() * 20),
    summary: `${monitorType.replace(/-/g, " ")} within expected range`,
  }));
}

export function generateMobileAiSuggestions(devices: MobileDevice[], builds: MobileBuild[]): MobileAiSuggestion[] {
  const suggestions: MobileAiSuggestion[] = [];
  const outdated = devices.filter((d) => d.appVersion !== "2.4.0");
  if (outdated.length > 0) {
    suggestions.push({
      id: "sug-update",
      type: "update-schedule",
      title: "Schedule OTA for outdated devices",
      description: `${outdated.length} devices running older versions`,
      confidence: 0.89,
    });
  }
  if (builds.some((b) => b.status === "failed")) {
    suggestions.push({
      id: "sug-rollback",
      type: "rollback-recommendation",
      title: "Consider rollback after failed build",
      description: "Recent build failure detected — review release pipeline",
      confidence: 0.91,
    });
  }
  suggestions.push({
    id: "sug-release",
    type: "release-recommendation",
    title: "Promote 2.4.0 to production",
    description: "Beta metrics stable — recommend production release",
    confidence: 0.85,
  });
  suggestions.push({
    id: "sug-device",
    type: "device-optimisation",
    title: "Optimise battery on Android fleet",
    description: "Average battery below target on 2 devices",
    confidence: 0.78,
  });
  return suggestions.filter((s) => MOBILE_AI_SUGGESTION_TYPES.includes(s.type));
}
