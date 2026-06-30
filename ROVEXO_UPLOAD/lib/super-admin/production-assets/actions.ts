import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import {
  formatValidationReport,
  validateProductionAssets,
} from "@/lib/super-admin/production-assets/validator";
import type { ProductionAssetActionResult } from "@/lib/super-admin/production-assets/types";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();

async function runNodeScript(scriptRelativePath: string): Promise<{ ok: boolean; output: string }> {
  const scriptPath = path.join(ROOT, scriptRelativePath);
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, [scriptPath], {
      cwd: ROOT,
      maxBuffer: 10 * 1024 * 1024,
      env: process.env,
    });
    return { ok: true, output: [stdout, stderr].filter(Boolean).join("\n").trim() };
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    const output = [execError.stdout, execError.stderr, execError.message].filter(Boolean).join("\n").trim();
    return { ok: false, output };
  }
}

export async function runProductionAssetValidation(): Promise<ProductionAssetActionResult> {
  const report = await validateProductionAssets();
  return {
    ok: report.deploymentReady,
    message: report.deploymentReady
      ? "Premium assets verified. Production deployment allowed."
      : "Placeholder assets detected. Production deployment blocked.",
    output: formatValidationReport(report),
    report,
  };
}

/** Regenerates AVIF/WebP/PNG derivatives from approved photography source masters only. */
export async function rebuildProductionAssets(): Promise<ProductionAssetActionResult> {
  const result = await runNodeScript("scripts/generate-production-from-sources.mjs");
  if (!result.ok) {
    return {
      ok: false,
      message: "Asset rebuild failed. Approved source masters were not modified.",
      output: result.output,
    };
  }

  const validation = await runProductionAssetValidation();
  return {
    ok: validation.ok,
    message: validation.ok
      ? "Assets rebuilt from approved photography masters and validation passed."
      : "Assets rebuilt but validation still reports issues.",
    output: [result.output, validation.output].filter(Boolean).join("\n\n"),
    report: validation.report,
  };
}

/** Confirms deployment readiness — never deletes or overwrites approved assets. */
export async function confirmDeploymentReadiness(): Promise<ProductionAssetActionResult> {
  const validation = await runProductionAssetValidation();
  if (!validation.ok) {
    return validation;
  }

  return {
    ok: true,
    message:
      "All homepage, category, and hero assets verified. Safe to deploy approved production assets.",
    output: validation.output,
    report: validation.report,
  };
}
