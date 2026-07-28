import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PHOTO_DELETE_UX_V1 } from "@/lib/sell/photo-delete-ux-v1";

function readSource(relativePath: string): string {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Photo Delete UX v1.0", () => {
  it("SSOT forbids confirmation and requires instant local delete", () => {
    expect(PHOTO_DELETE_UX_V1.instantDelete).toBe(true);
    expect(PHOTO_DELETE_UX_V1.confirmationDialogForbidden).toBe(true);
    expect(PHOTO_DELETE_UX_V1.popupForbidden).toBe(true);
    expect(PHOTO_DELETE_UX_V1.ghostThumbnailForbidden).toBe(true);
    expect(PHOTO_DELETE_UX_V1.blankSlotForbidden).toBe(true);
    expect(PHOTO_DELETE_UX_V1.failClosedRestore).toBe(true);
    expect(PHOTO_DELETE_UX_V1.slideLeftMs.canonical).toBeGreaterThanOrEqual(150);
    expect(PHOTO_DELETE_UX_V1.slideLeftMs.canonical).toBeLessThanOrEqual(200);
  });

  it("DeletePhotoAction deletes immediately without dialog", () => {
    const action = readSource("features/sell/ui/DeletePhotoAction.tsx");
    expect(action).toContain("removePhoto");
    expect(action).not.toContain("CanonicalConfirmDialog");
    expect(action).not.toContain("window.confirm");
    expect(action).not.toContain("setOpen");
    expect(action).toContain('data-photo-delete-ux="v1.0"');
  });

  it("SellProvider removes locally first and cancels in-flight uploads", () => {
    const provider = readSource("features/sell/context/SellProvider.tsx");
    expect(provider).toContain("cancelledPhotoIdsRef");
    expect(provider).toContain("startsWith(\"blob:\")");
    expect(provider).toContain("Fail closed");
    expect(provider).toContain("Instant local remove");
  });

  it("SellPhotoRail plays slide-left FLIP after delete", () => {
    const rail = readSource("features/sell/ui/SellPhotoRail.tsx");
    const css = readSource("styles/rovexo/sell.css");
    expect(rail).toContain("captureFlipBeforeDelete");
    expect(rail).toContain("playFlipAfterDelete");
    expect(rail).toContain("data-photo-id");
    expect(css).toContain("sell-photo-tile--slide-left");
    expect(css).toContain("180ms");
  });
});
