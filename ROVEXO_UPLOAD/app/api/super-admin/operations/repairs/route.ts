import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  applyConfirmedRepair,
  applyLowRiskRepair,
  exportPatchText,
  generateRepairPatch,
  issuesFromScan,
} from "@/lib/super-admin/operations/repairs";
import {
  appendIncident,
  getAiOperationsSnapshot,
  storePatch,
} from "@/lib/super-admin/operations/snapshot";

const bodySchema = z.object({
  action: z.enum(["generate", "apply", "rollback", "export"]),
  issueId: z.string(),
  repairId: z.string().optional(),
  confirmed: z.boolean().optional(),
  patchId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = bodySchema.parse(await request.json());
    const snapshot = await getAiOperationsSnapshot();
    const issue = snapshot.issues.find((item) => item.id === body.issueId);

    if (!issue) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    if (body.action === "generate") {
      const patch = generateRepairPatch(issue);
      if (!patch) {
        return NextResponse.json({ error: "No automated patch available for this issue." }, { status: 400 });
      }
      await storePatch(patch, auth.user.id);
      return NextResponse.json({ patch, exportText: exportPatchText(patch) });
    }

    if (body.action === "export") {
      const patch = snapshot.patches.find((item) => item.id === body.patchId);
      if (!patch) {
        return NextResponse.json({ error: "Patch not found." }, { status: 404 });
      }
      return NextResponse.json({ exportText: exportPatchText(patch) });
    }

    if (body.action === "apply") {
      if (!body.confirmed) {
        return NextResponse.json({ error: "Explicit confirmation required." }, { status: 400 });
      }
      const repairId = body.repairId ?? issue.repairId;
      if (!repairId) {
        return NextResponse.json({ error: "No repair handler for this issue." }, { status: 400 });
      }

      const settings = snapshot.settings;
      const result =
        settings.autoRepairEnabled && repairId
          ? await applyLowRiskRepair({ repairId, actorId: auth.user.id })
          : await applyConfirmedRepair({
              repairId,
              actorId: auth.user.id,
              confirmed: true,
            });

      if (result.incident) {
        await appendIncident(auth.user.id, {
          issue: result.incident.issue,
          aiSolution: result.incident.aiSolution,
          repairTimeMs: result.incident.repairTimeMs,
          status: result.incident.status,
          rollbackAvailable: result.incident.rollbackAvailable,
        });
      }

      return NextResponse.json(result);
    }

    if (body.action === "rollback") {
      await appendIncident(auth.user.id, {
        issue: issue.problem,
        aiSolution: "Manual rollback acknowledged — no automatic file changes were made.",
        repairTimeMs: 0,
        status: "rolled_back",
        rollbackAvailable: false,
      });
      return NextResponse.json({ ok: true, message: "Rollback recorded. Restore configuration manually if needed." });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Repair action failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const snapshot = await getAiOperationsSnapshot();
  return NextResponse.json({ issues: issuesFromScan(snapshot.scanResults) });
}
