import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO Ideas v2.1", () => {
  it("exposes a private suggestion form in My Account", () => {
    const page = readSource("features/account-module/components/RovexoIdeasPage.tsx");
    const route = readSource("app/account/ideas/page.tsx");
    const menu = readSource("lib/account-center/canonical-menu.ts");

    expect(route).toContain("RovexoIdeasPage");
    expect(page).toContain('data-rovexo-ideas-version="v2.0-lock"');
    expect(page).toContain("Submit Idea");
    expect(page).toContain("New Idea");
    expect(page).not.toContain("vote");
    expect(menu).toContain('title: "Ideas"');
    expect(menu).toContain("/account/ideas");
  });

  it("stores suggestions with admin review statuses", () => {
    const migration = readSource("supabase/migrations/20260708160000_rovexo_ideas_v2_1.sql");
    const types = readSource("lib/rovexo-ideas/types.ts");

    expect(migration).toContain("rovexo_ideas");
    expect(migration).toContain("under_review");
    expect(migration).toContain("in_development");
    expect(types).toContain("implemented");
    expect(types).toContain("closed");
  });

  it("provides a super-admin ROVEXO Ideas module", () => {
    const admin = readSource("features/super-admin/rovexo-ideas/RovexoIdeasAdmin.tsx");
    const nav = readSource("lib/super-admin/nav.ts");

    expect(admin).toContain("ROVEXO Ideas");
    expect(admin).toContain("Search suggestions");
    expect(nav).toContain("/super-admin/rovexo-ideas");
  });
});
