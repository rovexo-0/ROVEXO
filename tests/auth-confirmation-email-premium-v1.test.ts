import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  EMAIL_VERIFICATION_UX_V1,
  buildEmailConfirmationHrefPattern,
} from "@/lib/auth/email-verification-ux-v1";

function read(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("ROVEXO confirmation email — Premium V1", () => {
  const templatePath = EMAIL_VERIFICATION_UX_V1.emailTemplate.contentPath;
  const html = read(templatePath);
  const lower = html.toLowerCase();

  it("keeps a single canonical confirmation template wired in config", () => {
    expect(existsSync(path.join(process.cwd(), templatePath))).toBe(true);
    const config = read("supabase/config.toml");
    expect(config).toContain('content_path = "./supabase/templates/confirmation.html"');
    expect(config).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.subject);
  });

  it("renders ROVEXO premium branding and required copy", () => {
    expect(html).toContain("ROVEXO");
    expect(html).toContain("Buy • Sell • Grow");
    expect(html).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.headline);
    expect(html).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.body);
    expect(html).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.cta);
    expect(html).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.accountLabel);
    expect(html).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.secureLinkNote);
    expect(html).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.footerTagline);
    expect(html).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.footerBrand);
    expect(html).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.footerDomain);
    expect(html).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.ignoreNote);
    expect(html).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.emblemPath);
    expect(html).toContain(EMAIL_VERIFICATION_UX_V1.emailTemplate.heroImagePath);
  });

  it("uses dynamic Supabase TokenHash → ROVEXO /verify-email (no hardcoded token)", () => {
    expect(html).toContain("{{ .TokenHash }}");
    expect(html).toContain("{{ .SiteURL }}");
    expect(html).toContain("{{ .Email }}");
    expect(html).toContain("/verify-email?token_hash={{ .TokenHash }}");
    expect(html).toContain("type=signup");
    expect(buildEmailConfirmationHrefPattern()).toContain("{{ .TokenHash }}");
    expect(html).not.toMatch(/token_hash=[a-zA-Z0-9_-]{20,}/);
    expect(html).not.toContain("{{ .ConfirmationURL }}");
  });

  it("forbids vendor and development branding in the user-facing email", () => {
    for (const token of EMAIL_VERIFICATION_UX_V1.forbidden) {
      if (token === "supabase.co hosted verify UI") {
        expect(lower).not.toContain("supabase.co/");
        continue;
      }
      expect(lower).not.toContain(token.toLowerCase());
    }
    expect(lower).not.toContain("sendcloud");
    expect(lower).not.toContain("powered by");
    expect(html).not.toContain("localhost");
    expect(html).not.toContain("127.0.0.1");
    expect(html).not.toContain("http://localhost");
  });

  it("stays email-safe — no scripts or app components", () => {
    expect(lower).not.toContain("<script");
    expect(html).not.toContain("use client");
    expect(html).not.toContain("next/image");
  });

  it("does not invent social destinations or fake expiry hours", () => {
    expect(html).not.toContain("instagram.com");
    expect(html).not.toContain("tiktok.com");
    expect(html).not.toContain("facebook.com/rovexo");
    expect(html).not.toContain("24 hours");
    expect(html).not.toContain("expire in 24");
  });
});
