import "server-only";

import { processPendingResolutionCases } from "@/lib/resolution-engine/processor";
import { getOrderResolutionSummary, getResolutionMonitorStats } from "@/lib/resolution-engine/read-model";

export const ResolutionEngine = {
  processPendingCases: processPendingResolutionCases,
  getOrderResolutionSummary,
  getMonitorStats: getResolutionMonitorStats,
} as const;

export {
  processPendingResolutionCases,
  getOrderResolutionSummary,
  getResolutionMonitorStats,
};
export * from "@/lib/resolution-engine/types";
