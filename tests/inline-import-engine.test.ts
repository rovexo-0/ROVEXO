import { describe, expect, it } from "vitest";
import {
  buildUrlPreview,
  previewHasBlockingErrors,
  resolvePreviewEndpoint,
} from "@/lib/bring-your-item/inline-import-engine";

describe("Inline Import Engine — Phase 2", () => {
  it("resolves preview endpoints for file connectors", () => {
    expect(resolvePreviewEndpoint("csv")).toContain("/connectors/csv/preview");
    expect(resolvePreviewEndpoint("xlsx")).toContain("/connectors/xlsx/preview");
    expect(resolvePreviewEndpoint("single_url")).toBeNull();
  });

  it("validates URL preview inline", () => {
    const valid = buildUrlPreview(["https://example.com/listing/1"]);
    expect(valid?.totalRows).toBe(1);
    expect(previewHasBlockingErrors(valid)).toBe(false);

    const invalid = buildUrlPreview(["not-a-url"]);
    expect(previewHasBlockingErrors(invalid)).toBe(true);
  });
});
