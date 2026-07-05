import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  decryptStaffPii,
  encryptStaffPii,
  hashStaffSearchValue,
  maskIpAddress,
} from "@/lib/staff-profile/encryption";
import { parseUserAgent } from "@/lib/staff-profile/request-context";
import { STAFF_ROLE_IDS } from "@/lib/staff-profile/constants";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Staff Profile & Activity Audit", () => {
  it("defines seven canonical staff roles", () => {
    expect(STAFF_ROLE_IDS).toEqual([
      "administrator",
      "support",
      "marketplace_moderator",
      "finance",
      "shipping",
      "business",
      "content_manager",
    ]);
  });

  it("encrypts and decrypts staff PII", () => {
    const encrypted = encryptStaffPii("staff@demo.rovexo.co.uk");
    expect(encrypted).not.toContain("staff@demo.rovexo.co.uk");
    expect(decryptStaffPii(encrypted)).toBe("staff@demo.rovexo.co.uk");
  });

  it("hashes search values consistently", () => {
    expect(hashStaffSearchValue("Staff@Example.com")).toBe(hashStaffSearchValue("staff@example.com"));
  });

  it("masks IP addresses for audit display", () => {
    expect(maskIpAddress("203.0.113.45")).toBe("203.0.***.***");
  });

  it("parses browser and device from user agent", () => {
    const parsed = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    );
    expect(parsed.browser).toBe("Chrome");
    expect(parsed.operatingSystem).toBe("Windows");
    expect(parsed.device).toBe("Desktop");
  });

  it("ships super-admin staff routes and migration", () => {
    expect(readSource("app/super-admin/staff/page.tsx")).toContain("StaffProfileAdmin");
    expect(readSource("app/api/super-admin/staff/route.ts")).toContain("requireApiSuperAdmin");
    expect(readSource("supabase/migrations/20250724000001_staff_profile_activity_audit.sql")).toContain(
      "staff_activity_logs_immutable",
    );
  });

  it("restricts staff APIs to super admin and records immutable audit logs", () => {
    const service = readSource("lib/staff-profile/service.ts");
    expect(service).toContain("recordStaffActivity");
    expect(service).toContain("staff_permission_history");
    expect(service).not.toContain("MOCK_");
  });
});
