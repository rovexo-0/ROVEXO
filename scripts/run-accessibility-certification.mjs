#!/usr/bin/env node
/**
 * ROVEXO Accessibility Certification Engine v1.0 — runner.
 * Prefer healthy http://localhost:3000 (Owner order) — do not restart Next if already 200.
 * NO commit · NO push · NO Preview · NO Production.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { preparePlaywrightChromium, readVercelChromiumConfig } from "./install-playwright-chromium.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EVIDENCE_DIR = path.join(ROOT, "test-results/accessibility-certification-v1");
const MATRIX_JSON = path.join(EVIDENCE_DIR, "matrix.json");
const MATRIX_MD = path.join(EVIDENCE_DIR, "MATRIX.md");
const OFFICIAL_HOST = "http://127.0.0.1:3000";

function ensureEnv() {
  const ensure = spawnSync("node", ["scripts/ensure-e2e-env.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if ((ensure.status ?? 1) !== 0) process.exit(ensure.status ?? 1);
}

function probeOfficialHost() {
  const probe = spawnSync(
    "curl",
    ["-s", "-o", "/dev/null", "-w", "%{http_code}", `${OFFICIAL_HOST}/api/health/live`],
    { encoding: "utf8", timeout: 8_000 },
  );
  return (probe.stdout || "").trim();
}

async function prepareBrowsers() {
  const prepared = await preparePlaywrightChromium();
  const marker = readVercelChromiumConfig();
  const health = probeOfficialHost();
  const reuseOfficial = health === "200";
  if (reuseOfficial) {
    console.log(`[accessibility] Reusing healthy host ${OFFICIAL_HOST} (health 200).`);
  } else {
    console.log(
      `[accessibility] Official host health=${health || "unreachable"} — Playwright managed :13025.`,
    );
  }
  const env = {
    ...process.env,
    ...prepared,
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS: "1",
    ...(reuseOfficial
      ? {
          PLAYWRIGHT_SKIP_WEBSERVER: "1",
          PLAYWRIGHT_ALLOW_REMOTE: "1",
          PLAYWRIGHT_PORT: "3000",
        }
      : {
          PLAYWRIGHT_SKIP_WEBSERVER: process.env.PLAYWRIGHT_SKIP_WEBSERVER ?? "0",
        }),
  };
  if (marker?.executablePath) {
    env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = marker.executablePath;
    env.LD_LIBRARY_PATH = marker.ldLibraryPath;
  }
  return env;
}

function runPlaywright(env) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const workers = process.env.A11Y_WORKERS?.trim() || "1";
  const args = [
    "playwright",
    "test",
    "e2e/accessibility-certification.spec.ts",
    "--project=a11y-chromium-iphone",
    `--workers=${workers}`,
    "--reporter=list",
  ];
  console.log(`[accessibility] Running WCAG 2.2 AA certification · workers=${workers}…`);
  const result = spawnSync("npx", args, {
    cwd: ROOT,
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });
  return result.status ?? 1;
}

function finalize(exitCode) {
  if (!fs.existsSync(MATRIX_JSON)) {
    console.error("[accessibility] Missing matrix.json — certification did not write evidence.");
    return 1;
  }
  const snapshot = JSON.parse(fs.readFileSync(MATRIX_JSON, "utf8"));
  const overall = snapshot.overall;
  console.log("");
  console.log(`Overall: ${overall}`);
  console.log(`WCAG:    ${snapshot.wcagTarget}`);
  console.log(`Matrix:  ${MATRIX_MD}`);
  console.log(`JSON:    ${MATRIX_JSON}`);
  console.log(`Keyboard: ${snapshot.keyboard} · Focus: ${snapshot.focus} · Motion: ${snapshot.reducedMotion}`);
  console.log("");
  for (const page of snapshot.pages || []) {
    console.log(`  [${page.result}] ${page.label}`);
  }
  console.log("");
  if (overall === "PASS" && exitCode === 0) {
    console.log("ACCESSIBILITY CERTIFICATION = PASS (WCAG 2.2 AA runtime evidence).");
    return 0;
  }
  console.log("ACCESSIBILITY CERTIFICATION = FAIL — Preview Release FORBIDDEN.");
  if ((snapshot.defects || []).length) {
    console.log("Defects:");
    for (const d of snapshot.defects.slice(0, 40)) console.log(`  - ${d}`);
  }
  return 1;
}

async function main() {
  console.log("==========================================================");
  console.log("ROVEXO ACCESSIBILITY CERTIFICATION ENGINE v1.0");
  console.log("OWNER LOCK · WCAG 2.2 AA · ENTIRE PLATFORM");
  console.log("==========================================================");
  ensureEnv();
  const env = await prepareBrowsers();
  const exitCode = runPlaywright(env);
  process.exit(finalize(exitCode));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
