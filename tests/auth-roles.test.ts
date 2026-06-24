import { describe, expect, it } from "vitest";
import { isAdmin, isAuthenticated, isSeller, isSuperAdmin } from "@/lib/auth/roles";

describe("auth role helpers", () => {
  it("detects authentication", () => {
    expect(isAuthenticated("user-id")).toBe(true);
    expect(isAuthenticated(null)).toBe(false);
  });

  it("detects seller-capable roles", () => {
    expect(isSeller("seller")).toBe(true);
    expect(isSeller("business")).toBe(true);
    expect(isSeller("super_admin")).toBe(true);
    expect(isSeller("buyer")).toBe(false);
  });

  it("detects platform admin roles", () => {
    expect(isAdmin("admin")).toBe(true);
    expect(isAdmin("super_admin")).toBe(true);
    expect(isAdmin("seller")).toBe(false);
  });

  it("detects super admin only", () => {
    expect(isSuperAdmin("super_admin")).toBe(true);
    expect(isSuperAdmin("admin")).toBe(false);
  });
});
