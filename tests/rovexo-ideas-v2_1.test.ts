import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Ideas storage + admin (compat)", () => {
  it("stores suggestions with admin review statuses", () => {
    const migration = readSource("supabase/migrations/20260708160000_rovexo_ideas_v2_1.sql");
    const types = readSource("lib/rovexo-ideas/types.ts");

    expect(migration).toContain("rovexo_ideas");
    expect(migration).toContain("under_review");
    expect(migration).toContain("in_development");
    expect(types).toContain("implemented");
    expect(types).toContain("closed");
  });

  it("defers Profile menu + UI lock to rovexo-ideas-v1-lock.test.ts", () => {
    const lock = readSource("lib/rovexo-ideas/rovexo-ideas-v1-lock.ts");
    expect(lock).toContain("PERMANENTLY LOCKED");
    expect(lock).toContain("/account/ideas");
  });
});
