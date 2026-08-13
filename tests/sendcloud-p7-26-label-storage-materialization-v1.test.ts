/**
 * P7.26 — Shipping label materialization into ROVEXO-controlled storage.
 * Browser never receives Sendcloud panel document URLs or credentials.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const downloadMock = vi.fn();
const uploadMock = vi.fn();
const createSignedUrlMock = vi.fn();
const fromUpdateMock = vi.fn();
const fromEqMock = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => uploadMock(...args),
        download: (...args: unknown[]) => downloadMock(...args),
        createSignedUrl: (...args: unknown[]) => createSignedUrlMock(...args),
      }),
    },
    from: () => ({
      update: (...args: unknown[]) => {
        fromUpdateMock(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            fromEqMock(...eqArgs);
            return Promise.resolve({ error: null });
          },
        };
      },
    }),
  }),
}));

vi.mock("@/lib/shipping/env", () => ({
  isSendcloudConfigured: () => true,
  getSendcloudPublicKey: () => "pub-test",
  getSendcloudSecretKey: () => "sec-test",
}));

describe("P7.26 shipping label storage materialization", () => {
  beforeEach(() => {
    downloadMock.mockReset();
    uploadMock.mockReset();
    createSignedUrlMock.mockReset();
    fromUpdateMock.mockReset();
    fromEqMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("detects Sendcloud panel document URLs and canonical storage keys", async () => {
    const {
      isSendcloudPanelDocumentUrl,
      isCanonicalShippingLabelStorageKey,
    } = await import("@/lib/shipping/label-storage.server");

    expect(
      isSendcloudPanelDocumentUrl(
        "https://panel.sendcloud.sc/api/v3/parcels/699145248/documents/label",
      ),
    ).toBe(true);
    expect(
      isCanonicalShippingLabelStorageKey(
        "50a8b313-1fd3-4104-8af5-725a84a3350e/parcel-1-label.pdf",
      ),
    ).toBe(true);
    expect(
      isCanonicalShippingLabelStorageKey(
        "https://panel.sendcloud.sc/api/v3/parcels/699145248/documents/label",
      ),
    ).toBe(false);
  });

  it("downloads Sendcloud documents with server Basic auth and stores PDF bytes", async () => {
    const pdfBytes = Buffer.from("%PDF-1.4 fake-label-content");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/pdf" },
      arrayBuffer: async () => pdfBytes,
    });
    vi.stubGlobal("fetch", fetchMock);

    downloadMock.mockResolvedValue({ data: null, error: { message: "not found" } });
    uploadMock.mockResolvedValue({ error: null });
    createSignedUrlMock.mockResolvedValue({
      data: {
        signedUrl:
          "https://pklotmwxtnnepaitedic.supabase.co/storage/v1/object/sign/shipping-labels/order/parcel-1-label.pdf?token=abc",
      },
    });

    const { persistShippingLabelPdf, isSendcloudPanelDocumentUrl } = await import(
      "@/lib/shipping/label-storage.server"
    );

    const stored = await persistShippingLabelPdf({
      orderId: "50a8b313-1fd3-4104-8af5-725a84a3350e",
      parcelNumber: 1,
      labelUrl: "https://panel.sendcloud.sc/api/v3/parcels/699145248/documents/label",
    });

    expect(isSendcloudPanelDocumentUrl(stored?.storagePath ?? null)).toBe(false);
    expect(stored?.storagePath).toBe(
      "50a8b313-1fd3-4104-8af5-725a84a3350e/parcel-1-label.pdf",
    );
    expect(stored?.signedUrl).toContain("supabase.co");
    expect(stored?.signedUrl).not.toContain("panel.sendcloud.sc");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const auth = (init.headers as Record<string, string>).Authorization;
    expect(auth.startsWith("Basic ")).toBe(true);
    // Basic auth is base64(pub:sec) — never plaintext secret in browser payloads.
    expect(auth).not.toContain("sec-test");
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });

  it("resolveBrowserShippingLabelPdfUrl never returns Sendcloud panel URLs", async () => {
    const pdfBytes = Buffer.from("%PDF-1.4 ready");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/pdf" },
        arrayBuffer: async () => pdfBytes,
      }),
    );
    downloadMock.mockResolvedValue({ data: null, error: { message: "missing" } });
    uploadMock.mockResolvedValue({ error: null });
    createSignedUrlMock.mockResolvedValue({
      data: {
        signedUrl:
          "https://pklotmwxtnnepaitedic.supabase.co/storage/v1/object/sign/shipping-labels/x/parcel-1-label.pdf?token=t",
      },
    });

    const { resolveBrowserShippingLabelPdfUrl, isSendcloudPanelDocumentUrl } = await import(
      "@/lib/shipping/label-storage.server"
    );

    const resolved = await resolveBrowserShippingLabelPdfUrl({
      orderId: "50a8b313-1fd3-4104-8af5-725a84a3350e",
      labelRowId: "09b53ec4-0289-445d-bbdb-c7dfbc6f6c42",
      parcelNumber: 1,
      trackingNumber: "H01XTA0004974486",
      labelStoragePath:
        "https://panel.sendcloud.sc/api/v3/parcels/699145248/documents/label",
      labelUrl: "https://panel.sendcloud.sc/api/v3/parcels/699145248/documents/label",
    });

    expect(resolved).not.toBeNull();
    expect(isSendcloudPanelDocumentUrl(resolved!.pdfUrl)).toBe(false);
    expect(resolved!.pdfUrl).toContain("supabase.co");
    expect(resolved!.materialized).toBe(true);
  });

  it("idempotent resolve reuses existing storage object without re-download", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    downloadMock.mockResolvedValue({ data: new Blob(["%PDF"]), error: null });
    createSignedUrlMock.mockResolvedValue({
      data: {
        signedUrl:
          "https://pklotmwxtnnepaitedic.supabase.co/storage/v1/object/sign/shipping-labels/x/parcel-1-label.pdf?token=reuse",
      },
    });

    const { resolveBrowserShippingLabelPdfUrl } = await import(
      "@/lib/shipping/label-storage.server"
    );

    const resolved = await resolveBrowserShippingLabelPdfUrl({
      orderId: "50a8b313-1fd3-4104-8af5-725a84a3350e",
      parcelNumber: 1,
      trackingNumber: "H01XTA0004974486",
      labelStoragePath:
        "https://panel.sendcloud.sc/api/v3/parcels/699145248/documents/label",
      labelUrl: "https://panel.sendcloud.sc/api/v3/parcels/699145248/documents/label",
    });

    expect(resolved?.materialized).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(uploadMock).not.toHaveBeenCalled();
    expect(resolved?.pdfUrl).toContain("supabase.co");
  });

  it("GET labels route uses resolveBrowserShippingLabelPdfUrl and never returns panel URLs", () => {
    const route = read("app/api/shipping/labels/route.ts");
    expect(route).toContain("resolveBrowserShippingLabelPdfUrl");
    expect(route).toContain("isSendcloudPanelDocumentUrl");
    expect(route).toContain("503");
    expect(route).not.toMatch(
      /pdfUrl:\s*storagePath[\s\S]*isHttpStoragePath/,
    );
  });

  it("ShippingLabelViewer still consumes pdfUrl (canonical ROVEXO URL)", () => {
    const viewer = read("features/shipping/components/ShippingLabelViewer.tsx");
    expect(viewer).toContain("pdfUrl");
    expect(viewer).toContain("fetch(absolute");
    expect(viewer).not.toContain("SENDCLOUD_SECRET");
    expect(viewer).not.toContain("panel.sendcloud.sc");
  });

  it("generation path still persists via persistShippingLabelPdf (auth download)", () => {
    const server = read("lib/shipping/server.ts");
    expect(server).toContain("persistShippingLabelPdf");
    const storage = read("lib/shipping/label-storage.server.ts");
    expect(storage).toContain("downloadShippingLabelDocumentBytes");
    expect(storage).toContain("sendcloudBasicAuthHeader");
    expect(storage).not.toContain("NEXT_PUBLIC_");
  });

  it("HTTP 401 from raw Sendcloud URL fails closed server-side (no browser pdfUrl)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: { get: () => "application/json" },
        arrayBuffer: async () =>
          Buffer.from('{"errors":[{"code":"not_authenticated"}]}'),
      }),
    );
    downloadMock.mockResolvedValue({ data: null, error: { message: "missing" } });

    const { resolveBrowserShippingLabelPdfUrl } = await import(
      "@/lib/shipping/label-storage.server"
    );

    const resolved = await resolveBrowserShippingLabelPdfUrl({
      orderId: "50a8b313-1fd3-4104-8af5-725a84a3350e",
      parcelNumber: 1,
      trackingNumber: "H01XTA0004974486",
      labelStoragePath:
        "https://panel.sendcloud.sc/api/v3/parcels/699145248/documents/label",
      labelUrl: "https://panel.sendcloud.sc/api/v3/parcels/699145248/documents/label",
    });

    expect(resolved).toBeNull();
  });
});
