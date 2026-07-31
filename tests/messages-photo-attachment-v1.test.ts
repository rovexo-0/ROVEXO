import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function readSource(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("Messages photo attachment — Phase I", () => {
  it("does not drop selected files in an empty onFilesSelected stub", () => {
    const source = readSource("features/inbox/components/ConversationHub.tsx");
    expect(source).not.toContain("Photo messages coming soon.");
    expect(source).not.toContain("photo message send is out of Phase I scope");
    expect(source).toContain("handlePhotoSelected");
    expect(source).toContain("pendingPhoto");
    expect(source).toContain("/api/messages/${conversation.id}/photo");
  });

  it("uploads via existing messages bucket helper", () => {
    const upload = readSource("lib/storage/upload.ts");
    expect(upload).toContain("uploadMessageImage");
    expect(upload).toContain('bucket: "messages"');

    const route = readSource("app/api/messages/[id]/photo/route.ts");
    expect(route).toContain("uploadMessageImage");
    expect(route).toContain('kind: "photo"');
  });

  it("signs private photo paths on conversation load", () => {
    const store = readSource("lib/messages/store.ts");
    expect(store).toContain("signPhotoMessageContents");
    expect(store).toContain("signSinglePhotoPath");
    expect(store).toContain("createSignedUrl");
    expect(store).toContain("last_message: previewText");
  });

  it("shows pending preview and photo bubble without composer redesign", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("conv-hub__composer-pending");
    expect(hub).toContain("conv-hub__bubble-photo");
    expect(hub).toContain('width="24"');
    expect(hub).toContain('height="24"');
  });
});
