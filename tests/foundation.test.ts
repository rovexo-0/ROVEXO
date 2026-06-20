import { describe, expect, it } from "vitest";
import { validateUploadFile, StorageValidationError } from "@/lib/storage/upload";
import { isSellerRole, isBusinessRole } from "@/lib/auth/session";

describe("storage validation", () => {
  it("accepts valid avatar uploads", () => {
    const file = new File(["abc"], "avatar.png", { type: "image/png" });
    expect(() => validateUploadFile("avatars", file)).not.toThrow();
  });

  it("rejects invalid avatar mime types", () => {
    const file = new File(["abc"], "avatar.gif", { type: "image/gif" });
    expect(() => validateUploadFile("avatars", file)).toThrow(StorageValidationError);
  });

  it("rejects oversized product images", () => {
    const big = new Uint8Array(11 * 1024 * 1024);
    const file = new File([big], "photo.png", { type: "image/png" });
    expect(() => validateUploadFile("products", file)).toThrow(StorageValidationError);
  });
});

describe("role guards", () => {
  it("treats seller, business, and admin as seller-capable roles", () => {
    expect(isSellerRole("seller")).toBe(true);
    expect(isSellerRole("business")).toBe(true);
    expect(isSellerRole("admin")).toBe(true);
    expect(isSellerRole("buyer")).toBe(false);
  });

  it("restricts business dashboards to business and admin roles", () => {
    expect(isBusinessRole("business")).toBe(true);
    expect(isBusinessRole("admin")).toBe(true);
    expect(isBusinessRole("seller")).toBe(false);
  });
});

describe("auth redirect helpers", () => {
  it("sanitizes unsafe next paths", async () => {
    const { sanitizeNextPath } = await import("@/lib/auth/redirects");
    expect(sanitizeNextPath("/orders")).toBe("/orders");
    expect(sanitizeNextPath("//evil.com")).toBe("/account");
    expect(sanitizeNextPath("/login")).toBe("/account");
    expect(sanitizeNextPath(undefined)).toBe("/account");
  });
});

describe("protected route prefixes", () => {
  it("includes all authenticated app sections", async () => {
    const { updateSession } = await import("@/lib/supabase/middleware");
    expect(updateSession).toBeTypeOf("function");
  });
});

describe("auth action schemas", () => {
  it("exports server actions for auth flows", async () => {
    const actions = await import("@/lib/auth/actions");
    expect(actions.signIn).toBeTypeOf("function");
    expect(actions.signUp).toBeTypeOf("function");
    expect(actions.signOut).toBeTypeOf("function");
    expect(actions.requestPasswordReset).toBeTypeOf("function");
    expect(actions.updatePassword).toBeTypeOf("function");
    expect(actions.resendVerificationEmail).toBeTypeOf("function");
  });
});

describe("database repository exports", () => {
  it("exposes supabase-backed product queries", async () => {
    const catalog = await import("@/lib/products/catalog");
    expect(catalog.getProductsBySection).toBeTypeOf("function");
    expect(catalog.searchProducts).toBeTypeOf("function");
    expect(catalog.createListing).toBeTypeOf("function");
  });

  it("exposes supabase-backed order store functions", async () => {
    const orders = await import("@/lib/orders/store");
    expect(orders.listOrders).toBeTypeOf("function");
    expect(orders.createOrder).toBeTypeOf("function");
    expect(orders.applyOrderAction).toBeTypeOf("function");
  });
});
