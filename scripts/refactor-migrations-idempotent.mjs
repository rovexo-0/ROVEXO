#!/usr/bin/env node
/**
 * Makes Supabase migration SQL files idempotent.
 * Run: node scripts/refactor-migrations-idempotent.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");

function normalizePolicyName(name) {
  return name.replace(/^"|"$/g, "");
}

function ensurePolicyDrops(sql) {
  const policyRegex =
    /create\s+policy\s+(?:"([^"]+)"|([a-zA-Z_][\w]*))\s+on\s+((?:public|storage)\.[\w.]+)/gi;

  let result = "";
  let lastIndex = 0;
  let match;

  while ((match = policyRegex.exec(sql)) !== null) {
    const [full, quoted, unquoted, table] = match;
    const name = normalizePolicyName(quoted || unquoted);
    const start = match.index;
    const before = sql.slice(Math.max(0, start - 300), start);
    const dropPattern = new RegExp(
      `drop\\s+policy\\s+if\\s+exists\\s+["']?${name}["']?\\s+on\\s+${table.replace(".", "\\.")}`,
      "i",
    );

    result += sql.slice(lastIndex, start);
    if (!dropPattern.test(before)) {
      result += `drop policy if exists "${name}" on ${table};\n`;
    }
    result += full;
    lastIndex = start + full.length;
  }

  result += sql.slice(lastIndex);
  return result;
}

function ensureTriggerDrops(sql) {
  const triggerRegex =
    /create\s+trigger\s+(?:"([^"]+)"|([a-zA-Z_][\w]*))[\s\S]*?\bon\s+((?:public|storage|auth)\.[\w.]+)/gi;

  let result = "";
  let lastIndex = 0;
  let match;

  while ((match = triggerRegex.exec(sql)) !== null) {
    const [full, quoted, unquoted, table] = match;
    const name = normalizePolicyName(quoted || unquoted);
    const start = match.index;
    const before = sql.slice(Math.max(0, start - 300), start);
    const dropPattern = new RegExp(
      `drop\\s+trigger\\s+if\\s+exists\\s+["']?${name}["']?\\s+on\\s+${table.replace(".", "\\.")}`,
      "i",
    );

    result += sql.slice(lastIndex, start);
    if (!dropPattern.test(before)) {
      result += `drop trigger if exists "${name}" on ${table};\n`;
    }
    result += full;
    lastIndex = start + full.length;
  }

  result += sql.slice(lastIndex);
  return result;
}

function ensureCreateIndexIfNotExists(sql) {
  return sql.replace(
    /create\s+unique\s+index\s+(?!if\s+not\s+exists)([\w."]+)/gi,
    "create unique index if not exists $1",
  ).replace(
    /create\s+index\s+(?!if\s+not\s+exists)([\w."]+)/gi,
    "create index if not exists $1",
  );
}

function ensureCreateTableIfNotExists(sql) {
  return sql.replace(
    /create\s+table\s+(?!if\s+not\s+exists)(public\.[\w.]+)/gi,
    "create table if not exists $1",
  );
}

function ensureAddColumnIfNotExists(sql) {
  return sql.replace(
    /alter\s+table\s+([\w.]+)\s+add\s+column\s+(?!if\s+not\s+exists)/gi,
    "alter table $1 add column if not exists ",
  );
}

function ensureCreateOrReplaceFunction(sql) {
  return sql.replace(
    /create\s+function\s+(?!or\s+replace)/gi,
    "create or replace function ",
  );
}

function ensureCreateOrReplaceView(sql) {
  return sql.replace(
    /create\s+view\s+(?!or\s+replace)/gi,
    "create or replace view ",
  );
}

function ensureCreateExtensionIfNotExists(sql) {
  return sql.replace(
    /create\s+extension\s+(?!if\s+not\s+exists)/gi,
    "create extension if not exists ",
  );
}

function wrapBareCreateTypes(sql) {
  const lines = sql.split("\n");
  const output = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim().toLowerCase();

    if (trimmed.startsWith("create type ")) {
      // Check if already inside DO block (look back)
      const recent = output.slice(-5).join("\n").toLowerCase();
      if (recent.includes("do $") || recent.includes("do $$")) {
        output.push(line);
        i += 1;
        continue;
      }

      const typeLines = [line];
      i += 1;
      while (i < lines.length && !lines[i].trim().endsWith(";")) {
        typeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        typeLines.push(lines[i]);
        i += 1;
      }

      const statement = typeLines.join("\n");
      if (statement.includes("exception when duplicate_object")) {
        output.push(...typeLines);
        continue;
      }

      output.push("do $do$ begin");
      output.push(...typeLines.map((l) => l.replace(/;\s*$/, "")));
      output.push(";");
      output.push("exception when duplicate_object then null;");
      output.push("end $do$;");
      continue;
    }

    output.push(line);
    i += 1;
  }

  return output.join("\n");
}

function refactorSql(sql) {
  let result = sql;
  result = ensureCreateExtensionIfNotExists(result);
  result = wrapBareCreateTypes(result);
  result = ensureCreateTableIfNotExists(result);
  result = ensureAddColumnIfNotExists(result);
  result = ensureCreateIndexIfNotExists(result);
  result = ensureCreateOrReplaceFunction(result);
  result = ensureCreateOrReplaceView(result);
  result = ensureTriggerDrops(result);
  result = ensurePolicyDrops(result);
  return result;
}

function hasDropStatement(sql, objectKind, name, table) {
  const normalized = sql.toLowerCase();
  const candidates = [
    `drop ${objectKind} if exists "${name.toLowerCase()}" on ${table.toLowerCase()}`,
    `drop ${objectKind} if exists ${name.toLowerCase()} on ${table.toLowerCase()}`,
  ];
  return candidates.some((candidate) => normalized.includes(candidate));
}

function validateSql(filename, sql) {
  const issues = [];

  for (const match of sql.matchAll(
    /create\s+policy\s+(?:"([^"]+)"|([a-zA-Z_][\w]*))\s+on\s+((?:public|storage)\.[\w.]+)/gi,
  )) {
    const name = normalizePolicyName(match[1] || match[2]);
    const table = match[3];
    if (!hasDropStatement(sql, "policy", name, table)) {
      issues.push(`Missing drop before policy "${name}" on ${table}`);
    }
  }

  for (const match of sql.matchAll(
    /create\s+trigger\s+(?:"([^"]+)"|([a-zA-Z_][\w]*))[\s\S]*?\bon\s+((?:public|storage|auth)\.[\w.]+)/gi,
  )) {
    const name = normalizePolicyName(match[1] || match[2]);
    const table = match[3];
    if (!hasDropStatement(sql, "trigger", name, table)) {
      issues.push(`Missing drop before trigger "${name}" on ${table}`);
    }
  }

  if (/create\s+index\s+(?!if\s+not\s+exists)/i.test(sql)) {
    issues.push("CREATE INDEX without IF NOT EXISTS");
  }
  if (/create\s+table\s+(?!if\s+not\s+exists)/i.test(sql)) {
    issues.push("CREATE TABLE without IF NOT EXISTS");
  }
  if (/alter\s+table\s+[\w.]+\s+add\s+column\s+(?!if\s+not\s+exists)/i.test(sql)) {
    issues.push("ADD COLUMN without IF NOT EXISTS");
  }
  if (/create\s+function\s+(?!or\s+replace)/i.test(sql)) {
    issues.push("CREATE FUNCTION without OR REPLACE");
  }

  return issues;
}

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let changed = 0;
const validationReport = [];

for (const file of files) {
  const path = join(MIGRATIONS_DIR, file);
  const original = readFileSync(path, "utf8");
  const refactored = refactorSql(original);

  if (refactored !== original) {
    writeFileSync(path, refactored, "utf8");
    changed += 1;
    console.log(`Updated: ${file}`);
  }

  const issues = validateSql(file, refactored);
  validationReport.push({ file, issues });
}

console.log(`\nRefactored ${changed}/${files.length} migration files.`);

const failures = validationReport.filter((r) => r.issues.length > 0);
if (failures.length) {
  console.error("\nValidation issues remaining:");
  for (const { file, issues } of failures) {
    console.error(`  ${file}:`);
    for (const issue of issues) {
      console.error(`    - ${issue}`);
    }
  }
  process.exit(1);
}

console.log("All migrations validated idempotent.");
