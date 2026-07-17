import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTH_MASTER_SPEC, AUTH_MASTER_SPEC_VERSION } from "@/lib/auth/master-spec";
import { AUTH_STARTUP } from "@/lib/auth/canonical";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("AUTH_MASTER_SPEC v1.0 — Welcome REMOVED", () => {
  it("removes Welcome from canonical startup", () => {
    expect(AUTH_MASTER_SPEC_VERSION).toBe("v1.0");
    expect(AUTH_STARTUP.removedRoutes).toContain("/welcome");
    expect(AUTH_STARTUP.guestEntry).toBe("/login");
    expect(AUTH_MASTER_SPEC.welcome.uiVersion).toBe("removed");
  });

  it("permanently redirects /welcome to Login", () => {
    expect(readSource("app/(auth)/welcome/page.tsx")).toContain('permanentRedirect("/login")');
  });

  it("keeps Facebook OAuth available in auth actions SSOT", () => {
    expect(readSource("lib/auth/actions.ts")).toContain('"facebook"');
  });
});
