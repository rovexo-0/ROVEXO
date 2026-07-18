import { describe, expect, it } from "vitest";
import {
  addressInputSchema,
  passwordChangeSchema,
  profileUpdateSchema,
  usernameSchema,
} from "@/lib/account/schemas";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { applySessionPersistence } from "@/lib/auth/session-cookies";
import { detectSelfOffer } from "@/lib/trust/anti-fraud";

describe("account validation schemas", () => {
  it("validates profile updates", () => {
    const parsed = profileUpdateSchema.safeParse({
      fullName: "Jane Smith",
      username: "jane_smith",
      phone: "+353 1 234 5678",
      bio: "Collector in Dublin.",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid usernames", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("Bad-Name").success).toBe(false);
    expect(usernameSchema.safeParse("good_name").success).toBe(true);
  });

  it("validates address input with country postcode rules", () => {
    const parsed = addressInputSchema.safeParse({
      recipientName: "Jane Smith",
      addressLine: "12 Main Street",
      city: "Dublin",
      postcode: "D02 X285",
      country: "Ireland",
      addressType: "shipping",
      isDefault: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("requires matching passwords for password change", () => {
    const parsed = passwordChangeSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "new-password",
      confirmPassword: "different",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("auth error mapping", () => {
  it("maps common Supabase auth errors to friendly copy", () => {
    expect(mapAuthErrorMessage("Invalid login credentials")).toBe("Incorrect email or password.");
    expect(mapAuthErrorMessage("Email not confirmed")).toContain("verify your email");
  });
});

describe("remember me session cookies", () => {
  it("exports session persistence helper", () => {
    expect(applySessionPersistence).toBeTypeOf("function");
  });
});

describe("account security guards", () => {
  it("blocks self offers", async () => {
    const result = await detectSelfOffer({ buyerId: "user-1", sellerId: "user-1" });
    expect(result.blocked).toBe(true);
    expect(result.reason).toBe("self_offer");
  });

  it("allows offers between different users", async () => {
    const result = await detectSelfOffer({ buyerId: "buyer", sellerId: "seller" });
    expect(result.blocked).toBe(false);
  });
});

describe("account access routes", () => {
  it("exports delete account API route", async () => {
    const route = await import("@/app/api/account/delete/route");
    expect(route.POST).toBeTypeOf("function");
  });

  it("exports auth server actions for account flows", async () => {
    const actions = await import("@/lib/auth/actions");
    expect(actions.signIn).toBeTypeOf("function");
    expect(actions.signUp).toBeTypeOf("function");
    expect(actions.signOut).toBeTypeOf("function");
  });

  it("keeps unverified business users inside Business Verification", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile("lib/profile/data.ts", "utf8"),
    );
    expect(source).toContain("BUSINESS_VERIFICATION_ROUTE");
    expect(source).not.toContain('redirect("/account")');
    expect(source).not.toContain('throw new Error("Business account required")');
  });

  it("persists bio via seller profile upsert", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile("lib/profile/service.ts", "utf8"),
    );
    expect(source).toContain("seller_profiles");
    expect(source).toContain("upsert");
  });
});
