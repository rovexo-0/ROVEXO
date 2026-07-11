import { describe, expect, it } from "vitest";
import { createEmptyDraft } from "@/features/sell/types";
import { applyDeterministicPrefill, buildDeterministicPrefill } from "@/lib/sell/deterministic-prefill";

describe("deterministic sell prefill", () => {
  it("extracts brand and storage from iPhone title", () => {
    const draft = createEmptyDraft();
    draft.title = "Apple iPhone 15 Pro Max 256GB Unlocked Like New";
    const patch = buildDeterministicPrefill(draft);
    expect(patch.brand).toBe("Apple");
    expect(patch.attributes?.storage).toBe("256GB");
    expect(patch.condition).toBe("Like New");
  });

  it("extracts memory foam material from pillow title", () => {
    const draft = createEmptyDraft();
    draft.title = "Tempur memory foam pillow excellent condition";
    const patch = buildDeterministicPrefill(draft);
    expect(patch.brand).toBe("Tempur");
    expect(patch.material).toBe("Memory Foam");
    expect(patch.condition).toBe("Excellent");
  });

  it("never overwrites existing user values", () => {
    const draft = createEmptyDraft();
    draft.title = "Samsung Galaxy S24";
    draft.brand = "Sony";
    const merged = applyDeterministicPrefill(draft, buildDeterministicPrefill(draft));
    expect(merged.brand).toBeUndefined();
  });
});
