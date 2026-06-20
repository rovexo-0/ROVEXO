#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const steps = [
  { name: "ESLint", command: "pnpm exec eslint . --quiet" },
  { name: "TypeScript", command: "pnpm typecheck" },
  { name: "Tests", command: "pnpm test" },
  { name: "Production build", command: "pnpm build" },
  { name: "Environment", command: "node scripts/verify-env.mjs" },
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
