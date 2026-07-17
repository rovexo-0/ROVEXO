import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

/**
 * Load key/value pairs from .env.local (and optional .env) into process.env
 * without overwriting values that are already set.
 */
export function loadDotEnvFiles(cwd = process.cwd()) {
  for (const filename of [".env.local", ".env"]) {
    const filePath = path.join(cwd, filename);
    if (!fs.existsSync(filePath)) continue;

    const raw = fs.readFileSync(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;

      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Never inject Vercel CLI Sensitive redaction or placeholder secrets.
      if (
        !value ||
        value === "[SENSITIVE]" ||
        value.startsWith("[SEN") ||
        value === "placeholder" ||
        value === "re_placeholder"
      ) {
        continue;
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function commandExists(command) {
  try {
    const check = process.platform === "win32" ? `where ${command}` : `which ${command}`;
    execSync(check, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the package-manager CLI used to start the Next.js dev server.
 * Falls back to npm when pnpm/yarn are not on PATH (common on Windows).
 */
export function resolvePackageManager(cwd = process.cwd()) {
  if (fs.existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
    if (commandExists("pnpm")) return "pnpm";
    // npm runs the same package.json scripts and works on Windows without pnpm on PATH.
    return "npm";
  }

  if (fs.existsSync(path.join(cwd, "yarn.lock"))) {
    if (commandExists("yarn")) return "yarn";
    return "npm";
  }

  return "npm";
}
