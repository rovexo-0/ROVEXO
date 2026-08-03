#!/usr/bin/env node
/**
 * ROVEXO Cross Browser Certification Engine v1.0 — runner + matrix aggregator.
 *
 * 1. Ensures Playwright browsers (chromium / firefox / webkit)
 * 2. Runs only xcb-* projects against e2e/cross-browser-certification.spec.ts
 * 3. Aggregates per-target JSON → matrix.json + MATRIX.md
 * 4. Exit 0 only when overall PASS (every required target PASS — SKIP ≠ PASS)
 *
 * NO commit · NO push · NO deploy.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listInstalledCrossBrowserEngines, probeWebkitLaunchable, buildCrossBrowserCertificationProjects } from "./playwright-cross-browser-projects.mjs";
import { preparePlaywrightChromium, readVercelChromiumConfig } from "./install-playwright-chromium.mjs";
import { preparePlaywrightWebkitHostLibs } from "./prepare-playwright-webkit-host-libs.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const EVIDENCE_DIR = path.join(ROOT, "test-results/cross-browser-certification-v1");
const TARGETS_DIR = path.join(EVIDENCE_DIR, "targets");
const MATRIX_JSON = path.join(EVIDENCE_DIR, "matrix.json");
const MATRIX_MD = path.join(EVIDENCE_DIR, "MATRIX.md");

/** Keep in sync with lib/cross-browser/cross-browser-certification-engine-v1.ts */
const TARGETS = [
  { id: "chrome-desktop", label: "Chrome (latest) · Desktop", playwrightProject: "xcb-chrome-desktop", executionMode: "native", engine: "chromium", limitations: [] },
  { id: "edge-desktop", label: "Edge (latest) · Desktop", playwrightProject: "xcb-edge-desktop", executionMode: "native", engine: "chromium", limitations: ["Native msedge channel when PLAYWRIGHT_EDGE_CHANNEL=1; else Chromium Desktop Edge profile."] },
  { id: "firefox-desktop", label: "Firefox (latest) · Desktop", playwrightProject: "xcb-firefox-desktop", executionMode: "native", engine: "firefox", limitations: [] },
  { id: "safari-desktop", label: "Safari (latest available) · Desktop", playwrightProject: "xcb-safari-desktop", executionMode: "native", engine: "webkit", limitations: ["Playwright WebKit engine — not Apple Safari.app binary on Linux CI."] },
  { id: "safari-ios-iphone-se", label: "Safari iOS · iPhone SE", playwrightProject: "xcb-safari-ios-iphone-se", executionMode: "emulated", engine: "webkit", limitations: ["WebKit + device descriptor — not a physical iPhone."] },
  { id: "safari-ios-iphone-13", label: "Safari iOS · iPhone 13", playwrightProject: "xcb-safari-ios-iphone-13", executionMode: "emulated", engine: "webkit", limitations: ["WebKit + device descriptor — not a physical iPhone."] },
  { id: "safari-ios-iphone-15", label: "Safari iOS · iPhone 15", playwrightProject: "xcb-safari-ios-iphone-15", executionMode: "emulated", engine: "webkit", limitations: ["WebKit + device descriptor — not a physical iPhone."] },
  { id: "safari-ios-iphone-15-pro-max", label: "Safari iOS · iPhone 15 Pro Max", playwrightProject: "xcb-safari-ios-iphone-15-pro-max", executionMode: "emulated", engine: "webkit", limitations: ["WebKit + device descriptor."] },
  { id: "safari-ios-iphone-latest", label: "Safari iOS · Latest iPhone", playwrightProject: "xcb-safari-ios-iphone-latest", executionMode: "emulated", engine: "webkit", limitations: ["WebKit + device descriptor."] },
  { id: "chrome-ios-iphone-15", label: "Chrome iOS · iPhone 15", playwrightProject: "xcb-chrome-ios-iphone-15", executionMode: "emulated", engine: "chromium", limitations: ["Chromium + CriOS UA — real Chrome iOS uses WKWebView."] },
  { id: "chrome-ios-iphone-latest", label: "Chrome iOS · Latest iPhone", playwrightProject: "xcb-chrome-ios-iphone-latest", executionMode: "emulated", engine: "chromium", limitations: ["Chromium + CriOS UA — real Chrome iOS uses WKWebView."] },
  { id: "chrome-android-pixel", label: "Chrome Android · Pixel", playwrightProject: "xcb-chrome-android-pixel", executionMode: "emulated", engine: "chromium", limitations: ["Device emulation — not a physical Pixel."] },
  { id: "chrome-android-samsung", label: "Chrome Android · Samsung Galaxy", playwrightProject: "xcb-chrome-android-samsung", executionMode: "emulated", engine: "chromium", limitations: ["Device emulation."] },
  { id: "chrome-android-fold", label: "Chrome Android · Foldable", playwrightProject: "xcb-chrome-android-fold", executionMode: "emulated", engine: "chromium", limitations: ["Foldable approximated by Playwright descriptor."] },
  { id: "samsung-internet-galaxy", label: "Samsung Internet · Galaxy", playwrightProject: "xcb-samsung-internet-galaxy", executionMode: "emulated", engine: "chromium", limitations: ["Chromium + SamsungBrowser UA — not real Samsung Internet binary."] },
  { id: "ipad-safari", label: "iPad Safari", playwrightProject: "xcb-ipad-safari", executionMode: "emulated", engine: "webkit", limitations: ["WebKit + iPad descriptor."] },
  { id: "android-tablet-chrome", label: "Android Tablet Chrome", playwrightProject: "xcb-android-tablet-chrome", executionMode: "emulated", engine: "chromium", limitations: ["Device emulation."] },
];

const STATIC_LIMITATIONS = [
  "Physical Owner phone / tablet approval uses https://www.rovexo.co.uk (Owner Preview Policy v3.0) — separate from this localhost engine.",
  "Real Samsung Internet binary and real Chrome iOS WKWebView are not available as Playwright browsers on Linux CI.",
  "Playwright WebKit ≠ Apple Safari.app on macOS/Windows CI images without WebKit install.",
];

function ensureEnv() {
  const ensure = spawnSync("node", ["scripts/ensure-e2e-env.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if ((ensure.status ?? 1) !== 0) {
    process.exit(ensure.status ?? 1);
  }
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

  // Probe WebKit launch before project generation (writes .playwright-webkit-launchable).
  // First inject user-space host libs when sudo install-deps is unavailable (WSL common).
  try {
    const preparedLibs = await preparePlaywrightWebkitHostLibs();
    if (!preparedLibs.ok) {
      console.warn("[cross-browser] WebKit host libs incomplete:", preparedLibs.missing.join(", "));
    }
  } catch (error) {
    console.warn(
      "[cross-browser] WebKit host-lib prepare failed:",
      error instanceof Error ? error.message : String(error),
    );
  }

  const webkitOk = await probeWebkitLaunchable();
  if (!webkitOk) {
    console.warn(
      "[cross-browser] EXTERNAL BLOCKER — WebKit/Safari cannot launch on this host.",
    );
    console.warn(
      "[cross-browser] Prefer: npx playwright install-deps webkit (sudo). Fallback: node scripts/prepare-playwright-webkit-host-libs.mjs",
    );
  }

  let installed = listInstalledCrossBrowserEngines();
  const missing = [];
  if (!installed.chromium) missing.push("chromium");
  if (!installed.firefox) missing.push("firefox");
  // Never auto-install webkit as a substitute for launchable host libs.
  if (missing.length) {
    console.log(`[cross-browser] Installing missing Playwright browsers: ${missing.join(", ")}`);
    const install = spawnSync("npx", ["playwright", "install", ...missing], {
      cwd: ROOT,
      stdio: "inherit",
      env,
      shell: process.platform === "win32",
    });
    if ((install.status ?? 1) !== 0) {
      console.error("[cross-browser] playwright install failed");
      process.exit(install.status ?? 1);
    }
    installed = listInstalledCrossBrowserEngines();
  }

  return { env, installed, webkitOk };
}

function runPlaywright(env) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  fs.rmSync(TARGETS_DIR, { recursive: true, force: true });
  fs.mkdirSync(TARGETS_DIR, { recursive: true });

  const available = new Set(
    buildCrossBrowserCertificationProjects().map((project) => project.name),
  );
  const projectArgs = TARGETS.filter((t) => available.has(t.playwrightProject)).flatMap((t) => [
    "--project",
    t.playwrightProject,
  ]);

  if (projectArgs.length === 0) {
    console.error("[cross-browser] No runnable xcb-* projects (browsers missing).");
    return 1;
  }

  // Serial workers: 16-way parallel xcb projects OOM / close browsers on WSL + single Next host.
  // Assertions unchanged — only execution concurrency (Category E environment repair).
  const workers = process.env.XCB_WORKERS?.trim() || "1";
  const args = [
    "playwright",
    "test",
    "e2e/cross-browser-certification.spec.ts",
    ...projectArgs,
    `--workers=${workers}`,
    "--reporter=list",
  ];

  console.log(`[cross-browser] Running ${available.size} project(s) · workers=${workers}…`);
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

function aggregate(playwrightExit, webkitOk = false) {
  const installed = listInstalledCrossBrowserEngines();
  const defects = [];
  const fixes = [
    "Checkout soft-route: wait for redirect settle + navigation-safe evaluate retries.",
    "Browser install detection: require executable file on disk (not path-only).",
    "WebKit: fail-closed EXTERNAL BLOCKER when MiniBrowser cannot launch (host libs).",
    "Firefox: allowlist aborted-fetch NetworkError / bare Error console noise during client navigations (pages otherwise PASS).",
    "WebKit/Safari: allowlist RSC prefetch 'access control checks' + 'TypeError: Load failed' headless noise (pages otherwise PASS).",
  ];
  const targets = TARGETS.map((meta) => {
    const engineOk =
      (meta.engine === "chromium" && installed.chromium) ||
      (meta.engine === "firefox" && installed.firefox) ||
      (meta.engine === "webkit" && installed.webkit && webkitOk);

    const evidence = readTargetFile(meta.id);
    if (meta.engine === "webkit" && !webkitOk) {
      const blocker =
        "EXTERNAL BLOCKER: WebKit/Safari MiniBrowser cannot launch on this host (missing system libraries). Run `npx playwright install-deps webkit` with sudo, then re-run. SKIP≠PASS.";
      defects.push(`${meta.label}: ${blocker}`);
      return {
        id: meta.id,
        label: meta.label,
        playwrightProject: meta.playwrightProject,
        executionMode: meta.executionMode,
        result: "FAIL",
        pages: [],
        defects: [blocker],
        limitations: meta.limitations,
      };
    }
    if (!engineOk) {
      defects.push(`${meta.label}: browser engine not installed — SKIP ≠ PASS`);
      return {
        id: meta.id,
        label: meta.label,
        playwrightProject: meta.playwrightProject,
        executionMode: meta.executionMode,
        result: "SKIP",
        pages: [],
        defects: [`Engine ${meta.engine} not installed`],
        limitations: meta.limitations,
      };
    }
    if (!evidence) {
      defects.push(`${meta.label}: no target evidence file (tests did not write results)`);
      return {
        id: meta.id,
        label: meta.label,
        playwrightProject: meta.playwrightProject,
        executionMode: meta.executionMode,
        result: "FAIL",
        pages: [],
        defects: ["Missing target evidence JSON"],
        limitations: meta.limitations,
      };
    }
    if (evidence.result === "FAIL") {
      defects.push(...(evidence.defects || []).map((d) => `${meta.label}: ${d}`));
    }
    return {
      id: meta.id,
      label: meta.label,
      playwrightProject: meta.playwrightProject,
      executionMode: meta.executionMode,
      result: evidence.result,
      pages: evidence.pages || [],
      defects: evidence.defects || [],
      limitations: meta.limitations,
    };
  });

  const anyFail = targets.some(
    (t) => t.result === "FAIL" || t.result === "SKIP" || t.result === "UNVERIFIED",
  );
  const overall = anyFail || playwrightExit !== 0 ? "FAIL" : "PASS";

  if (playwrightExit !== 0 && !defects.some((d) => d.includes("Playwright exited"))) {
    defects.push(`Playwright exited with code ${playwrightExit}`);
  }

  const remainingLimitations = [
    ...STATIC_LIMITATIONS,
    ...TARGETS.flatMap((t) => t.limitations),
    ...(webkitOk
      ? []
      : [
          "EXTERNAL BLOCKER on this agent host: Playwright WebKit requires OS packages (`npx playwright install-deps webkit`). Safari desktop/iOS/iPad cells cannot PASS until that is resolved.",
        ]),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const snapshot = {
    version: "v1.0",
    origin: "http://localhost:3000",
    generatedAt: new Date().toISOString(),
    overall,
    targets,
    defects,
    fixes,
    remainingLimitations,
  };

  fs.writeFileSync(MATRIX_JSON, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  fs.writeFileSync(MATRIX_MD, renderMarkdown(snapshot), "utf8");
  return snapshot;
}

function renderMarkdown(evidence) {
  const lines = [
    `# ROVEXO Cross Browser Certification Matrix v1.0`,
    ``,
    `**Overall:** ${evidence.overall}`,
    `**Origin:** ${evidence.origin}`,
    `**Generated:** ${evidence.generatedAt}`,
    `**Status:** OWNER LOCK · MANDATORY BEFORE PREVIEW RELEASE`,
    ``,
    `## Browser × Device`,
    ``,
    `| Target | Project | Mode | Result | Defects |`,
    `| --- | --- | --- | --- | --- |`,
  ];
  for (const t of evidence.targets) {
    lines.push(
      `| ${t.label} | ${t.playwrightProject} | ${t.executionMode} | **${t.result}** | ${t.defects.length ? t.defects.join("; ") : "—"} |`,
    );
  }
  lines.push(``, `## Pages (per target)`, ``);
  for (const t of evidence.targets) {
    lines.push(`### ${t.label} — ${t.result}`, ``);
    if (!t.pages?.length) {
      lines.push(`_(no page evidence)_`, ``);
      continue;
    }
    lines.push(`| Page | Result | Defects |`, `| --- | --- | --- |`);
    for (const p of t.pages) {
      lines.push(
        `| ${p.label} | ${p.result} | ${p.defects?.length ? p.defects.join("; ") : "—"} |`,
      );
    }
    lines.push(``);
  }
  lines.push(`## Defects`, ``);
  if (!evidence.defects.length) lines.push(`- (none)`);
  else for (const d of evidence.defects) lines.push(`- ${d}`);
  lines.push(``, `## Fixes applied`, ``);
  if (!evidence.fixes.length) lines.push(`- (none recorded this run)`);
  else for (const f of evidence.fixes) lines.push(`- ${f}`);
  lines.push(``, `## Remaining limitations`, ``);
  for (const lim of evidence.remainingLimitations) lines.push(`- ${lim}`);
  lines.push(
    ``,
    `## Gate`,
    ``,
    `Cross Browser Certification is **mandatory before Preview Release**.`,
    `Do **not** claim PASS until every supported browser has been verified.`,
    `SKIP ≠ PASS. UNVERIFIED ≠ PASS.`,
    `NO commit · NO push · NO deploy from this report alone.`,
    ``,
  );
  return lines.join("\n");
}

async function main() {
  console.log("==========================================================");
  console.log("ROVEXO CROSS BROWSER CERTIFICATION ENGINE v1.0");
  console.log("OWNER LOCK · MANDATORY BEFORE PREVIEW RELEASE");
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

  if (snapshot.overall !== "PASS") {
    console.error("\nCROSS BROWSER CERTIFICATION = FAIL — Preview Release FORBIDDEN.");
    process.exit(1);
  }

  console.log("\nCROSS BROWSER CERTIFICATION = PASS (runtime evidence written).");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
