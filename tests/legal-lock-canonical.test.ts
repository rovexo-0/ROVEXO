import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LEGAL_DOCUMENT_SLUGS,
  getLegalDocument,
  listLegalDocuments,
} from "@/lib/legal/canonical-documents";
import { summarizeUkComplianceAudit, UK_COMPLIANCE_AUDIT } from "@/lib/compliance/uk-audit";
import { buildAnnualStatements } from "@/lib/wallet/monthly-statements";
import type { MonthlyStatement } from "@/lib/wallet/monthly-statements";
import { AUTH_MASTER_SPEC } from "@/lib/auth/master-spec";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("UI Lock + Legal Lock + Compliance Lock SSOT", () => {
  it("locks premium auth markers", () => {
    const login = readSource("features/auth/components/LoginScreen.tsx");
    const register = readSource("features/auth/components/RegisterScreen.tsx");
    const form = readSource("features/auth/components/AuthForm.tsx");

    expect(login).toContain("AUTH_MASTER_SPEC.login");
    expect(AUTH_MASTER_SPEC.login.copy.title).toBe("Welcome back 👋");
    expect(login).toContain('data-auth-version="canonical-freeze-v1"');
    expect(login).not.toContain("Welcome Back");
    expect(login).not.toContain("Good to see you again");
    expect(register).toContain("AUTH_MASTER_SPEC.register");
    expect(AUTH_MASTER_SPEC.register.copy.title).toBe("Join ROVEXO today 🚀");
    expect(register).toContain('data-auth-version="canonical-freeze-v1"');
    expect(register).not.toContain("Join ROVEXO Today");
    expect(register).toContain("SECURE REGISTRATION");
    expect(form).toContain('data-auth-version="v1.0-legal-lock"');
    expect(readSource("components/branding/RovexoBrandLogo.tsx")).toContain("canonical");
    expect(readSource("components/branding/RovexoBrandLogo.tsx")).toContain(
      "OFFICIAL_BRAND_PRIMARY_EMBLEM",
    );
  });

  it("exposes all canonical legal documents from scratch SSOT", () => {
    expect(LEGAL_DOCUMENT_SLUGS).toHaveLength(22);
    expect(getLegalDocument("terms-and-conditions")?.title).toBe("Terms & Conditions");
    expect(getLegalDocument("cookie-policy")?.title).toBe("Cookie Policy");
    expect(getLegalDocument("wallet-terms")).toBeTruthy();
    expect(getLegalDocument("payment-terms")).toBeTruthy();
    expect(getLegalDocument("delivery-policy")).toBeTruthy();
    expect(getLegalDocument("verification-policy")?.title).toBe("Verification Policy");
    expect(getLegalDocument("intellectual-property-policy")?.title).toContain("Notice and Takedown");
    expect(listLegalDocuments().every((doc) => doc.content.length > 200)).toBe(true);
    expect(readSource("app/terms/page.tsx")).toContain("/legal/terms-and-conditions");
    expect(readSource("app/privacy/page.tsx")).toContain("/legal/privacy-policy");
    expect(readSource("app/cookies/page.tsx")).toContain("/legal/cookie-policy");
    expect(readSource("app/verification-policy/page.tsx")).toContain("/legal/verification-policy");
    expect(readSource("app/trust-center/page.tsx")).toContain('redirect("/trust")');
  });

  it("locks help centre category buttons for account entry", () => {
    const help = readSource("features/help/components/HelpCentreCanonicalSection.tsx");
    const categories = readSource("lib/help/help-centre-categories.ts");
    expect(help).toContain('data-help-centre-version="v1.0-legal-lock"');
    expect(categories).toContain('"Payments & Wallet"');
    expect(categories).toContain('"Orders"');
    expect(categories).toContain('"Safety"');
    expect(readSource("lib/account-center/canonical-menu.ts")).not.toContain("Contact Support");
  });

  it("locks wallet annual statements, PDF export, and simplified transactions list", () => {
    const txn = readSource("features/wallet/components/WalletTransactionsList.tsx");
    expect(txn).toContain('data-transactions-ui="simplified-v1.0"');
    expect(txn).toContain("CanonicalMenuRow");
    expect(txn).not.toContain("Search by title or order #");
    expect(txn).not.toContain("All types");
    expect(txn).not.toContain("All years");
    expect(txn).not.toContain("Export / Invoices");
    expect(txn).not.toContain(">Payouts<");
    expect(readSource("features/wallet/components/AnnualStatementDetail.tsx")).toContain("Download PDF");
    expect(readSource("app/wallet/statements/annual/page.tsx")).toContain("AnnualStatementsList");
  });

  it("chains annual statement balances from monthly data", () => {
    const monthly: MonthlyStatement[] = [
      {
        period: "2026-01",
        label: "January 2026",
        startBalance: 0,
        endBalance: 100,
        sales: 120,
        platformFees: 20,
        refunds: 0,
        withdrawals: 0,
        lines: [],
      },
      {
        period: "2026-02",
        label: "February 2026",
        startBalance: 100,
        endBalance: 250,
        sales: 200,
        platformFees: 50,
        refunds: 0,
        withdrawals: 0,
        lines: [],
      },
    ];

    const annual = buildAnnualStatements(monthly);
    expect(annual[0]?.startBalance).toBe(0);
    expect(annual[0]?.endBalance).toBe(250);
  });

  it("uses the frozen product seller verification surface", () => {
    const detail = readSource("features/product-detail/ProductDetailPage.tsx");
    const store = readSource("features/product-detail/ProductStoreSection.tsx");
    expect(detail).not.toContain("ProductReportDialog");
    expect(store).toContain("VerifiedBadge");
    expect(store).toContain("resolveVerifiedStatus");
  });

  it("provides UK compliance audit with no missing critical areas", () => {
    const summary = summarizeUkComplianceAudit();
    expect(UK_COMPLIANCE_AUDIT.length).toBeGreaterThanOrEqual(17);
    expect(summary.missing).toBe(0);
    expect(readSource("app/seller/compliance/page.tsx")).toContain("ComplianceDashboard");
    expect(readSource("lib/compliance/digital-platform-reporting.ts")).toContain("serializeComplianceCsv");
  });

  it("redirects duplicate seller wallet transaction route", () => {
    expect(readSource("app/seller/wallet/transactions/[id]/page.tsx")).toContain("/wallet/transactions/");
  });
});
