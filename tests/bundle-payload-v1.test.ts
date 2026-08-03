import { describe, expect, it } from "vitest";
import {
  buildBundlePayload,
  encodeBundleMessageMeta,
  mergeBundleIntoOfferMessage,
  parseBundleMessageMeta,
} from "@/lib/bundle/bundle-payload-v1";
import { encodeCounterOfferMessageMeta } from "@/lib/offers/counter-offer-engine-v1";

describe("bundle-payload-v1", () => {
  it("encodes and parses bundle offer meta", () => {
    const payload = buildBundlePayload({
      sellerId: "11111111-1111-1111-1111-111111111111",
      sellerName: "Store",
      lines: [
        {
          productId: "22222222-2222-2222-2222-222222222222",
          slug: "shoes",
          title: "Shoes",
          imageUrl: "/a.jpg",
          unitPrice: 50,
          quantity: 2,
          maxStock: 5,
        },
        {
          productId: "33333333-3333-3333-3333-333333333333",
          slug: "socks",
          title: "Socks",
          imageUrl: "/b.jpg",
          unitPrice: 10,
          quantity: 1,
          maxStock: 3,
        },
      ],
    });
    expect(payload?.listSubtotal).toBe(110);
    expect(payload?.itemCount).toBe(2);
    expect(payload?.quantitySum).toBe(3);

    const encoded = encodeBundleMessageMeta(payload!, "Please consider");
    const parsed = parseBundleMessageMeta(encoded);
    expect(parsed.bundle?.listSubtotal).toBe(110);
    expect(parsed.userMessage).toBe("Please consider");
  });

  it("preserves bundle when merging counter meta", () => {
    const payload = buildBundlePayload({
      sellerId: "11111111-1111-1111-1111-111111111111",
      sellerName: "Store",
      lines: [
        {
          productId: "22222222-2222-2222-2222-222222222222",
          slug: "shoes",
          title: "Shoes",
          imageUrl: "/a.jpg",
          unitPrice: 50,
          quantity: 1,
          maxStock: 2,
        },
      ],
    });
    const parentId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const existing = encodeBundleMessageMeta(payload!);
    const counter = encodeCounterOfferMessageMeta("seller", parentId, "counter note");
    const merged = mergeBundleIntoOfferMessage(existing, counter);
    expect(merged.startsWith("__RVX_COUNTER__:seller:")).toBe(true);
    const parsed = parseBundleMessageMeta(merged);
    expect(parsed.bundle?.lines[0]?.slug).toBe("shoes");
    expect(parsed.userMessage).toBe("counter note");
  });
});
