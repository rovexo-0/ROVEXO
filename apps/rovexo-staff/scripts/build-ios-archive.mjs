import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const distDir = join(root, "dist", "ios");
mkdirSync(distDir, { recursive: true });

spawnSync("npx", ["cap", "sync", "ios"], { cwd: root, shell: true, stdio: "inherit" });

const xcodebuild = spawnSync(
  "xcodebuild",
  ["-workspace", "App/App.xcworkspace", "-scheme", "App", "-configuration", "Release", "archive", "-archivePath", join(distDir, "ROVEXOStaff.xcarchive")],
  { cwd: join(root, "ios"), stdio: "inherit" },
);

const artifact = join(distDir, "ROVEXOStaff.xcarchive");
const report = {
  platform: "ios",
  format: "xcarchive",
  generatedAt: new Date().toISOString(),
  success: xcodebuild.status === 0 && existsSync(artifact),
  artifact: existsSync(artifact) ? artifact : null,
  note: xcodebuild.status === 0 ? "iOS archive created." : "xcodebuild failed — requires macOS with Xcode.",
};

writeFileSync(join(distDir, "build-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.success ? 0 : 1);
