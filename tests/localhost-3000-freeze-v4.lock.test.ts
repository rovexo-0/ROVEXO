import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isForbiddenLocalhostHost,
  isOfficialLocalhostOrigin,
  LOCALHOST_3000_FREEZE_V4,
} from "@/lib/localhost-3000-freeze-v4";
import { CURSOR_LOCAL_ORIGIN } from "@/lib/preview/owner-preview-ssot";
import { AUTH_MASTER_FREEZE_V1 } from "@/lib/auth/auth-master-freeze-v1";
import { ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1 } from "@/lib/auth/oauth-configuration-golden-law-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Absolute Law v4.0 — localhost:3000 freeze", () => {
  it("locks official host to localhost:3000", () => {
    expect(LOCALHOST_3000_FREEZE_V4.version).toBe("4.0");
    expect(LOCALHOST_3000_FREEZE_V4.permanent).toBe(true);
    expect(LOCALHOST_3000_FREEZE_V4.officialOrigin).toBe("http://localhost:3000");
    expect(LOCALHOST_3000_FREEZE_V4.productionMirror.realProductsOnly).toBe(true);
    expect(LOCALHOST_3000_FREEZE_V4.inventoryLaw.neverPadEmptyWithFakeListings).toBe(true);
    expect(Object.isFrozen(LOCALHOST_3000_FREEZE_V4)).toBe(true);
  });

  it("forbids alternate localhost ports", () => {
    expect(LOCALHOST_3000_FREEZE_V4.forbiddenPorts).toEqual([3001, 3010, 4000, 5000]);
    expect(isForbiddenLocalhostHost("localhost:3010")).toBe(true);
    expect(isForbiddenLocalhostHost("http://localhost:3001")).toBe(true);
    expect(isOfficialLocalhostOrigin("http://localhost:3000")).toBe(true);
    expect(isOfficialLocalhostOrigin("http://localhost:3010")).toBe(false);
  });

  it("aligns Cursor local + Auth OAuth local origins to :3000", () => {
    expect(CURSOR_LOCAL_ORIGIN).toBe("http://localhost:3000");
    expect(AUTH_MASTER_FREEZE_V1.allowedOrigins.localDevelopment).toBe(
      "http://localhost:3000",
    );
    expect(ROVEXO_OAUTH_CONFIGURATION_GOLDEN_LAW_V1.CALLBACKS.LOCAL).toBe(
      "http://localhost:3000/auth/callback",
    );
  });

  it("ships permanent Cursor rule", () => {
    const rule = readSource(".cursor/rules/localhost-3000-freeze-v4.mdc");
    expect(rule).toContain("localhost:3000");
    expect(rule).toContain("PERMANENT");
    expect(rule).toContain("localhost:3010");
  });
});
