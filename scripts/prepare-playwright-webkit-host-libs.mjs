#!/usr/bin/env node
/**
 * ROVEXO — Playwright WebKit host-lib prepare (environment only).
 *
 * WSL/Ubuntu often lacks system packages required by Playwright MiniBrowser.
 * sudo/`playwright install-deps` may be unavailable — this script downloads the
 * exact packages listed by minibrowser-wpe/install-dependencies.sh into
 * .local-webkit-libs and injects .so + soname symlinks into MiniBrowser sys/lib.
 *
 * Does NOT modify application / UI / business logic.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { webkit } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKDIR = path.join(ROOT, ".local-webkit-libs");
const DEBS = path.join(WORKDIR, "debs");
const EXTRACT = path.join(WORKDIR, "extract");

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    encoding: "utf8",
    cwd: opts.cwd ?? ROOT,
    env: process.env,
    shell: process.platform === "win32",
  });
}

function resolveMiniBrowserRoot() {
  const executablePath = webkit.executablePath();
  const webkitRoot = path.dirname(executablePath);
  const mb = path.join(webkitRoot, "minibrowser-wpe");
  if (!fs.existsSync(path.join(mb, "bin", "MiniBrowser"))) {
    throw new Error(`MiniBrowser not found under ${mb}`);
  }
  return mb;
}

function readRequiredPackages(mbRoot) {
  const script = path.join(mbRoot, "install-dependencies.sh");
  const result = run("bash", [script, "--printonly"]);
  const out = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const match = out.match(/Need to install the following extra packages:\s*(.+)/);
  if (!match) return [];
  return match[1]
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function downloadAndExtract(packages) {
  if (packages.length === 0) return;
  fs.mkdirSync(DEBS, { recursive: true });
  fs.mkdirSync(EXTRACT, { recursive: true });
  console.log(`[webkit-libs] Downloading ${packages.length} package(s) via apt-get download…`);
  const dl = run("apt-get", ["download", ...packages], { cwd: DEBS });
  if ((dl.status ?? 1) !== 0) {
    throw new Error(`apt-get download failed:\n${dl.stderr ?? dl.stdout}`);
  }
  for (const deb of fs.readdirSync(DEBS).filter((f) => f.endsWith(".deb"))) {
    const x = run("dpkg-deb", ["-x", path.join(DEBS, deb), EXTRACT]);
    if ((x.status ?? 1) !== 0) {
      throw new Error(`dpkg-deb -x failed for ${deb}`);
    }
  }
}

function injectIntoSysLib(mbRoot) {
  const sysLib = path.join(mbRoot, "sys", "lib");
  fs.mkdirSync(sysLib, { recursive: true });
  if (!fs.existsSync(EXTRACT)) {
    throw new Error(`Extract dir missing: ${EXTRACT}`);
  }

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.so(\.|$)/.test(entry.name)) continue;
      const dest = path.join(sysLib, entry.name);
      fs.rmSync(dest, { force: true });
      if (entry.isSymbolicLink()) {
        fs.symlinkSync(fs.readlinkSync(full), dest);
      } else {
        fs.copyFileSync(full, dest);
      }
    }
  };
  walk(EXTRACT);

  for (const name of fs.readdirSync(sysLib)) {
    const m = name.match(/^(.*\.so\.\d+)\.\d+\.\d+$/);
    if (!m) continue;
    const sonamePath = path.join(sysLib, m[1]);
    if (!fs.existsSync(sonamePath)) {
      fs.symlinkSync(name, sonamePath);
    }
  }

  console.log(`[webkit-libs] Injected shared libs into ${sysLib}`);
}

function lddMissing(mbRoot) {
  const bin = path.join(mbRoot, "bin", "MiniBrowser");
  const lib = path.join(mbRoot, "lib");
  const sysLib = path.join(mbRoot, "sys", "lib");
  const result = run("bash", [
    "-lc",
    `LD_LIBRARY_PATH=${JSON.stringify(`${lib}:${sysLib}`)} ldd ${JSON.stringify(bin)} 2>/dev/null || true`,
  ]);
  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return [...text.matchAll(/^\s*(\S+)\s*=>\s*not found/gm)].map((m) => m[1]);
}

export async function preparePlaywrightWebkitHostLibs() {
  const mbRoot = resolveMiniBrowserRoot();
  const packages = readRequiredPackages(mbRoot);
  const hasExtract = fs.existsSync(EXTRACT) && fs.readdirSync(EXTRACT).length > 0;

  if (!hasExtract && packages.length > 0) {
    downloadAndExtract(packages);
  } else if (hasExtract) {
    console.log("[webkit-libs] Reusing cached .local-webkit-libs/extract");
  } else {
    console.log("[webkit-libs] No missing packages reported by install-dependencies.sh");
  }

  if (fs.existsSync(EXTRACT) && fs.readdirSync(EXTRACT).length > 0) {
    injectIntoSysLib(mbRoot);
  }

  const missing = lddMissing(mbRoot);
  return { ok: missing.length === 0, missing, packages, mbRoot };
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  preparePlaywrightWebkitHostLibs()
    .then((result) => {
      console.log("[webkit-libs]", result.ok ? "READY" : "INCOMPLETE", {
        missing: result.missing,
        packages: result.packages.length,
      });
      process.exit(result.ok ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
