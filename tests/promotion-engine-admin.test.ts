import { describe, expect, it } from "vitest";
import {
  ADMIN_DURATION_OPTIONS,
  PROMOTION_SOURCES,
  PROMOTION_SOURCE_LABELS,
  toCanonicalStatus,
  toDbStatus,
  resolveAdminDurationDays,
} from "@/lib/promotions/canonical-engine";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("promotion engine canonical", () => {
  it("defines admin duration options including unlimited and custom", () => {
    const ids = ADMIN_DURATION_OPTIONS.map((option) => option.id);
    expect(ids).toContain("1d");
    expect(ids).toContain("365d");
    expect(ids).toContain("unlimited");
    expect(ids).toContain("custom");
  });

  it("maps database statuses to canonical labels", () => {
    expect(toCanonicalStatus("pending")).toBe("draft");
    expect(toCanonicalStatus("suspended")).toBe("paused");
    expect(toCanonicalStatus("active")).toBe("active");
    expect(toDbStatus("paused")).toBe("paused");
  });

  it("resolves custom duration days", () => {
    expect(resolveAdminDurationDays("7d")).toBe(7);
    expect(resolveAdminDurationDays("custom", 45)).toBe(45);
    expect(resolveAdminDurationDays("custom")).toBeNull();
  });

  it("defines all promotion sources with labels", () => {
    for (const source of PROMOTION_SOURCES) {
      expect(PROMOTION_SOURCE_LABELS[source]).toBeTruthy();
    }
  });
});

describe("promotion engine admin surface", () => {
  it("exposes super admin user promotions route", () => {
    const page = readFileSync(
      join(process.cwd(), "app/super-admin/promotion-management/page.tsx"),
      "utf8",
    );
    expect(page).toContain("UserPromotionsAdmin");
    expect(page).toContain("ADMIN_DURATION_OPTIONS");
  });

  it("wires global promotion realtime refresher in app shell", () => {
    const shell = readFileSync(
      join(process.cwd(), "components/layout/AppShellLayout.tsx"),
      "utf8",
    );
    expect(shell).toContain("PromotionRealtimeRefresher");
  });

  it("subscribes to promotion tables via supabase realtime", () => {
    const realtime = readFileSync(join(process.cwd(), "lib/promotions/realtime.ts"), "utf8");
    const revalidate = readFileSync(
      join(process.cwd(), "lib/promotions/revalidate-surfaces.ts"),
      "utf8",
    );
    expect(realtime).toContain("listing_promotions");
    expect(realtime).toContain("seller_promotions");
    expect(realtime).toContain("postgres_changes");
    expect(revalidate).toContain("revalidatePath");
  });

  it("requires super admin for promotion management actions API", () => {
    const route = readFileSync(
      join(process.cwd(), "app/api/super-admin/promotion-management/actions/route.ts"),
      "utf8",
    );
    expect(route).toContain("requireApiSuperAdmin");
  });
});
