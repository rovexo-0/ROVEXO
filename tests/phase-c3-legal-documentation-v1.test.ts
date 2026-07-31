import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CANONICAL_LEGAL_DOCUMENTS,
  getLegalDocument,
  LEGAL_DOCUMENT_SLUGS,
  listLegalDocuments,
} from "@/lib/legal/canonical-documents";
import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal/document-shared";
import {
  PHASE_C3_LEGAL_DOCUMENTATION_V1,
  PHASE_C3_LEGAL_LAST_UPDATED,
  PHASE_C3_LEGAL_SLUGS,
  PHASE_C3_REQUIRED_STRUCTURE_MARKERS,
} from "@/lib/legal/phase-c3-legal-documentation-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Phase C.3 — Legal Documentation Rewrite Lock", () => {
  it("locks the effective date to 30 July 2026", () => {
    expect(PHASE_C3_LEGAL_LAST_UPDATED).toBe("30 July 2026");
    expect(LEGAL_EFFECTIVE_DATE).toBe("30 July 2026");
    expect(readSource("lib/legal/document-shared.ts")).toContain(
      'export const LEGAL_EFFECTIVE_DATE = "30 July 2026";',
    );
  });

  it("keeps the canonical legal document slug set (Phase C.3 + Legal Centre Consolidation)", () => {
    expect(LEGAL_DOCUMENT_SLUGS).toHaveLength(PHASE_C3_LEGAL_SLUGS.length);
    expect(CANONICAL_LEGAL_DOCUMENTS).toHaveLength(PHASE_C3_LEGAL_SLUGS.length);
    expect(PHASE_C3_LEGAL_SLUGS).toHaveLength(25);
    expect(PHASE_C3_LEGAL_DOCUMENTATION_V1.slugCount).toBe(25);

    for (const slug of PHASE_C3_LEGAL_SLUGS) {
      expect(LEGAL_DOCUMENT_SLUGS).toContain(slug);
      expect(getLegalDocument(slug)).toBeTruthy();
    }

    // No additions, no removals — the sets must match exactly.
    expect([...LEGAL_DOCUMENT_SLUGS].sort()).toEqual([...PHASE_C3_LEGAL_SLUGS].sort());

    // The withdrawn Business Seller Terms slug must never resurface.
    expect(getLegalDocument("business-seller-terms")).toBeNull();
    expect(LEGAL_DOCUMENT_SLUGS).not.toContain("business-seller-terms");
  });

  it("every document follows the Phase C.3 professional structure", () => {
    const documents = listLegalDocuments();
    expect(documents).toHaveLength(PHASE_C3_LEGAL_SLUGS.length);

    for (const document of documents) {
      expect(document.content, `${document.slug} missing "What"`).toContain("What");
      expect(document.content, `${document.slug} missing "How"`).toContain("How");
      expect(document.content, `${document.slug} missing "Related"`).toContain("Related");
      expect(
        document.content.includes("30 July 2026") || document.content.includes(LEGAL_EFFECTIVE_DATE),
        `${document.slug} missing effective date reference`,
      ).toBe(true);

      // At least one numbered chapter heading.
      expect(document.content).toMatch(/^## \d+\.\s/m);
      // A dedicated Common questions chapter and Related Documents chapter.
      expect(document.content).toMatch(/Common questions/);
      expect(document.content).toMatch(/## \d+\.\s+Related Documents/);
    }
  });

  it("uses the required structure markers across the document set", () => {
    const haystack = listLegalDocuments()
      .map((doc) => doc.content)
      .join("\n");

    for (const marker of PHASE_C3_REQUIRED_STRUCTURE_MARKERS) {
      expect(haystack, `missing required marker: ${marker}`).toContain(marker);
    }

    // Full subsection vocabulary present somewhere across the doc set.
    expect(haystack).toContain("**What:**");
    expect(haystack).toContain("**Why:**");
    expect(haystack).toContain("**When:**");
    expect(haystack).toContain("**How:**");
    expect(haystack).toContain("**Example:**");
    expect(haystack).toContain("**Notes:**");
    expect(haystack).toContain("**Important:**");
  });

  it("keeps Phase C.1 Personal Account terminology and forbids Business Account language", () => {
    const haystack = listLegalDocuments()
      .map((doc) => `${doc.title}\n${doc.summary}\n${doc.content}`)
      .join("\n");

    expect(haystack).toContain("Personal Account");
    expect(haystack).toContain("Wallet");
    expect(haystack).toContain("Balance");
    expect(haystack).toContain("Holiday Mode");

    expect(haystack).not.toMatch(/Business Account/i);
    expect(haystack).not.toMatch(/Business Dashboard/i);
    expect(haystack).not.toContain("Become Seller");
    expect(haystack).not.toContain("Following feed");
  });

  it("preserves the LEGAL_OPERATOR_BLOCK usage at the top of operator-facing documents", () => {
    const source = readSource("lib/legal/canonical-documents.ts");
    expect(source).toContain("${LEGAL_OPERATOR_BLOCK}");

    const terms = getLegalDocument("terms-and-conditions");
    const privacy = getLegalDocument("privacy-policy");
    const cookies = getLegalDocument("cookie-policy");

    expect(terms?.content.startsWith("# Terms & Conditions")).toBe(true);
    expect(privacy?.content.startsWith("# Privacy Policy")).toBe(true);
    expect(cookies?.content.startsWith("# Cookie Policy")).toBe(true);

    expect(terms?.content).toContain("**Platform operator:**");
    expect(privacy?.content).toContain("**Platform operator:**");
    expect(cookies?.content).toContain("**Platform operator:**");
  });

  it("links Related Documents chapters to real /legal/{slug} paths and platform surfaces", () => {
    const documents = listLegalDocuments();
    const validTargets = new Set([
      ...PHASE_C3_LEGAL_SLUGS.map((slug) => `/legal/${slug}`),
      "/account/settings",
      "/legal",
      "/help",
      "/help/category/safety",
      "/help/category/seller",
      "/help/category/reports",
      "/help/category/buyer",
      "/support",
      "/security",
    ]);

    for (const document of documents) {
      const relatedSection = document.content.split(/## \d+\.\s+Related Documents/)[1];
      expect(relatedSection, `${document.slug} has no Related Documents section body`).toBeTruthy();

      const links = [...(relatedSection ?? "").matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
      expect(links.length, `${document.slug} Related Documents has no links`).toBeGreaterThan(0);

      for (const link of links) {
        expect(validTargets.has(link), `${document.slug} links to unexpected target: ${link}`).toBe(true);
      }

      // A document must never link to itself.
      expect(links).not.toContain(`/legal/${document.slug}`);
    }
  });

  it("keeps the withdrawn Business Seller Terms redirect and never reintroduces the product", () => {
    expect(readSource("next.config.ts")).toContain("/legal/business-seller-terms");
    expect(readSource("next.config.ts")).toContain("/legal/seller-terms");
    expect(readSource("lib/legal/canonical-documents.ts")).not.toContain("Business Seller Terms");
  });
});
