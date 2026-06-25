#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const steps = [
  { name: "ESLint", command: `${npmCmd} run lint` },
  { name: "TypeScript", command: `${npmCmd} run typecheck` },
  { name: "Tests", command: `${npmCmd} run test:ci` },
  { name: "Production build", command: `${npmCmd} run build` },
  { name: "Environment", command: `${npmCmd} run verify:env` },
];

const migrationDir = join(process.cwd(), "supabase/migrations");
const migrations = readdirSync(migrationDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

console.log("ROVEXO production verification\n");
console.log(`Migrations on disk (${migrations.length}):`);
for (const file of migrations) {
  console.log(`  • ${file}`);
}
console.log("");

let failed = false;

for (const step of steps) {
  process.stdout.write(`${step.name}... `);
  try {
    execSync(step.command, { stdio: "pipe" });
    console.log("PASS");
  } catch (error) {
    failed = true;
    console.log("FAIL");
    const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
    console.log(output.trim().split("\n").slice(-8).join("\n"));
  }
}

if (failed) {
  process.exit(1);
}

console.log("\nAll production verification checks passed.");
