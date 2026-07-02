import { describe, expect, it } from "vitest";
import {
  DATABASE_PERMISSION_ERROR,
  isDatabasePermissionError,
} from "@/lib/supabase/database-errors";
import { enterpriseErrorResponse, enterpriseSuccessResponse } from "@/lib/api/enterprise-response";

describe("database permission errors", () => {
  it("detects postgres permission denied messages", () => {
    expect(isDatabasePermissionError(new Error("permission denied for table platform_settings"))).toBe(true);
    expect(isDatabasePermissionError({ message: "permission denied for table platform_settings" })).toBe(true);
    expect(isDatabasePermissionError(new Error("connection timeout"))).toBe(false);
  });

  it("uses a stable API error label", () => {
    expect(DATABASE_PERMISSION_ERROR).toBe("database permission error");
  });
});

describe("operations scan API envelope", () => {
  it("returns structured JSON on database permission failure", async () => {
    const response = enterpriseErrorResponse(DATABASE_PERMISSION_ERROR, { status: 500 });
    const body = await response.json();

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(body).toEqual(
      expect.objectContaining({
        success: false,
        error: "database permission error",
      }),
    );
    expect(body.requestId).toBeTruthy();
    expect(body.timestamp).toBeTruthy();
  });

  it("returns structured JSON on scan success", async () => {
    const response = enterpriseSuccessResponse(
      { snapshot: { summary: { platformHealth: "healthy" } } },
      { status: 200 },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.snapshot.summary.platformHealth).toBe("healthy");
  });
});

describe("platform settings query audit", () => {
  it("uses service role client in settings module", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../lib/super-admin/settings.ts", import.meta.url), "utf8"),
    );
    expect(source).toContain("createServiceRoleClient");
    expect(source).not.toMatch(/from\s+"@\/lib\/supabase\/server"/);
    expect(source).not.toMatch(/createClient\(\)/);
  });

  it("handles permission denied reads with fallback", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../lib/super-admin/settings.ts", import.meta.url), "utf8"),
    );
    expect(source).toContain("isDatabasePermissionError");
    expect(source).toContain("resolvePlatformSettingFallback");
  });
});

describe("operations scan route hardening", () => {
  it("maps database permission failures to stable JSON errors", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile(new URL("../app/api/super-admin/operations/scan/route.ts", import.meta.url), "utf8"),
    );
    expect(source).toContain("DATABASE_PERMISSION_ERROR");
    expect(source).toContain("enterpriseErrorResponse");
    expect(source).toContain("requireApiSuperAdmin");
  });
});
