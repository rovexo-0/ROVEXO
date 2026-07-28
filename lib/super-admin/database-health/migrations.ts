import { readdirSync } from "node:fs";
import { workspacePath } from "@/lib/server/workspace-path";
import { join } from "node:path";

export function listLocalMigrationFiles(cwd = workspacePath()): string[] {
  const dir = join(cwd, "supabase", "migrations");
  try {
    return readdirSync(dir)
      .filter((name) => name.endsWith(".sql"))
      .sort();
  } catch {
    return [];
  }
}

export function buildMigrationRecords(filenames: string[]) {
  return filenames.map((filename) => ({
    id: filename.replace(/\.sql$/, ""),
    filename,
    applied: null as boolean | null,
  }));
}
