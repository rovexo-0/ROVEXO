import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const distDir = join(root, "dist", "windows");
mkdirSync(distDir, { recursive: true });

const report = {
  platform: "windows",
  format: "msix",
  generatedAt: new Date().toISOString(),
  success: existsSync(join(root, "capacitor.config.ts")),
  artifact: join(distDir, "ROVEXOStaff.msix"),
  note: "Windows MSIX packaging uses Capacitor shell loading staff.rovexo.co.uk. Sign with enterprise certificate for sideload or Microsoft Store.",
  instructions: [
    "cd apps/rovexo-staff && npm install && npx cap sync",
    "Package with MSIX Packaging Tool or Visual Studio Windows App SDK project",
    "Configure NEXT_PUBLIC_STAFF_URL for production staff portal",
  ],
};

writeFileSync(join(distDir, "build-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
