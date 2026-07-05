import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runStaffEnterpriseCertification } from "@/lib/staff-enterprise/certification";
import { STAFF_ENTERPRISE_PLATFORMS, STAFF_ROLE_MODULE_ACCESS } from "@/lib/staff-enterprise/constants";
import { roleIdsGrantModule } from "@/lib/staff-enterprise/permissions";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Staff Enterprise Platform", () => {
  it("defines supported platforms including web staff.rovexo.co.uk", () => {
    expect(STAFF_ENTERPRISE_PLATFORMS.map((p) => p.id)).toEqual(["android", "ios", "windows", "web"]);
    expect(STAFF_ENTERPRISE_PLATFORMS.find((p) => p.id === "web")?.distribution).toContain("staff.rovexo.co.uk");
  });

  it("maps staff roles to dashboard modules via RBAC baseline", () => {
    expect(roleIdsGrantModule(["finance"], "wallet")).toBe(true);
    expect(roleIdsGrantModule(["support"], "infrastructure")).toBe(false);
    expect(STAFF_ROLE_MODULE_ACCESS.super_admin?.length).toBeGreaterThan(10);
  });

  it("extends staff-profile SSOT without duplicate user tables", () => {
    const migration = readSource("supabase/migrations/20250725000001_staff_enterprise_platform.sql");
    expect(migration).toContain("alter table public.staff_profiles");
    expect(migration).not.toContain("create table if not exists public.users");
    expect(readSource("lib/staff-enterprise/permissions.ts")).toContain("loadStaffRoleIds");
  });

  it("ships staff portal, API, and enterprise descriptor", () => {
    expect(readSource("app/staff/page.tsx")).toContain("StaffEnterpriseShell");
    expect(readSource("app/api/staff-enterprise/route.ts")).toContain("requireApiStaff");
    expect(readSource("lib/staff-enterprise/descriptor.ts")).toContain("staff-enterprise");
    expect(readSource("lib/enterprise-architecture/registry.ts")).toContain("STAFF_ENTERPRISE_MODULE_DESCRIPTOR");
  });

  it("passes staff enterprise certification", () => {
    const report = runStaffEnterpriseCertification();
    expect(report.milestone).toBe("ROVEXO STAFF ENTERPRISE PLATFORM");
    expect(report.score).toBeGreaterThanOrEqual(90);
  });
});
