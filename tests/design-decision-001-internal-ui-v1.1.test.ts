import { describe, expect, it } from "vitest";
import {
  DESIGN_DECISION_001_CERTIFICATION,
  DESIGN_DECISION_001_PRODUCTION_READY,
  DESIGN_DECISION_001_STATUS,
  DESIGN_DECISION_001_VERSION,
  HOMEPAGE_CONTENT_PAD_X_PX,
  HOMEPAGE_HEADER_PAD_X_PX,
  HOMEPAGE_PAD_X_PX,
  INTERNAL_PAD_X_PX,
  designDecision001Snapshot,
} from "@/lib/design-system/design-decision-001-internal-ui-v1.1";
import { MASTER_FULL_WIDTH_TOKENS } from "@/lib/master-engine/master-full-width-contract-v1";
import { FULL_WIDTH_ENGINE_SPEC } from "@/lib/master-engine/full-width-engine";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("DESIGN DECISION #001 — Internal UI v1.1", () => {
  it("locks Homepage content 16px · header 24px · Internal 16px", () => {
    expect(DESIGN_DECISION_001_STATUS).toBe("APPROVED");
    expect(DESIGN_DECISION_001_VERSION).toBe("ROVEXO v1.1");
    expect(DESIGN_DECISION_001_CERTIFICATION).toBe("PASSED");
    expect(DESIGN_DECISION_001_PRODUCTION_READY).toBe(true);
    expect(HOMEPAGE_CONTENT_PAD_X_PX).toBe(16);
    expect(HOMEPAGE_HEADER_PAD_X_PX).toBe(24);
    expect(HOMEPAGE_PAD_X_PX).toBe(16);
    expect(INTERNAL_PAD_X_PX).toBe(16);
    expect(designDecision001Snapshot().homepagePadXPx).toBe(16);
    expect(designDecision001Snapshot().homepageHeaderPadXPx).toBe(24);
    expect(designDecision001Snapshot().homepageContentPadXPx).toBe(16);
    expect(designDecision001Snapshot().internalPadXPx).toBe(16);
  });

  it("wires Master Full Width + CSS dual standard", () => {
    expect(MASTER_FULL_WIDTH_TOKENS.paddingLeftPx).toBe(16);
    expect(MASTER_FULL_WIDTH_TOKENS.homepagePaddingLeftPx).toBe(16);
    expect(FULL_WIDTH_ENGINE_SPEC.paddingLeftPx).toBe(16);
    const css = readFileSync(
      join(process.cwd(), "styles/rovexo/full-width-engine-v1.css"),
      "utf8",
    );
    expect(css).toContain("--fw-pad-x: 16px");
    expect(css).toContain("--homepage-pad-x: 24px");
    expect(css).toContain("--hp-shell-pad: 16px");
    expect(css).toContain("--internal-pad-x: 16px");
    expect(css).toContain("DESIGN DECISION #002");
    expect(css).not.toMatch(/--rx-phone-inset-x:\s*var\(--homepage-pad-x/);
    expect(css).not.toMatch(
      /\.rovexo-page-home[\s\S]{0,200}--hp-shell-pad:\s*var\(--homepage-pad-x\)/,
    );
  });

  it("does not mount temporary RUN3/RUN4 pad gates in root layout", () => {
    const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(layout).not.toContain("Run3PadPreviewGate");
    expect(layout).not.toContain("Run4InternalPadGate");
  });
});
