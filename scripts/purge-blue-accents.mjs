#!/usr/bin/env node
/**
 * Replace legacy blue ROVEXO accents with purple design tokens (Module 2 fix pass).
 * Skips archive/ and node_modules/.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set(["node_modules", ".next", "archive", ".git", "ROVEXO", "ROVEXO_UPLOAD", "recovered-homepage"]);

const REPLACEMENTS = [
  ["#2563eb", "var(--ds-color-primary)"],
  ["#1d4ed8", "var(--ds-color-accent)"],
  ["#3b82f6", "#a855f7"],
  ["#1e40af", "var(--ds-color-primary-deep)"],
  ["#1e3a8a", "#3b0764"],
  ["#eff6ff", "rgb(147 51 234 / 0.08)"],
  ["rgba(37, 99, 235", "rgba(147, 51, 234"],
  ["rgb(37 99 235", "rgb(147 51 234"],
  ["rgb(29 78 216", "rgb(124 58 237"],
  ["to-blue-700", "to-purple-700"],
  ["to-blue-600", "to-purple-600"],
  ["to-blue-500", "to-purple-500"],
  ["from-blue-", "from-purple-"],
  ["bg-blue-", "bg-primary/"],
  ["text-blue-", "text-purple-"],
  ["border-blue-", "border-primary/"],
  ["ring-blue-", "ring-primary/"],
  ["from-sky-50", "from-violet-50"],
];

const EXT = new Set([".css", ".tsx", ".ts", ".jsx", ".js"]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (EXT.has(name.slice(name.lastIndexOf(".")))) files.push(full);
  }
  return files;
}

let changed = 0;
for (const file of walk(ROOT)) {
  let src = readFileSync(file, "utf8");
  let next = src;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  if (next !== src) {
    writeFileSync(file, next);
    changed += 1;
    console.log("updated", file.replace(ROOT + "\\", "").replace(ROOT + "/", ""));
  }
}
console.log(`Done. ${changed} files updated.`);
