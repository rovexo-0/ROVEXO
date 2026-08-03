#!/usr/bin/env node
/**
 * ROVEXO Realtime Engine Certification v1.0 — runner.
 * Prefer healthy http://localhost:3000 — do not restart Next if already 200.
 * NO commit · NO push · NO Preview · NO Production.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { preparePlaywrightChromium, readVercelChromiumConfig } from "./install-playwright-chromium.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EVIDENCE_DIR = path.join(ROOT, "test-results/realtime-certification-v1");
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
    console.log(`[realtime] Reusing healthy host ${OFFICIAL_HOST} (health 200).`);
  } else {
    console.log(
      `[realtime] Official host health=${health || "unreachable"} — Playwright managed webserver.`,
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
  const workers = process.env.REALTIME_WORKERS?.trim() || "1";
  const args = [
    "playwright",
    "test",
    "e2e/realtime-certification.spec.ts",
    "--project=realtime-chromium",
    `--workers=${workers}`,
    "--reporter=list",
  ];
  console.log(`[realtime] Running Realtime Engine Certification · workers=${workers}…`);
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
    console.error("[realtime] Missing matrix.json — certification did not write evidence.");
    return 1;
  }
  const snapshot = JSON.parse(fs.readFileSync(MATRIX_JSON, "utf8"));
  const overall = snapshot.overall;
  console.log("");
  console.log(`Overall: ${overall}`);
  console.log(`Message latency: ${snapshot.performance?.messageLatencyMs ?? "n/a"}ms`);
  console.log(`Badge latency: ${snapshot.performance?.badgeLatencyMs ?? "n/a"}ms`);
  if (fs.existsSync(MATRIX_MD)) {
    console.log(`Evidence: ${MATRIX_MD}`);
  }
  console.log("");
  console.log(
    overall === "PASS"
      ? "REALTIME CERTIFICATION = PASS"
      : "REALTIME CERTIFICATION = FAIL",
  );
  return overall === "PASS" ? 0 : exitCode || 1;
}

ensureEnv();
const env = await prepareBrowsers();
const code = runPlaywright(env);
process.exit(finalize(code));
