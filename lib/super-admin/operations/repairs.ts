import type { DetectedIssue, RepairPatch, ScanResultItem } from "@/lib/super-admin/operations/types";

const REPAIR_CATALOG: Record<
  string,
  {
    problem: string;
    cause: string;
    affectedFiles: string[];
    suggestedFix: string;
    diff: string;
    lowRisk: boolean;
  }
> = {
  stripe_missing: {
    problem: "Stripe payments not configured",
    cause: "STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is missing from the environment.",
    affectedFiles: [".env.local", "lib/stripe/server.ts"],
    suggestedFix: "Add Stripe keys to .env.local and redeploy. Register webhook endpoint in Stripe Dashboard.",
    diff: "+ STRIPE_SECRET_KEY=sk_live_...\n+ STRIPE_WEBHOOK_SECRET=whsec_...",
    lowRisk: false,
  },
  redis_missing: {
    problem: "Redis cache not configured",
    cause: "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set.",
    affectedFiles: [".env.local", "lib/api/rate-limit.ts"],
    suggestedFix: "Provision Upstash Redis and add REST credentials to .env.local.",
    diff: "+ UPSTASH_REDIS_REST_URL=https://...\n+ UPSTASH_REDIS_REST_TOKEN=...",
    lowRisk: false,
  },
  cron_missing: {
    problem: "Cron secret not configured",
    cause: "CRON_SECRET is missing; scheduled maintenance cannot authenticate.",
    affectedFiles: [".env.local", "vercel.json", "app/api/cron/maintenance/route.ts"],
    suggestedFix: "Generate a strong CRON_SECRET and add it to Vercel environment variables.",
    diff: "+ CRON_SECRET=<generate-secure-random-string>",
    lowRisk: false,
  },
  email_missing: {
    problem: "Transactional email not fully configured",
    cause: "RESEND_API_KEY or EMAIL_FROM is missing.",
    affectedFiles: [".env.local", "lib/email/service.ts"],
    suggestedFix: "Add Resend API key and verified sender address to environment.",
    diff: "+ RESEND_API_KEY=re_...\n+ EMAIL_FROM=ROVEXO <noreply@yourdomain.com>",
    lowRisk: false,
  },
  cron_stale: {
    problem: "Cron jobs have not run recently",
    cause: "No successful cron_job_runs entry in the last hour.",
    affectedFiles: ["app/api/cron/maintenance/route.ts", "vercel.json"],
    suggestedFix: "Trigger /api/cron/maintenance manually with CRON_SECRET or verify Vercel cron schedule.",
    diff: "# curl -H \"Authorization: Bearer $CRON_SECRET\" https://<domain>/api/cron/maintenance",
    lowRisk: true,
  },
  ssl_http: {
    problem: "Production app URL is not HTTPS",
    cause: "NEXT_PUBLIC_APP_URL does not use https:// in production.",
    affectedFiles: [".env.local", "next.config.ts"],
    suggestedFix: "Set NEXT_PUBLIC_APP_URL to your HTTPS production origin.",
    diff: "NEXT_PUBLIC_APP_URL=https://rovexo.com",
    lowRisk: false,
  },
};

function repairIdForScan(item: ScanResultItem): string | null {
  if (item.id === "stripe" && item.status !== "healthy") return "stripe_missing";
  if (item.id === "redis" && item.status !== "healthy") return "redis_missing";
  if (item.id === "cron" && item.message.includes("CRON_SECRET")) return "cron_missing";
  if (item.id === "cron" && item.message.includes("over 1 hour")) return "cron_stale";
  if (item.id === "resend" && item.status !== "healthy") return "email_missing";
  if (item.id === "ssl" && item.status === "critical") return "ssl_http";
  return null;
}

export function issuesFromScan(scanResults: ScanResultItem[]): DetectedIssue[] {
  return scanResults
    .filter((item) => item.status !== "healthy")
    .map((item) => {
      const repairId = repairIdForScan(item);
      const catalog = repairId ? REPAIR_CATALOG[repairId] : null;
      return {
        id: `issue-${item.id}`,
        problem: catalog?.problem ?? `${item.label} reported ${item.status}`,
        cause: catalog?.cause ?? item.message,
        severity: item.status,
        affectedFiles: catalog?.affectedFiles ?? [`app/api/${item.id}/route.ts`].filter(() =>
          item.id.includes("-"),
        ),
        suggestedFix: catalog?.suggestedFix ?? `Review ${item.label} configuration and logs.`,
        repairId,
        rollbackAvailable: Boolean(repairId),
      } satisfies DetectedIssue;
    });
}

export function generateRepairPatch(issue: DetectedIssue): RepairPatch | null {
  if (!issue.repairId || !REPAIR_CATALOG[issue.repairId]) return null;
  const catalog = REPAIR_CATALOG[issue.repairId]!;
  return {
    id: `patch-${issue.repairId}-${Date.now()}`,
    issueId: issue.id,
    title: catalog.problem,
    description: catalog.suggestedFix,
    diff: catalog.diff,
    createdAt: new Date().toISOString(),
    appliedAt: null,
    rolledBackAt: null,
  };
}

export type RepairActionResult = {
  ok: boolean;
  message: string;
  incident?: {
    issue: string;
    aiSolution: string;
    repairTimeMs: number;
    status: "completed" | "failed";
    rollbackAvailable: boolean;
  };
};

export async function applyLowRiskRepair(input: {
  repairId: string;
  actorId: string;
}): Promise<RepairActionResult> {
  const start = Date.now();
  const catalog = REPAIR_CATALOG[input.repairId];
  if (!catalog?.lowRisk) {
    return { ok: false, message: "This repair requires manual confirmation and cannot be auto-applied." };
  }

  if (input.repairId === "cron_stale") {
    const cronSecret = process.env.CRON_SECRET?.trim();
    if (!cronSecret) {
      return { ok: false, message: "CRON_SECRET must be configured before triggering maintenance." };
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    try {
      const response = await fetch(`${baseUrl}/api/cron/maintenance`, {
        method: "GET",
        headers: { Authorization: `Bearer ${cronSecret}` },
        cache: "no-store",
      });
      const repairTimeMs = Date.now() - start;
      if (!response.ok) {
        return {
          ok: false,
          message: `Maintenance trigger failed (${response.status}).`,
        };
      }
      const { auditSuperAdminAction } = await import("@/lib/super-admin/audit");
      await auditSuperAdminAction({
        actorId: input.actorId,
        action: "ai_operations.repair.cron_trigger",
        resourceType: "platform",
        metadata: { repairId: input.repairId },
      });
      return {
        ok: true,
        message: "Maintenance cron triggered successfully.",
        incident: {
          issue: catalog.problem,
          aiSolution: "Triggered maintenance cron endpoint",
          repairTimeMs,
          status: "completed",
          rollbackAvailable: false,
        },
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Maintenance trigger failed.",
      };
    }
  }

  return { ok: false, message: "No automated handler for this repair." };
}

export async function applyConfirmedRepair(input: {
  repairId: string;
  actorId: string;
  confirmed: boolean;
}): Promise<RepairActionResult> {
  if (!input.confirmed) {
    return { ok: false, message: "Repair not confirmed." };
  }

  const catalog = REPAIR_CATALOG[input.repairId];
  if (!catalog) {
    return { ok: false, message: "Unknown repair." };
  }

  const start = Date.now();
  const { auditSuperAdminAction } = await import("@/lib/super-admin/audit");

  if (input.repairId === "cron_stale") {
    return applyLowRiskRepair({ repairId: input.repairId, actorId: input.actorId });
  }

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "ai_operations.repair.manual_ack",
    resourceType: "platform",
    metadata: { repairId: input.repairId, diff: catalog.diff },
  });

  return {
    ok: true,
    message: "Repair steps logged. Apply the exported patch manually — no files were modified automatically.",
    incident: {
      issue: catalog.problem,
      aiSolution: catalog.suggestedFix,
      repairTimeMs: Date.now() - start,
      status: "completed",
      rollbackAvailable: true,
    },
  };
}

export function exportPatchText(patch: RepairPatch): string {
  return [
    `# ROVEXO AI Operations Patch`,
    `# ${patch.title}`,
    `# Created: ${patch.createdAt}`,
    "",
    patch.description,
    "",
    "```diff",
    patch.diff,
    "```",
  ].join("\n");
}

export function isLowRiskRepair(repairId: string): boolean {
  return Boolean(REPAIR_CATALOG[repairId]?.lowRisk);
}
