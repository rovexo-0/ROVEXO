/**
 * Client-level: V3 compat lookup targets official endpoint with locked payload.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

describe("lookupSendcloudV3CompatShippingOption29631 request targeting", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("POSTs exact payload to https://panel.sendcloud.sc/api/v3/compat/shipping-options", async () => {
    process.env.SENDCLOUD_PUBLIC_KEY = "pub-test";
    process.env.SENDCLOUD_SECRET_KEY = "sec-test";
    delete process.env.SENDCLOUD_V3_BASE_URL;

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              shipping_method_id: 29631,
              shipping_option_code: "royal_mail:tracked_48:large_letter",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { lookupSendcloudV3CompatShippingOption29631 } = await import(
      "@/lib/shipping/sendcloud/client"
    );
    const result = await lookupSendcloudV3CompatShippingOption29631();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://panel.sendcloud.sc/api/v3/compat/shipping-options");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ shipping_method_ids: [29631] });
    expect(result.requestBody).toEqual({ shipping_method_ids: [29631] });
    expect(result.mapping.shippingOptionCode).toBe("royal_mail:tracked_48:large_letter");
    expect(result.mapping.rawMappingConfirmed).toBe(true);
    expect(JSON.stringify(result.mapping).toLowerCase()).not.toContain("authorization");
    expect(JSON.stringify(result.mapping).toLowerCase()).not.toContain("basic");
  });
});
