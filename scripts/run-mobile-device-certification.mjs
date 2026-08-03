#!/usr/bin/env node
/**
 * ROVEXO Mobile Device Certification Engine v1.0 — runner + matrix aggregator.
 *
 * Mobile-first · phones + tablets · 16px pad · overflow · orientation · touch · sticky
 * NO commit · NO push · NO Preview · NO Production.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { preparePlaywrightChromium, readVercelChromiumConfig } from "./install-playwright-chromium.mjs";
import { preparePlaywrightWebkitHostLibs } from "./prepare-playwright-webkit-host-libs.mjs";
import {
  buildMobileDeviceCertificationProjects,
  listInstalledMobileDeviceEngines,
} from "./playwright-mobile-device-projects.mjs";
import { probeWebkitLaunchable } from "./playwright-cross-browser-projects.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EVIDENCE_DIR = path.join(ROOT, "test-results/mobile-device-certification-v1");
const TARGETS_DIR = path.join(EVIDENCE_DIR, "targets");
const MATRIX_JSON = path.join(EVIDENCE_DIR, "matrix.json");
const MATRIX_MD = path.join(EVIDENCE_DIR, "MATRIX.md");

const TARGETS = [
  { id: "safari-ios-iphone-se", label: "Safari iOS · iPhone SE", playwrightProject: "mdc-safari-ios-iphone-se", engine: "webkit" },
  { id: "safari-ios-iphone-13", label: "Safari iOS · iPhone 13", playwrightProject: "mdc-safari-ios-iphone-13", engine: "webkit" },
  { id: "safari-ios-iphone-15", label: "Safari iOS · iPhone 15", playwrightProject: "mdc-safari-ios-iphone-15", engine: "webkit" },
  { id: "safari-ios-iphone-15-pro", label: "Safari iOS · iPhone 15 Pro", playwrightProject: "mdc-safari-ios-iphone-15-pro", engine: "webkit" },
  { id: "safari-ios-iphone-15-pro-max", label: "Safari iOS · iPhone 15 Pro Max", playwrightProject: "mdc-safari-ios-iphone-15-pro-max", engine: "webkit" },
  { id: "safari-ios-iphone-latest", label: "Safari iOS · Latest iPhone", playwrightProject: "mdc-safari-ios-iphone-latest", engine: "webkit" },
  { id: "chrome-ios-iphone-15", label: "Chrome iOS · iPhone 15", playwrightProject: "mdc-chrome-ios-iphone-15", engine: "chromium" },
  { id: "chrome-ios-iphone-latest", label: "Chrome iOS · Latest iPhone", playwrightProject: "mdc-chrome-ios-iphone-latest", engine: "chromium" },
  { id: "chrome-android-pixel", label: "Chrome Android · Pixel", playwrightProject: "mdc-chrome-android-pixel", engine: "chromium" },
  { id: "chrome-android-samsung", label: "Chrome Android · Samsung Galaxy", playwrightProject: "mdc-chrome-android-samsung", engine: "chromium" },
  { id: "chrome-android-fold", label: "Chrome Android · Foldable", playwrightProject: "mdc-chrome-android-fold", engine: "chromium" },
  { id: "samsung-internet-galaxy", label: "Samsung Internet · Galaxy", playwrightProject: "mdc-samsung-internet-galaxy", engine: "chromium" },
  { id: "ipad-safari", label: "iPad Safari", playwrightProject: "mdc-ipad-safari", engine: "webkit" },
  { id: "android-tablet-chrome", label: "Android Tablet Chrome", playwrightProject: "mdc-android-tablet-chrome", engine: "chromium" },
];

function ensureEnv() {
  const ensure = spawnSync("node", ["scripts/ensure-e2e-env.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if ((ensure.status ?? 1) !== 0) process.exit(ensure.status ?? 1);
}

async function prepareBrowsers() {
  const prepared = await preparePlaywrightChromium();
  const marker = readVercelChromiumConfig();
  const env = {
    ...process.env,
    ...prepared,
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS: "1",
  };
  if (marker?.executablePath) {
    env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = marker.executablePath;
    env.LD_LIBRARY_PATH = marker.ldLibraryPath;
  }

  try {
    await preparePlaywrightWebkitHostLibs();
  } catch (error) {
    console.warn(
      "[mobile-device] WebKit host-lib prepare failed:",
      error instanceof Error ? error.message : String(error),
    );
  }

  const webkitOk = await probeWebkitLaunchable();
  if (!webkitOk) {
    console.warn("[mobile-device] EXTERNAL BLOCKER — WebKit/Safari cannot launch on this host.");
  }

  return { env, webkitOk };
}

function runPlaywright(env) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  fs.rmSync(TARGETS_DIR, { recursive: true, force: true });
  fs.mkdirSync(TARGETS_DIR, { recursive: true });

  const available = new Set(
    buildMobileDeviceCertificationProjects().map((project) => project.name),
  );
  const projectArgs = TARGETS.filter((t) => available.has(t.playwrightProject)).flatMap((t) => [
    "--project",
    t.playwrightProject,
  ]);

  if (projectArgs.length === 0) {
    console.error("[mobile-device] No runnable mobile projects (browsers missing).");
    return 1;
  }

  const workers = process.env.MDC_WORKERS?.trim() || "1";
  const args = [
    "playwright",
    "test",
    "e2e/mobile-device-certification.spec.ts",
    ...projectArgs,
    `--workers=${workers}`,
    "--reporter=list",
  ];

  console.log(`[mobile-device] Running ${available.size} project(s) · workers=${workers}…`);
  const result = spawnSync("npx", args, {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...env,
      PLAYWRIGHT_SKIP_WEBSERVER: process.env.PLAYWRIGHT_SKIP_WEBSERVER ?? "0",
    },
    shell: process.platform === "win32",
  });
  return result.status ?? 1;
}

function readTargetFile(id) {
  const file = path.join(TARGETS_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function aggregate(playwrightExit, webkitOk) {
  const installed = listInstalledMobileDeviceEngines();
  const defects = [];
  const targets = TARGETS.map((meta) => {
    const engineOk =
      (meta.engine === "chromium" && installed.chromium) ||
      (meta.engine === "webkit" && installed.webkit && webkitOk);
    const evidence = readTargetFile(meta.id);

    if (meta.engine === "webkit" && !webkitOk) {
      const blocker =
        "EXTERNAL BLOCKER: WebKit/Safari MiniBrowser cannot launch on this host.";
      defects.push(`${meta.label}: ${blocker}`);
      return {
        id: meta.id,
        label: meta.label,
        playwrightProject: meta.playwrightProject,
        result: "FAIL",
        pages: [],
        defects: [blocker],
        limitations: [],
      };
    }
    if (!engineOk) {
      defects.push(`${meta.label}: browser engine not installed — SKIP ≠ PASS`);
      return {
        id: meta.id,
        label: meta.label,
        playwrightProject: meta.playwrightProject,
        result: "SKIP",
        pages: [],
        defects: [`Engine ${meta.engine} not installed`],
        limitations: [],
      };
    }
    if (!evidence) {
      defects.push(`${meta.label}: no target evidence file`);
      return {
        id: meta.id,
        label: meta.label,
        playwrightProject: meta.playwrightProject,
        result: "FAIL",
        pages: [],
        defects: ["Missing target evidence JSON"],
        limitations: [],
      };
    }
    if (evidence.result === "FAIL") {
      defects.push(...(evidence.defects || []).map((d) => `${meta.label}: ${d}`));
    }
    return {
      id: meta.id,
      label: meta.label,
      playwrightProject: meta.playwrightProject,
      result: evidence.result,
      pages: evidence.pages || [],
      defects: evidence.defects || [],
      limitations: evidence.limitations || [],
    };
  });

  const anyFail = targets.some(
    (t) => t.result === "FAIL" || t.result === "SKIP" || t.result === "UNVERIFIED",
  );
  const overall = anyFail || playwrightExit !== 0 ? "FAIL" : "PASS";
  if (playwrightExit !== 0 && !defects.some((d) => d.includes("Playwright exited"))) {
    defects.push(`Playwright exited with code ${playwrightExit}`);
  }

  const snapshot = {
    version: "v1.0",
    origin: "http://localhost:3000",
    generatedAt: new Date().toISOString(),
    overall,
    targets,
    defects,
    orientations: ["portrait", "landscape"],
  };

  fs.writeFileSync(MATRIX_JSON, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  fs.writeFileSync(MATRIX_MD, renderMarkdown(snapshot), "utf8");
  return snapshot;
}

function renderMarkdown(evidence) {
  const lines = [
    `# ROVEXO Mobile Device Certification Matrix v1.0`,
    ``,
    `**Overall:** ${evidence.overall}`,
    `**Origin:** ${evidence.origin}`,
    `**Generated:** ${evidence.generatedAt}`,
    `**Status:** OWNER LOCK · MOBILE-FIRST RELEASE BLOCKER`,
    ``,
    `## Devices`,
    ``,
    `| Target | Project | Result | Defects |`,
    `| --- | --- | --- | --- |`,
  ];
  for (const t of evidence.targets) {
    const defectText = (t.defects || []).length ? (t.defects || []).slice(0, 3).join("; ") : "—";
    lines.push(`| ${t.label} | ${t.playwrightProject} | **${t.result}** | ${defectText} |`);
  }
  lines.push(``, `## Defects`, ``);
  if ((evidence.defects || []).length === 0) {
    lines.push(`- None`);
  } else {
    for (const d of evidence.defects) lines.push(`- ${d}`);
  }
  lines.push(
    ``,
    `## Gate`,
    ``,
    `Mobile Device Certification is **mandatory before Preview Release**.`,
    `SKIP ≠ PASS. UNVERIFIED ≠ PASS.`,
    `NO commit · NO push · NO deploy from this report alone.`,
    ``,
  );
  return lines.join("\n");
}

async function main() {
  console.log("==========================================================");
  console.log("ROVEXO MOBILE DEVICE CERTIFICATION ENGINE v1.0");
  console.log("OWNER LOCK · MOBILE-FIRST RELEASE BLOCKER");
  console.log("==========================================================");

  ensureEnv();
  const { env, webkitOk } = await prepareBrowsers();
  const exitCode = runPlaywright(env);
  const snapshot = aggregate(exitCode, webkitOk);

  console.log("");
  console.log(`Overall: ${snapshot.overall}`);
  console.log(`Matrix:  ${MATRIX_MD}`);
  console.log(`JSON:    ${MATRIX_JSON}`);
  console.log("");
  for (const t of snapshot.targets) {
    console.log(`  [${t.result}] ${t.label}`);
  }
  console.log("");
  if (snapshot.overall === "PASS") {
    console.log("MOBILE DEVICE CERTIFICATION = PASS (runtime evidence written).");
    process.exit(0);
  }
  console.log("MOBILE DEVICE CERTIFICATION = FAIL — Preview Release FORBIDDEN.");
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
