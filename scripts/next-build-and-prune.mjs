/**
 * Production build entry: next build then prune serverless NFT traces
 * before the process exits (so Vercel packages the pruned output only).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadDotEnvFiles } from "./playwright-env.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(root, "..");
const dotenvCwd = process.env.ROVEXO_DOTENV_CWD || repoRoot;

// Parent + prerender workers must see the same injected names.
// Never prints values. Does not write or copy env files.
loadDotEnvFiles(dotenvCwd);

const env = { ...process.env, ROVEXO_DOTENV_CWD: dotenvCwd };
const preload = pathToFileURL(path.join(root, "load-build-env.mjs")).href;
env.NODE_OPTIONS = [process.env.NODE_OPTIONS, `--import ${preload}`].filter(Boolean).join(" ");

const fingerprint = spawnSync("npx", ["tsx", "scripts/assert-catalog-runtime-fingerprint.ts"], {
  cwd: repoRoot,
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

if (fingerprint.status !== 0) {
  process.exit(fingerprint.status ?? 1);
}

const build = spawnSync("npx", ["next", "build"], {
  cwd: repoRoot,
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const prune = spawnSync(process.execPath, [path.join(root, "prune-serverless-traces.mjs")], {
  cwd: path.join(root, ".."),
  stdio: "inherit",
  env,
});

if (prune.status !== 0) {
  process.exit(prune.status ?? 1);
}

const ensure = spawnSync(
  process.execPath,
  [path.join(root, "ensure-startup-trace-files.mjs")],
  {
    cwd: path.join(root, ".."),
    stdio: "inherit",
    env,
  },
);

process.exit(ensure.status ?? 1);
