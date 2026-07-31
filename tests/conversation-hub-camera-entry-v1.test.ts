import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readSource(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Conversation Hub camera entry — Phase I", () => {
  it("does not stub the camera button with a coming-soon toast", () => {
    const source = readSource("features/inbox/components/ConversationHub.tsx");
    expect(source).not.toContain("Photo messages coming soon.");
  });

  it("opens the certified native photo entry on Add photo (gallery intent — A2)", () => {
    // Phase A2 intentionally uses intent="gallery" so the OS picker offers
    // Camera + Gallery without forced capture=environment (device freezes).
    const source = readSource("features/inbox/components/ConversationHub.tsx");
    expect(source).toContain('from "@/components/ui/NativeImageFileInput"');
    expect(source).toContain('intent="gallery"');
    expect(source).toContain("cameraPickerId");
    expect(source).toContain("input.click()");
    expect(source).toContain("handlePhotoSelected");
  });

  it("reuses NativeImageFileInput capture contract (camera still available via gallery intent)", () => {
    const picker = readSource("components/ui/NativeImageFileInput.tsx");
    expect(picker).toContain("resolveNativeImageCapture");
    expect(picker).toContain("capture");
  });
});
