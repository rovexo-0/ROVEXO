import { describe, expect, it } from "vitest";

import { publishPhaseLabel, PUBLISH_FAILURE_MESSAGE } from "@/lib/sell/publish-engine";
import {
  DRAFT_AUTOSAVE_MS,
  DRAFT_EXPIRY_MS,
  isDraftExpired,
  isMeaningfulDraft,
} from "@/lib/sell/draft-engine";

describe("publish-engine", () => {
  it("maps publish phases to user-facing labels", () => {
    expect(publishPhaseLabel("idle")).toBe("Publish");
    expect(publishPhaseLabel("validating")).toBe("Publishing…");
    expect(publishPhaseLabel("uploading", { uploadProgress: 42 })).toContain("Uploading photos…");
    expect(publishPhaseLabel("creating")).toBe("Creating listing…");
    expect(publishPhaseLabel("finalising")).toBe("Finalising…");
    expect(publishPhaseLabel("published")).toBe("Published");
  });

  it("exposes canonical publish failure copy", () => {
    expect(PUBLISH_FAILURE_MESSAGE).toContain("draft has been safely saved");
  });
});

describe("draft-engine", () => {
  it("uses 5 second autosave and 30 day expiry", () => {
    expect(DRAFT_AUTOSAVE_MS).toBe(5000);
    expect(DRAFT_EXPIRY_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("detects meaningful drafts", () => {
    expect(isMeaningfulDraft(null, 0)).toBe(false);
    expect(isMeaningfulDraft({ title: "Chair" }, 0)).toBe(true);
    expect(isMeaningfulDraft(null, 2)).toBe(true);
  });

  it("expires drafts after TTL", () => {
    const recent = Date.now() - 1000;
    const stale = Date.now() - DRAFT_EXPIRY_MS - 1;
    expect(isDraftExpired(recent)).toBe(false);
    expect(isDraftExpired(stale)).toBe(true);
  });
});
