import { describe, expect, it } from "vitest";
import {
  isPlatformAdminRole,
  isSellerRole,
  isSuperAdminRole,
} from "@/lib/auth/session";

describe("super admin roles", () => {
  it("recognises the super admin role", () => {
    expect(isSuperAdminRole("super_admin")).toBe(true);
    expect(isSuperAdminRole("admin")).toBe(false);
  });

  it("treats super admin as platform admin and seller-capable", () => {
    expect(isPlatformAdminRole("super_admin")).toBe(true);
    expect(isSellerRole("super_admin")).toBe(true);
  });
});
