/**
 * Canonical Store Share clipboard helper — LAN HTTP / iOS fallback.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildStoreFacebookShareUrl,
  buildStoreMessengerShareUrl,
  buildStoreQrTargetUrl,
  buildStoreShareText,
  buildStoreTelegramShareUrl,
  buildStoreUrl,
  buildStoreWhatsAppShareUrl,
  copyText,
} from "@/lib/store-sharing/store-share-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function installFallbackDocument(execResult: boolean, execImpl?: () => boolean) {
  const textarea = {
    value: "",
    style: {} as Record<string, string>,
    focus: vi.fn(),
    select: vi.fn(),
    setSelectionRange: vi.fn(),
    setAttribute: vi.fn(),
    remove: vi.fn(),
  };
  const body = {
    appendChild: vi.fn(),
  };
  const execCommand = vi.fn(execImpl ?? (() => execResult));
  vi.stubGlobal("document", {
    body,
    createElement: vi.fn(() => textarea),
    execCommand,
  });
  return { textarea, body, execCommand };
}

describe("Store Share clipboard helper v1", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("TEST 1: Clipboard API exists and succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const fallback = installFallbackDocument(true);
    await expect(copyText("https://www.rovexo.co.uk/@alpha-store")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://www.rovexo.co.uk/@alpha-store");
    expect(fallback.execCommand).not.toHaveBeenCalled();
  });

  it("TEST 2: Clipboard API unavailable → fallback attempted", async () => {
    vi.stubGlobal("navigator", {});
    const fallback = installFallbackDocument(true);
    await expect(copyText("hello")).resolves.toBe(true);
    expect(fallback.execCommand).toHaveBeenCalledWith("copy");
    expect(fallback.body.appendChild).toHaveBeenCalled();
    expect(fallback.textarea.remove).toHaveBeenCalled();
  });

  it("TEST 3: Clipboard API exists but throws → fallback attempted", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("secure-context"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const fallback = installFallbackDocument(true);
    await expect(copyText("hello")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalled();
    expect(fallback.execCommand).toHaveBeenCalledWith("copy");
  });

  it("TEST 4: Fallback succeeds → PASS", async () => {
    vi.stubGlobal("navigator", { clipboard: undefined });
    const fallback = installFallbackDocument(true);
    await expect(copyText("copied")).resolves.toBe(true);
    expect(fallback.textarea.value).toBe("copied");
    expect(fallback.execCommand).toHaveBeenCalledWith("copy");
  });

  it("TEST 5: Clipboard API fails and fallback fails → returns failure", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    installFallbackDocument(false);
    await expect(copyText("hello")).resolves.toBe(false);
  });

  it("TEST 6: Copy Link copies the exact canonical Store URL", () => {
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    expect(sheet).toContain("copyText(data.storeUrl)");
    expect(buildStoreUrl("alpha-store")).toBe("https://www.rovexo.co.uk/@alpha-store");
    expect(sheet).not.toContain("navigator.clipboard.writeText(data.storeUrl)");
  });

  it("TEST 7: Instagram copies buildStoreShareText(storeUrl)", () => {
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    expect(sheet).toContain("buildStoreShareText(data.storeUrl)");
    expect(sheet).toContain("copyText(shareText)");
    const url = buildStoreUrl("alpha-store");
    const message = buildStoreShareText(url);
    expect(message).toContain(url);
    expect(message).toContain("Check out my store on ROVEXO!");
  });

  it("TEST 8: No @mishuu hardcoding in clipboard helper or sheet", () => {
    expect(readSource("lib/store-sharing/store-share-v1.ts")).not.toMatch(
      /copyText[\s\S]*@mishuu/,
    );
    expect(readSource("features/store-sharing/StoreShareSheet.tsx")).not.toContain("@mishuu");
    expect(readSource("features/store-sharing/StoreShareSheet.tsx")).not.toContain("mishuu");
  });

  it("TEST 9: Only one canonical clipboard helper exists", () => {
    const engine = readSource("lib/store-sharing/store-share-v1.ts");
    expect(engine).toContain("export async function copyText");
    expect(engine.match(/document\.execCommand\("copy"\)/g)?.length).toBe(1);
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    const visit = readSource("features/store/components/StoreVisitPageV2.tsx");
    expect(sheet).toContain("copyText(");
    expect(visit).toContain('from "@/lib/store-sharing/store-share-v1"');
    expect(visit).toContain("copyText(");
    expect(visit).not.toContain('document.execCommand("copy")');
    expect(sheet).not.toContain('document.execCommand("copy")');
  });

  it("TEST 10–14: Facebook, WhatsApp, Telegram, Messenger, QR unchanged", () => {
    const url = buildStoreUrl("alpha-store");
    expect(buildStoreFacebookShareUrl(url)).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    );
    expect(buildStoreWhatsAppShareUrl(url)).toContain("wa.me");
    expect(buildStoreWhatsAppShareUrl(url)).toContain(encodeURIComponent(url));
    expect(buildStoreTelegramShareUrl(url, buildStoreShareText(url))).toContain("t.me/share/url");
    expect(buildStoreMessengerShareUrl(url)).toContain("facebook.com/dialog/send");
    expect(buildStoreQrTargetUrl("alpha-store")).toBe(url);
    const sheet = readSource("features/store-sharing/StoreShareSheet.tsx");
    expect(sheet).toContain("resolveStoreFacebookShareMode");
    expect(sheet).toContain("buildStoreFacebookShareUrl(data.storeUrl)");
    expect(sheet).toContain("buildStoreWhatsAppShareUrl");
    expect(sheet).toContain("buildStoreTelegramShareUrl");
    expect(sheet).toContain("buildStoreMessengerShareUrl");
  });

  it("copyText never throws", async () => {
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn(() => {
          throw new Error("sync-throw");
        }),
      },
    });
    vi.stubGlobal("document", {
      body: {
        appendChild: () => {
          throw new Error("dom");
        },
      },
      createElement: () => {
        throw new Error("create");
      },
    });
    await expect(copyText("x")).resolves.toBe(false);
  });
});
