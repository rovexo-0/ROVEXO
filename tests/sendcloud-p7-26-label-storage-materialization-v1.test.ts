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
const shippingUpdateMock = vi.fn();
const shippingEqMock = vi.fn();

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

vi.mock("@/lib/shipping/db-client", () => ({
  createShippingAdminClient: () => ({
    from: () => ({
      update: (...args: unknown[]) => {
        shippingUpdateMock(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            shippingEqMock(...eqArgs);
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

const ORDER_ID = "50a8b313-1fd3-4104-8af5-725a84a3350e";
const PANEL_URL =
  "https://panel.sendcloud.sc/api/v3/parcels/699145248/documents/label";
const CANONICAL = `${ORDER_ID}/parcel-1-label.pdf`;
const SIGNED =
  "https://pklotmwxtnnepaitedic.supabase.co/storage/v1/object/sign/shipping-labels/50a8b313-1fd3-4104-8af5-725a84a3350e/parcel-1-label.pdf?token=abc";
const TRACKING = "H01XTA0004974486";

function pdfFetchOk(pdfBytes = Buffer.from("%PDF-1.4 fake-label-content")) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => "application/pdf" },
    arrayBuffer: async () => pdfBytes,
    text: async () => pdfBytes.toString("utf8"),
  });
}

describe("P7.26 shipping label storage materialization", () => {
  beforeEach(() => {
    downloadMock.mockReset();
    uploadMock.mockReset();
    createSignedUrlMock.mockReset();
    fromUpdateMock.mockReset();
    fromEqMock.mockReset();
    shippingUpdateMock.mockReset();
    shippingEqMock.mockReset();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("detects Sendcloud panel document URLs and canonical storage keys", async () => {
    const {
      isSendcloudPanelDocumentUrl,
      isCanonicalShippingLabelStorageKey,
    } = await import("@/lib/shipping/label-storage.server");

    expect(isSendcloudPanelDocumentUrl(PANEL_URL)).toBe(true);
    expect(isCanonicalShippingLabelStorageKey(CANONICAL)).toBe(true);
    expect(isCanonicalShippingLabelStorageKey(PANEL_URL)).toBe(false);
  });

  it("1+2: READY panel URL materializes; download uses exact Accept application/pdf + Basic auth", async () => {
    const pdfBytes = Buffer.from("%PDF-1.4 fake-label-content");
    const fetchMock = pdfFetchOk(pdfBytes);
    vi.stubGlobal("fetch", fetchMock);

    downloadMock.mockResolvedValue({ data: null, error: { message: "not found" } });
    uploadMock.mockResolvedValue({ error: null });
    createSignedUrlMock.mockResolvedValue({ data: { signedUrl: SIGNED } });

    const { persistShippingLabelPdf, isSendcloudPanelDocumentUrl } = await import(
      "@/lib/shipping/label-storage.server"
    );

    const stored = await persistShippingLabelPdf({
      orderId: ORDER_ID,
      parcelNumber: 1,
      labelUrl: PANEL_URL,
    });

    expect(isSendcloudPanelDocumentUrl(stored?.storagePath ?? null)).toBe(false);
    expect(stored?.storagePath).toBe(CANONICAL);
    expect(stored?.signedUrl).toContain("supabase.co");
    expect(stored?.signedUrl).not.toContain("panel.sendcloud.sc");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(PANEL_URL);
    expect(init.method).toBe("GET");
    const headers = init.headers as Record<string, string>;
    expect(headers.Accept).toBe("application/pdf");
    expect(headers.Authorization?.startsWith("Basic ")).toBe(true);
    expect(headers.Authorization).not.toContain("sec-test");
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });

  it("3: non-2xx document response fails closed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: [
              {
                status: "400",
                code: "validation_error",
                detail:
                  "Input should be 'application/pdf', 'application/zpl' or 'image/png'",
                source: { pointer: "/header/accept" },
              },
            ],
          }),
          { status: 400, headers: { "content-type": "application/json; charset=utf-8" } },
        ),
      ),
    );
    downloadMock.mockResolvedValue({ data: null, error: { message: "missing" } });

    const { downloadShippingLabelDocumentBytes, resolveBrowserShippingLabelPdfUrl } =
      await import("@/lib/shipping/label-storage.server");

    expect(await downloadShippingLabelDocumentBytes(PANEL_URL)).toBeNull();
    expect(
      await resolveBrowserShippingLabelPdfUrl({
        orderId: ORDER_ID,
        parcelNumber: 1,
        trackingNumber: TRACKING,
        labelStoragePath: PANEL_URL,
        labelUrl: PANEL_URL,
      }),
    ).toBeNull();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("4: invalid JSON/HTML response cannot be stored as label", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/pdf" },
        arrayBuffer: async () => Buffer.from('{"errors":[{"code":"nope"}]}'),
        text: async () => '{"errors":[{"code":"nope"}]}',
      }),
    );

    const { downloadShippingLabelDocumentBytes } = await import(
      "@/lib/shipping/label-storage.server"
    );
    expect(await downloadShippingLabelDocumentBytes(PANEL_URL)).toBeNull();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("5: upload failure fails closed", async () => {
    vi.stubGlobal("fetch", pdfFetchOk());
    downloadMock.mockResolvedValue({ data: null, error: { message: "missing" } });
    uploadMock.mockResolvedValue({
      error: { message: "storage unavailable", statusCode: "500" },
    });

    const { persistShippingLabelPdf } = await import(
      "@/lib/shipping/label-storage.server"
    );
    expect(
      await persistShippingLabelPdf({
        orderId: ORDER_ID,
        parcelNumber: 1,
        labelUrl: PANEL_URL,
      }),
    ).toBeNull();
    expect(createSignedUrlMock).not.toHaveBeenCalled();
  });

  it("6: confirmed already-exists upload remains idempotent", async () => {
    vi.stubGlobal("fetch", pdfFetchOk());
    downloadMock.mockResolvedValue({ data: null, error: { message: "missing" } });
    uploadMock.mockResolvedValue({
      error: { message: "The resource already exists", statusCode: "409" },
    });
    createSignedUrlMock.mockResolvedValue({ data: { signedUrl: SIGNED } });

    const { persistShippingLabelPdf } = await import(
      "@/lib/shipping/label-storage.server"
    );
    const stored = await persistShippingLabelPdf({
      orderId: ORDER_ID,
      parcelNumber: 1,
      labelUrl: PANEL_URL,
    });
    expect(stored?.storagePath).toBe(CANONICAL);
    expect(stored?.signedUrl).toBe(SIGNED);
  });

  it("7: signed URL failure fails closed", async () => {
    vi.stubGlobal("fetch", pdfFetchOk());
    downloadMock.mockResolvedValue({ data: null, error: { message: "missing" } });
    uploadMock.mockResolvedValue({ error: null });
    createSignedUrlMock.mockResolvedValue({
      data: null,
      error: { message: "sign failed" },
    });

    const { persistShippingLabelPdf, resolveBrowserShippingLabelPdfUrl } = await import(
      "@/lib/shipping/label-storage.server"
    );
    const stored = await persistShippingLabelPdf({
      orderId: ORDER_ID,
      parcelNumber: 1,
      labelUrl: PANEL_URL,
    });
    // persist may return storagePath with signedUrl null — resolve must fail closed without panel URL
    expect(stored?.signedUrl ?? null).toBeNull();

    downloadMock.mockResolvedValue({ data: null, error: { message: "missing" } });
    uploadMock.mockResolvedValue({ error: null });
    createSignedUrlMock.mockResolvedValue({
      data: null,
      error: { message: "sign failed" },
    });
    vi.stubGlobal("fetch", pdfFetchOk());

    expect(
      await resolveBrowserShippingLabelPdfUrl({
        orderId: ORDER_ID,
        parcelNumber: 1,
        trackingNumber: TRACKING,
        labelStoragePath: PANEL_URL,
        labelUrl: PANEL_URL,
      }),
    ).toBeNull();
  });

  it("8: existing canonical object is reused without another Sendcloud download", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    downloadMock.mockResolvedValue({ data: new Blob(["%PDF"]), error: null });
    createSignedUrlMock.mockResolvedValue({
      data: { signedUrl: SIGNED.replace("token=abc", "token=reuse") },
    });

    const { resolveBrowserShippingLabelPdfUrl } = await import(
      "@/lib/shipping/label-storage.server"
    );

    const resolved = await resolveBrowserShippingLabelPdfUrl({
      orderId: ORDER_ID,
      parcelNumber: 1,
      trackingNumber: TRACKING,
      labelStoragePath: PANEL_URL,
      labelUrl: PANEL_URL,
    });

    expect(resolved?.materialized).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(uploadMock).not.toHaveBeenCalled();
    expect(resolved?.pdfUrl).toContain("supabase.co");
    expect(resolved?.pdfUrl).not.toContain("panel.sendcloud.sc");
  });

  it("9+10: resolve path never announces/creates shipment; tracking/parcel stay caller-owned", async () => {
    const storage = read("lib/shipping/label-storage.server.ts");
    expect(storage).not.toContain("announceSendcloudShipmentV3");
    expect(storage).not.toContain("generateShippingLabel");
    expect(storage).not.toContain("/shipments/announce");
    expect(storage).toContain("downloadShippingLabelDocumentBytes");

    vi.stubGlobal("fetch", pdfFetchOk());
    downloadMock.mockResolvedValue({ data: null, error: { message: "missing" } });
    uploadMock.mockResolvedValue({ error: null });
    createSignedUrlMock.mockResolvedValue({ data: { signedUrl: SIGNED } });

    const { resolveBrowserShippingLabelPdfUrl } = await import(
      "@/lib/shipping/label-storage.server"
    );
    const resolved = await resolveBrowserShippingLabelPdfUrl({
      orderId: ORDER_ID,
      labelRowId: "09b53ec4-0289-445d-bbdb-c7dfbc6f6c42",
      parcelNumber: 1,
      trackingNumber: TRACKING,
      labelStoragePath: PANEL_URL,
      labelUrl: PANEL_URL,
    });

    expect(resolved).not.toBeNull();
    expect(shippingUpdateMock).toHaveBeenCalled();
    const patch = shippingUpdateMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(patch.label_storage_path).toBe(CANONICAL);
    expect(patch.pdf_storage_path).toBe(CANONICAL);
    expect(patch).not.toHaveProperty("tracking_number");
    expect(patch).not.toHaveProperty("provider_parcel_id");
  });

  it("11: resolveBrowserShippingLabelPdfUrl never returns panel URLs", async () => {
    vi.stubGlobal("fetch", pdfFetchOk(Buffer.from("%PDF-1.4 ready")));
    downloadMock.mockResolvedValue({ data: null, error: { message: "missing" } });
    uploadMock.mockResolvedValue({ error: null });
    createSignedUrlMock.mockResolvedValue({ data: { signedUrl: SIGNED } });

    const { resolveBrowserShippingLabelPdfUrl, isSendcloudPanelDocumentUrl } = await import(
      "@/lib/shipping/label-storage.server"
    );

    const resolved = await resolveBrowserShippingLabelPdfUrl({
      orderId: ORDER_ID,
      labelRowId: "09b53ec4-0289-445d-bbdb-c7dfbc6f6c42",
      parcelNumber: 1,
      trackingNumber: TRACKING,
      labelStoragePath: PANEL_URL,
      labelUrl: PANEL_URL,
    });

    expect(resolved).not.toBeNull();
    expect(isSendcloudPanelDocumentUrl(resolved!.pdfUrl)).toBe(false);
    expect(resolved!.pdfUrl).toContain("supabase.co");
    expect(resolved!.materialized).toBe(true);
  });

  it("12: GET labels route uses resolve and never returns panel URLs", () => {
    const route = read("app/api/shipping/labels/route.ts");
    expect(route).toContain("resolveBrowserShippingLabelPdfUrl");
    expect(route).toContain("isSendcloudPanelDocumentUrl");
    expect(route).toContain("503");
    expect(route).not.toMatch(/pdfUrl:\s*storagePath[\s\S]*isHttpStoragePath/);
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
    expect(storage).toContain('Accept: "application/pdf"');
    expect(storage).toContain("sendcloudBasicAuthHeader");
    expect(storage).not.toContain("NEXT_PUBLIC_");
  });
});
