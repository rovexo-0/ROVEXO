import "server-only";

import { runBringYourItemCertification } from "@/lib/bring-your-item/certification";
import { getCommandOsOneClickOperation } from "@/lib/command-os-v4/one-click-ops";
import { searchCommandOs } from "@/lib/command-os-v4/global-search";
import { getCommandOsSnapshot } from "@/lib/command-os-v4/snapshot";
import {
  runAiExperienceGuardian,
  runDesignStudioAudit,
  runFullXosRescan,
} from "@/lib/design-studio-v1";

export async function executeCommandOsAction(action: string, payload?: { query?: string; historyId?: string }) {
  const operation = getCommandOsOneClickOperation(action);
  if (!operation && action !== "global-search") {
    return { ok: false, error: `Unknown Command OS action: ${action}` };
  }

  switch (action) {
    case "global-search":
      return { ok: true, results: searchCommandOs(payload?.query ?? "", 40) };
    case "run-full-audit": {
      const audit = runDesignStudioAudit();
      return { ok: true, message: "Full audit completed", audit };
    }
    case "run-certification": {
      const byi = runBringYourItemCertification();
      const sendcloud = byi.steps.find((step) => step.id === "sendcloud");
      return {
        ok: true,
        message: "Certification gates evaluated",
        bringYourItem: { pass: byi.pass, score: byi.score },
        sendcloud: { pass: sendcloud?.pass ?? false, score: sendcloud ? byi.score : 0 },
      };
    }
    case "repair-assets":
    case "optimize-assets":
    case "optimize-images":
    case "xos-rescan": {
      const rescan = await runFullXosRescan();
      return { ok: true, message: "Experience OS rescan completed", rescan };
    }
    case "repair-components": {
      const guardian = runAiExperienceGuardian();
      return { ok: true, message: "AI Experience Guardian scan completed", guardian };
    }
    case "health-scan": {
      const snapshot = await getCommandOsSnapshot();
      return { ok: true, message: "Health scan completed", platformScore: snapshot.platformScore, healthDimensions: snapshot.healthDimensions };
    }
    case "security-scan":
      return { ok: true, message: "Security scan delegated to Security OS", href: "/super-admin/security-engine" };
    case "performance-scan":
      return { ok: true, message: "Performance scan delegated to Monitoring OS", href: "/super-admin/monitoring" };
    case "publish-platform":
      return { ok: true, message: "Publish requires approval via Release OS", href: "/super-admin/experience?tab=publish" };
    case "rollback-platform":
      return { ok: true, message: "Rollback requires history ID via Release OS", href: "/super-admin/experience?tab=publish", historyId: payload?.historyId ?? null };
    case "backup-platform":
      return { ok: true, message: "Backup delegated to Backup Center", href: "/super-admin/recovery" };
    default:
      return { ok: false, error: `Unhandled action: ${action}` };
  }
}
