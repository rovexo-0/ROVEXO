import { describe, expect, it } from "vitest";
import {
  analyzeImageMetadata,
  analyzeListingContent,
  analyzeMessageContent,
  isDuplicateListingText,
} from "@/lib/moderation/analyzer";

describe("moderation analyzer", () => {
  it("blocks prohibited firearms listings", () => {
    const result = analyzeListingContent({
      title: "Glock 19 handgun",
      description: "Used pistol for sale",
    });
    expect(result.decision).toBe("blocked");
    expect(result.categories).toContain("firearms");
  });

  it("warns on knife listings", () => {
    const result = analyzeListingContent({
      title: "Tactical combat knife",
      description: "Sharp blade",
    });
    expect(result.decision).toBe("warning");
    expect(result.categories).toContain("knives");
  });

  it("detects scam language in messages", () => {
    const result = analyzeMessageContent("Pay me outside the app via bank transfer only");
    expect(["warning", "blocked"]).toContain(result.decision);
    expect(result.categories.some((category) => ["scam", "off_platform_payment"].includes(category))).toBe(
      true,
    );
  });

  it("flags suspicious image filenames", () => {
    const result = analyzeImageMetadata({ fileName: "glock-pistol-photo.jpg" });
    expect(result.decision).not.toBe("approved");
  });

  it("detects duplicate listings", () => {
    const duplicate = isDuplicateListingText(
      { title: "Blue Nike Hoodie", description: "Size M, great condition" },
      [{ title: "Blue Nike Hoodie", description: "Size M, great condition" }],
    );
    expect(duplicate).not.toBeNull();
    expect(duplicate!.decision).not.toBe("approved");
    expect(duplicate!.categories).toContain("duplicate");
  });
});
