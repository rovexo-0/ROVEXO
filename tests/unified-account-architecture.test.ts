import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";

import { join } from "node:path";

import {

  ROVEXO_ACCOUNT_KIND,

  resolveAccountCapabilities,

  resolveRovexoAccountKind,

} from "@/lib/profile/unified-account";



describe("ROVEXO unified account architecture v1.0", () => {

  it("uses a single marketplace account kind", () => {

    expect(resolveRovexoAccountKind("buyer")).toBe(ROVEXO_ACCOUNT_KIND);

    expect(resolveRovexoAccountKind("seller")).toBe(ROVEXO_ACCOUNT_KIND);

    expect(resolveRovexoAccountKind("business")).toBe(ROVEXO_ACCOUNT_KIND);

    expect(resolveRovexoAccountKind("super_admin")).toBe("super_admin");

  });



  it("allows every account to buy and sell immediately", () => {

    const fresh = resolveAccountCapabilities({

      role: "buyer",

      verified: false,

      hasSellerProfile: false,

      hasBusinessAccount: false,

    });

    expect(fresh.canSell).toBe(true);

    expect(fresh.canWithdrawFunds).toBe(true);

    expect(fresh.canReceivePayments).toBe(true);

    expect(fresh.hasSellingActivity).toBe(false);

  });



  it("expands store and selling activity from listings", () => {

    const active = resolveAccountCapabilities({

      role: "buyer",

      verified: false,

      hasSellerProfile: true,

      hasBusinessAccount: false,

      listingCount: 1,

      username: "mihai-shop",

    });

    expect(active.hasSellingActivity).toBe(true);

    expect(active.hasStore).toBe(true);

  });



  it("allows business verification as a capability flag", () => {

    const verified = resolveAccountCapabilities({

      role: "buyer",

      verified: true,

      hasSellerProfile: true,

      hasBusinessAccount: true,

    });

    expect(verified.hasBusinessVerification).toBe(true);

    expect(verified.canVerifyBusiness).toBe(false);

  });



  it("registers with email and password only", () => {

    const fields = readFileSync(

      join(process.cwd(), "features/auth/components/RegisterScreen.tsx"),

      "utf8",

    );

    expect(fields).not.toContain("Account type");

    expect(fields).not.toContain('name="role"');

    expect(fields).not.toContain('name="username"');

    expect(fields).toContain('name="email"');

    expect(fields).toContain('name="password"');

    expect(fields).toContain('name="fullName"');

    expect(fields).not.toContain('name="firstName"');

    expect(fields).not.toContain('name="lastName"');

  });



  it("does not assign signup roles from registration metadata", () => {

    const migration = readFileSync(

      join(

        process.cwd(),

        "supabase/migrations/20260708143000_unified_account_architecture_v1.sql",

      ),

      "utf8",

    );

    expect(migration).toContain("values (new.id, v_username, v_full_name, new.email, 'buyer')");

    expect(migration).not.toContain("seller_profiles");

    expect(migration).not.toContain("business_accounts");

  });



  it("builds the canonical My Account Sprint 1 menu", () => {
    const menu = readFileSync(join(process.cwd(), "lib/account-center/canonical-menu.ts"), "utf8");
    expect(menu).toContain("buildAccountMenuSections");
    expect(menu).toContain('title: "My Listings"');
    expect(menu).toContain('title: "Inbox"');
    expect(menu).toContain('title: "Settings"');
    expect(menu).toContain('title: "Log Out"');
    expect(menu).not.toContain('title: "Verification"');
    expect(menu).not.toContain("Become Seller");
    expect(menu).not.toContain("buildSellingSubmenu(profile)");
  });

});

