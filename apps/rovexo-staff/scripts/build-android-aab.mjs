import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const distDir = join(root, "dist", "android");
mkdirSync(distDir, { recursive: true });

spawnSync("npx", ["cap", "sync", "android"], { cwd: root, shell: true, stdio: "inherit" });

const gradle = spawnSync(
  process.platform === "win32" ? "gradlew.bat" : "./gradlew",
  ["bundleRelease"],
  { cwd: join(root, "android"), shell: true, stdio: "inherit" },
);

const artifact = join(root, "android", "app", "build", "outputs", "bundle", "release", "app-release.aab");
const report = {
  platform: "android",
  format: "aab",
  generatedAt: new Date().toISOString(),
  success: gradle.status === 0 && existsSync(artifact),
  artifact: existsSync(artifact) ? artifact : null,
  note: gradle.status === 0 ? "Release AAB bundled." : "Gradle bundle failed — ensure Android SDK is installed.",
};

writeFileSync(join(distDir, "build-report-aab.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.success ? 0 : 1);
