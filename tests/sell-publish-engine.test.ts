import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  extractListingApiErrorCode,
  extractListingApiErrorMessage,
  isRetryableListingCreateStatus,
  publishPhaseLabel,
  PUBLISH_FAILURE_MESSAGE,
  PUBLISH_NETWORK_FAILURE_MESSAGE,
} from "@/lib/sell/publish-engine";
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
    expect(publishPhaseLabel("uploading", { uploadProgress: 42 })).toContain("Please wait…");
    expect(publishPhaseLabel("creating")).toBe("Please wait…");
    expect(publishPhaseLabel("finalising")).toBe("Please wait…");
    expect(publishPhaseLabel("published")).toBe("Listing successfully published.");
  });

  it("exposes fail-closed publish failure copy (no fake draft-saved claim)", () => {
    expect(PUBLISH_FAILURE_MESSAGE).not.toContain("draft has been safely saved");
    expect(PUBLISH_FAILURE_MESSAGE).toContain("Please try again");
    expect(PUBLISH_NETWORK_FAILURE_MESSAGE).toContain("Network error");
  });

  it("extracts real backend error + code from listing API JSON", () => {
    expect(
      extractListingApiErrorMessage(422, {
        error: "This listing cannot be published under ROVEXO marketplace rules.",
        code: "MARKETPLACE_RULES",
      }),
    ).toBe("This listing cannot be published under ROVEXO marketplace rules.");
    expect(
      extractListingApiErrorCode({
        error: "Select a category, subcategory, and product type.",
        code: "CATEGORY_MISSING",
      }),
    ).toBe("CATEGORY_MISSING");
    expect(extractListingApiErrorMessage(401, null)).toContain("sign in");
    expect(extractListingApiErrorMessage(500, {})).toContain("Server could not publish");
  });

  it("retries only transient listing create statuses", () => {
    expect(isRetryableListingCreateStatus(400)).toBe(false);
    expect(isRetryableListingCreateStatus(401)).toBe(false);
    expect(isRetryableListingCreateStatus(422)).toBe(false);
    expect(isRetryableListingCreateStatus(408)).toBe(true);
    expect(isRetryableListingCreateStatus(429)).toBe(true);
    expect(isRetryableListingCreateStatus(500)).toBe(true);
  });

  it("createListingWithRetry preserves API body and credentials (P0-01)", () => {
    const source = readFileSync(join(process.cwd(), "lib/sell/publish-engine.ts"), "utf8");
    expect(source).toContain('credentials: "same-origin"');
    expect(source).toContain("extractListingApiErrorMessage");
    expect(source).toContain("isRetryableListingCreateStatus");
    expect(source).not.toContain('void (await response.json().catch(() => null))');
    expect(source).not.toContain('throw new Error("Unable to save listing.")');
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
