import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function src(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Business Information contact email — saved value only", () => {
  it("does not prefill a generated or account-mirror email when none is saved", () => {
    const form = src("features/business/onboarding/BusinessInformationForm.tsx");
    const page = src("app/(platform)/business/information/page.tsx");
    const engine = src("lib/business/business-onboarding-v1.ts");

    expect(form).toContain('placeholder="Your email"');
    expect(form).toContain("initial?.contactEmail ?? \"\"");
    expect(form).not.toContain("contactEmailFallback");
    expect(form).not.toContain("name@business.co.uk");
    expect(page).not.toContain("contactEmailFallback");
    expect(page).not.toContain("profile.email");
    expect(engine).toContain("contactEmail: tax?.email ?? \"\"");
    expect(engine).not.toContain("profile?.contactEmail || userRow?.email");
    expect(engine).toContain("email: input.contactEmail");
    expect(form).toContain('inputType="email"');
    expect(form).toContain('label="📧 Contact email"');
  });
});
