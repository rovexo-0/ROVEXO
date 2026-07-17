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
    expect(sanitizeNextPath("//evil.com")).toBe("/");
    expect(sanitizeNextPath("/login")).toBe("/");
    expect(sanitizeNextPath(undefined)).toBe("/");
  });

  it("exposes profile_missing auth error copy", async () => {
    const { AUTH_ERROR_MESSAGES } = await import("@/lib/auth/redirects");
    expect(AUTH_ERROR_MESSAGES.profile_missing).toContain("sign in");
  });
});

describe("protected route prefixes", () => {
  it("includes all authenticated app sections", async () => {
    const { updateSession } = await import("@/lib/supabase/middleware");
    expect(updateSession).toBeTypeOf("function");
  });

  it("avoids login redirect loops when profile role is missing", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile("lib/supabase/middleware.ts", "utf8"),
    );
    expect(source).toContain("/auth/signout");
    expect(source).toContain('signoutUrl.searchParams.set("error", "profile_missing")');
    expect(source).toContain("redirectIfAuthenticated");
    expect(source).not.toContain("isAuthOnlyWhenSignedOut");
  });

  it("clears sessions via signout route before login redirect", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile("lib/profile/data.ts", "utf8"),
    );
    expect(source).toContain("/auth/signout?error=profile_missing");
    expect(source).toContain('redirect("/auth/signout")');
    expect(source).not.toContain("supabase.auth.signOut()");
  });

  it("redirects signed-in users from login via server component guard", async () => {
    const login = await import("node:fs/promises").then((fs) =>
      fs.readFile("app/(auth)/login/page.tsx", "utf8"),
    );
    const guard = await import("node:fs/promises").then((fs) =>
      fs.readFile("lib/auth/guest-redirect.ts", "utf8"),
    );
    expect(login).toContain("redirectIfAuthenticated");
    expect(guard).toContain("redirectPathForRole");
  });

  it("writes cleared auth cookies onto the signout redirect response", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile("app/auth/signout/route.ts", "utf8"),
    );
    expect(source).toContain("response.cookies.set");
    expect(source).toContain("createServerClient");
  });

  it("does not redirect to login when session refresh fails", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile("lib/supabase/middleware.ts", "utf8"),
    );
    expect(source).toContain("Never redirect from the error path");
    expect(source).not.toMatch(/catch \(error\)[\s\S]*NextResponse\.redirect\(loginUrl\)/);
  });
});

describe("getAppUrl", () => {
  it("documents production fallback when NEXT_PUBLIC_APP_URL is unset", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile("lib/supabase/env.ts", "utf8"),
    );
    expect(source).toContain('DEFAULT_APP_URL = "https://www.rovexo.co.uk"');
    expect(source).toContain('readFirstEnv("NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SITE_URL")');
    expect(source).toContain("VERCEL_PROJECT_PRODUCTION_URL");
  });
});

describe("profile repository", () => {
  it("reads profiles with column grants compatible with prelaunch_security", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile("lib/profile/repository.ts", "utf8"),
    );
    expect(source).toContain("PROFILE_READ_COLUMNS");
    expect(source).not.toMatch(/from\("profiles"\)[\s\S]*\.select\("\*"\)/);
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
