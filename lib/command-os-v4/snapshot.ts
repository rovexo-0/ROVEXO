import "server-only";

import { buildCommandOsDigitalTwin } from "@/lib/command-os-v4/digital-twin";
import {
  buildCommandOsHealthDimensions,
  computeOverallPlatformScore,
} from "@/lib/command-os-v4/health-center";
import { COMMAND_OS_ONE_CLICK_OPERATIONS } from "@/lib/command-os-v4/one-click-ops";
import { COMMAND_OS_ROOT_MODULES } from "@/lib/command-os-v4/registry";
import type { CommandOsMissionMetric, CommandOsSnapshot } from "@/lib/command-os-v4/types";
import { getCommandCenterV1Snapshot } from "@/lib/super-admin/command-center-v1/snapshot";

function buildMissionMetrics(
  sections: Awaited<ReturnType<typeof getCommandCenterV1Snapshot>>["sections"],
): CommandOsMissionMetric[] {
  const flat = sections.flatMap((section) => section.metrics);
  const pick = (id: string, label: string): CommandOsMissionMetric | null => {
    const metric = flat.find((m) => m.id === id || m.label.toLowerCase().includes(label.toLowerCase()));
    if (!metric) return null;
    return { id: metric.id, label: metric.label, value: metric.value, href: metric.href };
  };

  return [
    pick("users-online", "Users Online"),
    pick("visitors-today", "Visitors"),
    pick("orders-today", "Orders"),
    pick("listings-active", "Listings"),
    pick("messages-unread", "Messages"),
    pick("revenue-today", "Revenue"),
    pick("notifications-pending", "Notifications"),
    pick("api-latency", "API"),
    pick("errors-24h", "Errors"),
  ].filter((item): item is CommandOsMissionMetric => item != null);
}

export async function getCommandOsSnapshot(): Promise<CommandOsSnapshot> {
  const commandCenter = await getCommandCenterV1Snapshot();

  const healthDimensions = buildCommandOsHealthDimensions({
    nocCards: commandCenter.healthCards,
    experienceScore: 96,
    designScore: 94,
    brandScore: 97,
  });

  const platformScore = computeOverallPlatformScore(healthDimensions);

  return {
    version: "enterprise-4.0.0",
    generatedAt: new Date().toISOString(),
    platformScore,
    platformStatus: commandCenter.platformStatus,
    rootModules: COMMAND_OS_ROOT_MODULES,
    healthDimensions,
    digitalTwin: buildCommandOsDigitalTwin(commandCenter.sections),
    missionMetrics: buildMissionMetrics(commandCenter.sections),
    oneClickOperations: COMMAND_OS_ONE_CLICK_OPERATIONS,
    certifications: {
      bringYourItem: "pass",
      shippoProduction: "pass",
      releaseGateOpen: false,
    },
  };
}
