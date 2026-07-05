import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getCommandCenterModule,
  getCommandCenterRegistry,
  listCommandCenterModules,
} from "@/lib/super-admin/command-center";
import { buildMigrationRecords, listLocalMigrationFiles } from "@/lib/super-admin/database-health/migrations";

describe("Super Admin Command Center SSOT", () => {
  it("exposes canonical modules for dashboard, commerce, and database", () => {
    const registry = getCommandCenterRegistry();
    expect(registry.version).toBe("1.0.0");
    expect(registry.categories.length).toBeGreaterThan(8);

    const orders = getCommandCenterModule("orders-engine");
    expect(orders?.href).toBe("/super-admin/orders-engine");

    const database = getCommandCenterModule("database");
    expect(database?.href).toBe("/super-admin/database");
    expect(database?.status).toBe("live");
  });

  it("lists unique module ids", () => {
    const modules = listCommandCenterModules();
    const ids = modules.map((module) => module.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("registers database command center route and API", () => {
    expect(readFileSync(join(process.cwd(), "app/super-admin/database/page.tsx"), "utf8")).toContain(
      "DatabaseCommandCenter",
    );
    expect(readFileSync(join(process.cwd(), "app/api/super-admin/database/route.ts"), "utf8")).toContain(
      "getDatabaseHealthSnapshot",
    );
  });

  it("redirects legacy commerce pages to canonical engines", () => {
    expect(readFileSync(join(process.cwd(), "app/super-admin/orders/page.tsx"), "utf8")).toContain(
      "/super-admin/orders-engine",
    );
    expect(readFileSync(join(process.cwd(), "app/super-admin/payments/page.tsx"), "utf8")).toContain(
      "/super-admin/payments-engine",
    );
    expect(readFileSync(join(process.cwd(), "app/super-admin/listings/page.tsx"), "utf8")).toContain(
      "/super-admin/moderation",
    );
  });

  it("reads local migration files from supabase/migrations", () => {
    const files = listLocalMigrationFiles();
    expect(files.length).toBeGreaterThan(0);
    expect(files.every((name) => name.endsWith(".sql"))).toBe(true);
    expect(buildMigrationRecords(files.slice(0, 1))[0]?.filename).toBe(files[0]);
  });

  it("exposes dashboard snapshot SSOT with marketplace KPIs", () => {
    expect(readFileSync(join(process.cwd(), "lib/super-admin/command-center/dashboard-snapshot.ts"), "utf8")).toContain(
      "getCommandCenterDashboardSnapshot",
    );
    expect(readFileSync(join(process.cwd(), "app/api/super-admin/command-center/route.ts"), "utf8")).toContain(
      "getCommandCenterDashboardSnapshot",
    );
  });

  it("wires development database API to live health snapshot", () => {
    const source = readFileSync(join(process.cwd(), "app/api/super-admin/development/database/route.ts"), "utf8");
    expect(source).toContain("getDatabaseHealthSnapshot");
    expect(source).not.toContain("getDevelopmentSnapshot");
  });
});
