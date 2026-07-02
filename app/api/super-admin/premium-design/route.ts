import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { getPremiumAssetInventory } from "@/lib/super-admin/premium-design/inventory";
import { validateProductionAssets, formatValidationReport } from "@/lib/super-admin/production-assets/validator";

export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();

const actionSchema = z.object({
  action: z.enum(["validate", "import", "rebuild"]),
});

async function runNodeScript(scriptRelativePath: string) {
  const scriptPath = path.join(ROOT, scriptRelativePath);
  const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
    cwd: ROOT,
    maxBuffer: 12 * 1024 * 1024,
    env: { ...process.env, FORCE: "1" },
  });
  return [stdout, stderr].filter(Boolean).join("\n").trim();
}

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const inventory = await getPremiumAssetInventory();
  return NextResponse.json({ inventory });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid action" }, { status: 400 });
  }

  try {
    if (parsed.data.action === "validate") {
      const report = await validateProductionAssets();
      const inventory = await getPremiumAssetInventory();
      return NextResponse.json(
        {
          ok: report.deploymentReady,
          message: report.deploymentReady
            ? "Premium design system validated."
            : "Validation failed — review issues before publish.",
          output: formatValidationReport(report),
          inventory,
        },
        { status: report.deploymentReady ? 200 : 422 },
      );
    }

    if (parsed.data.action === "import") {
      const output = [
        await runNodeScript("scripts/import-premium-photo-sources.mjs"),
        await runNodeScript("scripts/import-premium-empty-states.mjs"),
      ].join("\n\n");
      const inventory = await getPremiumAssetInventory();
      return NextResponse.json({
        ok: true,
        message: "Premium source masters imported.",
        output,
        inventory,
      });
    }

    const output = [
      await runNodeScript("scripts/generate-production-from-sources.mjs"),
      await runNodeScript("scripts/generate-empty-state-assets.mjs"),
    ].join("\n\n");
    const report = await validateProductionAssets();
    const inventory = await getPremiumAssetInventory();
    return NextResponse.json(
      {
        ok: report.deploymentReady,
        message: report.deploymentReady
          ? "Responsive premium assets rebuilt and validated."
          : "Rebuild completed with validation issues.",
        output: [output, formatValidationReport(report)].join("\n\n"),
        inventory,
      },
      { status: report.deploymentReady ? 200 : 422 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Premium design action failed.",
      },
      { status: 500 },
    );
  }
}
