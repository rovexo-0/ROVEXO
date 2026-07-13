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
    expect(login).toContain('data-auth-version="v1.0-legal-lock"');
    expect(register).toContain("AUTH_MASTER_SPEC.register");
    expect(AUTH_MASTER_SPEC.register.copy.title).toBe("Join ROVEXO today 🚀");
    expect(form).toContain('data-auth-version="v1.0-legal-lock"');
    expect(readSource("components/branding/RovexoBrandLogo.tsx")).toContain("BUY.");
  });

  it("exposes all canonical legal documents from scratch SSOT", () => {
    expect(LEGAL_DOCUMENT_SLUGS).toHaveLength(21);
    expect(getLegalDocument("terms-and-conditions")?.title).toBe("Terms & Conditions");
    expect(getLegalDocument("cookie-policy")?.title).toBe("Cookie Policy");
    expect(getLegalDocument("wallet-terms")).toBeTruthy();
    expect(getLegalDocument("payment-terms")).toBeTruthy();
    expect(getLegalDocument("delivery-policy")).toBeTruthy();
    expect(listLegalDocuments().every((doc) => doc.content.length > 200)).toBe(true);
    expect(readSource("app/terms/page.tsx")).toContain("/legal/terms-and-conditions");
    expect(readSource("app/privacy/page.tsx")).toContain("/legal/privacy-policy");
    expect(readSource("app/cookies/page.tsx")).toContain("/legal/cookie-policy");
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

  it("locks wallet annual statements, filters, and PDF export", () => {
    const hub = readSource("features/wallet/components/WalletHubV1.tsx");
    const txn = readSource("features/wallet/components/WalletTransactionsList.tsx");
    expect(hub).toContain("Annual Statements");
    expect(txn).toContain("Search transactions");
    expect(txn).toContain("Filter by type");
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

  it("implements product safety report UI", () => {
    const detail = readSource("features/product-detail/ProductDetailPage.tsx");
    const store = readSource("features/product-detail/ProductStoreSection.tsx");
    expect(detail).toContain("ProductReportDialog");
    expect(store).toContain("SellerReportDialog");
    expect(readSource("app/api/users/report/route.ts")).toContain('targetType: "profile"');
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
