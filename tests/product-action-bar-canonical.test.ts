import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";

import path from "node:path";

import {

  PRODUCT_ACTION_BAR_COPY,

  PRODUCT_ACTION_BAR_LAYOUT,

  PRODUCT_ACTION_BAR_UI_LOCK,

  PRODUCT_ACTION_BAR_VERSION,

  PRODUCT_ACTION_BUTTONS,

  PRODUCT_ACTION_BAR_VISUAL,

} from "@/lib/transaction-hub/product-action-bar";



describe("canonical product action bar", () => {

  it("locks fixed button order", () => {

    expect(PRODUCT_ACTION_BUTTONS.map((b) => b.id)).toEqual([

      "buy_now",

      "add_to_cart",

      "make_offer",

    ]);

    expect(PRODUCT_ACTION_BAR_COPY.buyNow).toBe("Buy Now");

    expect(PRODUCT_ACTION_BAR_COPY.addToCart).toBe("Add to Cart");

    expect(PRODUCT_ACTION_BAR_COPY.makeOffer).toBe("Make Offer");

    expect(PRODUCT_ACTION_BAR_COPY.inCart).toBe("In Cart");

  });



  it("uses responsive grid without fixed button widths", () => {

    const css = readFileSync(

      path.join(process.cwd(), "styles/rovexo/product-detail-v1.css"),

      "utf8",

    );

    expect(css).toContain("repeat(3, minmax(0, 1fr))");

    expect(css).not.toContain("grid-template-columns: 1fr 1fr");

    expect(PRODUCT_ACTION_BAR_LAYOUT.columnCount).toBe(3);

    expect(PRODUCT_ACTION_BAR_LAYOUT.minTouchTargetPx).toBeGreaterThanOrEqual(48);

  });



  it("wires checkout hub and offer composer on product detail", () => {

    const page = readFileSync(

      path.join(process.cwd(), "features/product-detail/ProductDetailPage.tsx"),

      "utf8",

    );

    expect(page).toContain("useProductActionBar");

    expect(page).toContain("/checkout/");

    expect(page).not.toContain("CheckoutHubSheet");

    expect(page).toContain("OfferComposerSheet");

  });



  it("locks FINAL PATCH production UI tokens", () => {

    const css = readFileSync(

      path.join(process.cwd(), "styles/rovexo/product-detail-v1.css"),

      "utf8",

    );

    const bar = readFileSync(

      path.join(process.cwd(), "features/product-detail/ProductActionBarV1.tsx"),

      "utf8",

    );

    const hook = readFileSync(

      path.join(process.cwd(), "features/product-detail/use-product-action-bar.ts"),

      "utf8",

    );



    expect(PRODUCT_ACTION_BAR_UI_LOCK).toBe(true);

    expect(PRODUCT_ACTION_BAR_VERSION).toBe("v1.0-final");

    expect(PRODUCT_ACTION_BAR_VISUAL.backgroundOpacity).toBe(0.92);

    expect(PRODUCT_ACTION_BAR_VISUAL.buttonRadiusPx).toBe(16);

    expect(PRODUCT_ACTION_BAR_VISUAL.buttonHeightPx).toBe(52);

    expect(PRODUCT_ACTION_BAR_VISUAL.gapPx).toBe(8);

    expect(PRODUCT_ACTION_BAR_VISUAL.iconSizePx).toBe(24);

    expect(PRODUCT_ACTION_BAR_VISUAL.fontWeight).toBe(600);

    expect(css).toContain("rgba(255 255 255 / 0.92)");

    expect(css).toContain("blur(18px)");

    expect(css).toContain("rgba(0 0 0 / 0.05)");

    expect(css).toContain("pd-v1-action-bar-enter");

    expect(css).toContain("pd-v1__action-btn--in-cart");

    expect(bar).toContain("PRODUCT_ACTION_BAR_UI_LOCK");
    expect(bar).toContain('data-ui-lock={PRODUCT_ACTION_BAR_UI_LOCK ? "production" : undefined}');

    expect(bar).toContain("RvxLineIcons");
    expect(bar).toContain("pd-v1__action-spinner");
    expect(bar).not.toContain("Loader2");
    expect(bar).not.toContain('from "lucide-react"');

    expect(hook).toContain("triggerCommerceHaptic");

    expect(hook).toContain("flushHubActionQueue");

  });

});
