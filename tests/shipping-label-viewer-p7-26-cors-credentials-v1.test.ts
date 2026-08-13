/**
 * P7.26 — Signed Supabase PDF fetch must omit credentials (CORS * + credentials:include fails).
 * Same-origin ROVEXO /api/shipping/labels auth is unchanged (LabelCard / Conversation Hub).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

describe("P7.26 ShippingLabelViewer CORS credentials for signed PDF", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("omits credentials for cross-origin Supabase signed Storage URLs", async () => {
    const { resolveShippingLabelFetchCredentials } = await import(
      "@/features/shipping/components/ShippingLabelViewer"
    );
    const signed =
      "https://pklotmwxtnnepaitedic.supabase.co/storage/v1/object/sign/shipping-labels/order/parcel-1-label.pdf?token=test";
    expect(
      resolveShippingLabelFetchCredentials(signed, "https://rovexo-gv3zmkqx4-rovexo.vercel.app"),
    ).toBe("omit");
    expect(resolveShippingLabelFetchCredentials(signed, "https://www.rovexo.co.uk")).toBe("omit");
  });

  it("keeps credentials include for same-origin ROVEXO / demo label paths", async () => {
    const { resolveShippingLabelFetchCredentials } = await import(
      "@/features/shipping/components/ShippingLabelViewer"
    );
    expect(
      resolveShippingLabelFetchCredentials(
        "https://www.rovexo.co.uk/api/shipping/demo-label?t=1",
        "https://www.rovexo.co.uk",
      ),
    ).toBe("include");
    expect(
      resolveShippingLabelFetchCredentials("/api/shipping/demo-label", "https://www.rovexo.co.uk"),
    ).toBe("include");
  });

  it("loadLabel fetch uses resolveShippingLabelFetchCredentials (not hard-coded include)", async () => {
    const viewer = read("features/shipping/components/ShippingLabelViewer.tsx");
    expect(viewer).toContain("resolveShippingLabelFetchCredentials");
    expect(viewer).toContain("credentials: resolveShippingLabelFetchCredentials(absolute)");
    expect(viewer).toContain(
      "credentials: resolveShippingLabelFetchCredentials(absoluteDownload)",
    );
    // Must not hard-code include on the PDF load/download fetches anymore.
    expect(viewer).not.toMatch(/fetch\(absolute,\s*\{[^}]*credentials:\s*"include"/s);
    expect(viewer).not.toMatch(
      /fetch\(resolveAbsoluteUrl\(sourceUrl\),\s*\{[^}]*credentials:\s*"include"/s,
    );
  });

  it("Download path reuses blob embed when ready (no second cross-origin credentialed fetch)", () => {
    const viewer = read("features/shipping/components/ShippingLabelViewer.tsx");
    expect(viewer).toContain('if (embedUrl?.startsWith("blob:"))');
    expect(viewer).toContain("createObjectURL");
    expect(viewer).toContain("Print / Share");
    expect(viewer).toContain("handleDownload");
    expect(viewer).toContain("handlePrintShare");
  });

  it("same-origin /api/shipping/labels callers remain credentialed separately", () => {
    const card = read("features/shipping/components/LabelCard.tsx");
    const hub = read("features/inbox/components/ConversationHub.tsx");
    expect(card).toContain('fetch("/api/shipping/labels"');
    expect(hub).toContain('fetch("/api/shipping/labels"');
    // Viewer must not mint shipments.
    const viewer = read("features/shipping/components/ShippingLabelViewer.tsx");
    expect(viewer).not.toContain("generateShippingLabel");
    expect(viewer).not.toContain('method: "POST"');
    expect(viewer).not.toContain("announceSendcloud");
  });
});
