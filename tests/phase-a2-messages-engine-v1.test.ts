import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isMessagePhotoStoragePath,
  isRenderableMessagePhotoSrc,
  messagePhotoInboxPreview,
  MESSAGE_PHOTO_PREVIEW_LABEL,
} from "@/lib/messages/message-photo-url-v1";
import { PHASE_A2_MESSAGES_ENGINE_V1 } from "@/lib/messages/phase-a2-messages-engine-v1";

function readSource(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

describe("Phase A2 — Messages photo URL contract", () => {
  it("detects storage paths vs renderable URLs", () => {
    expect(
      isMessagePhotoStoragePath("a1b2c3d4-e5f6-7890-abcd-ef1234567890/photo.jpg"),
    ).toBe(true);
    expect(isMessagePhotoStoragePath("https://cdn.example/x.jpg")).toBe(false);
    expect(isMessagePhotoStoragePath("blob:https://local/1")).toBe(false);
    expect(isMessagePhotoStoragePath("")).toBe(false);
    expect(isMessagePhotoStoragePath(null)).toBe(false);

    expect(isRenderableMessagePhotoSrc("https://x.test/a.jpg")).toBe(true);
    expect(isRenderableMessagePhotoSrc("blob:http://localhost/1")).toBe(true);
    expect(isRenderableMessagePhotoSrc("conv/file.jpg")).toBe(false);
    expect(isRenderableMessagePhotoSrc("")).toBe(false);
  });

  it("uses Shared photo preview for inbox last message", () => {
    expect(messagePhotoInboxPreview("photo", "conv/x.jpg")).toBe(MESSAGE_PHOTO_PREVIEW_LABEL);
    expect(messagePhotoInboxPreview("text", "Hello")).toBe("Hello");
  });

  it("locks Phase A2 root-cause and scope", () => {
    expect(PHASE_A2_MESSAGES_ENGINE_V1.fixes).toContain("preserve-signed-url-on-realtime-merge");
    expect(PHASE_A2_MESSAGES_ENGINE_V1.forbiddenModules).toContain("homepage");
    expect(PHASE_A2_MESSAGES_ENGINE_V1.forbiddenModules).toContain("sell");
  });

  it("realtime merge never overwrites signed URLs with storage paths", () => {
    const realtime = readSource("features/messages/hooks/use-chat-realtime.ts");
    expect(realtime).toContain("mergeRealtimePhotoContent");
    expect(realtime).toContain("resolveMessagePhotoUrl");
    expect(realtime).toContain("messagePhotoInboxPreview");
  });

  it("ConversationHub resolves photos and prepares uploads once", () => {
    const hub = readSource("features/inbox/components/ConversationHub.tsx");
    expect(hub).toContain("MessagePhotoBubble");
    expect(hub).toContain("prepareMessagePhotoFile");
    expect(hub).toContain("resolveMessagePhotoUrl");
    expect(hub).toContain('intent="gallery"');
    expect(hub).toContain("photoUploadLockRef");
    expect(hub).toContain("dismissPendingPhotoKeepBlob");
    expect(hub).not.toContain('intent="camera"');
  });

  it("server signs photo paths on load and append", () => {
    const store = readSource("lib/messages/store.ts");
    expect(store).toContain("signSinglePhotoPath");
    expect(store).toContain("tryCreateAdminClient");
    expect(store).toContain("isMessagePhotoStoragePath");
    expect(store).toContain("MESSAGE_PHOTO_PREVIEW_LABEL");
  });
});
