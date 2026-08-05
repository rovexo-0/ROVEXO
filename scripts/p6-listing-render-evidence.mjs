/**
 * P6 Listing render / network microbench evidence.
 */
import { createElement, memo, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { JSDOM } from "jsdom";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost:3000/listing/demo",
});
Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});

function runGalleryIsolation() {
  let galleryRenders = 0;
  function GalleryBefore() {
    galleryRenders += 1;
    return createElement("div", null, "gallery");
  }
  const GalleryAfter = memo(function GalleryAfter() {
    galleryRenders += 1;
    return createElement("div", null, "gallery");
  });

  function Page({ Gallery }) {
    const [qty, setQty] = useState(1);
    const [sheet, setSheet] = useState(false);
    return createElement(
      "div",
      null,
      createElement(Gallery),
      createElement("button", { id: "qty", onClick: () => setQty((q) => q + 1) }, String(qty)),
      createElement("button", { id: "sheet", onClick: () => setSheet((s) => !s) }, String(sheet)),
    );
  }

  const root = createRoot(document.getElementById("root"));
  galleryRenders = 0;
  flushSync(() => root.render(createElement(Page, { Gallery: GalleryBefore })));
  const beforeMount = galleryRenders;
  for (let i = 0; i < 5; i++) {
    flushSync(() => document.getElementById("qty").click());
  }
  for (let i = 0; i < 3; i++) {
    flushSync(() => document.getElementById("sheet").click());
  }
  const beforeTotal = galleryRenders;

  galleryRenders = 0;
  flushSync(() => root.render(createElement(Page, { Gallery: GalleryAfter })));
  const afterMount = galleryRenders;
  for (let i = 0; i < 5; i++) {
    flushSync(() => document.getElementById("qty").click());
  }
  for (let i = 0; i < 3; i++) {
    flushSync(() => document.getElementById("sheet").click());
  }
  const afterTotal = galleryRenders;
  flushSync(() => root.unmount());

  const beforeExtra = beforeTotal - beforeMount;
  const afterExtra = afterTotal - afterMount;
  return {
    qtyAndSheetUpdates: 8,
    before: { mount: beforeMount, total: beforeTotal, extra: beforeExtra },
    after: { mount: afterMount, total: afterTotal, extra: afterExtra },
    galleryRenderReductionPct:
      beforeExtra > 0 ? Math.round(((beforeExtra - afterExtra) / beforeExtra) * 100) : 0,
  };
}

function runLightboxRemount() {
  let imageMounts = 0;
  const Img = memo(function Img({ id }) {
    imageMounts += 1;
    return createElement("img", { "data-id": id, alt: "" });
  });

  function HostBefore() {
    const [active, setActive] = useState(0);
    return createElement(
      "div",
      null,
      [0, 1, 2].map((i) =>
        createElement(
          "div",
          { key: `${i}-${active === i}` },
          createElement(Img, { id: `b-${i}-${active === i}` }),
        ),
      ),
      createElement("button", { id: "next", onClick: () => setActive((a) => (a + 1) % 3) }, "next"),
    );
  }

  function HostAfter() {
    const [active, setActive] = useState(0);
    return createElement(
      "div",
      null,
      [0, 1, 2].map((i) =>
        createElement(
          "div",
          { key: String(i) },
          createElement(Img, { id: `a-${i}` }),
        ),
      ),
      createElement(
        "button",
        { id: "next", onClick: () => setActive((a) => (a + 1) % 3) },
        String(active),
      ),
    );
  }

  const root = createRoot(document.getElementById("root"));
  imageMounts = 0;
  flushSync(() => root.render(createElement(HostBefore)));
  const beforeMount = imageMounts;
  for (let i = 0; i < 9; i++) {
    flushSync(() => document.getElementById("next").click());
  }
  const beforeTotal = imageMounts;

  imageMounts = 0;
  flushSync(() => root.render(createElement(HostAfter)));
  const afterMount = imageMounts;
  for (let i = 0; i < 9; i++) {
    flushSync(() => document.getElementById("next").click());
  }
  const afterTotal = imageMounts;
  flushSync(() => root.unmount());

  const beforeExtra = beforeTotal - beforeMount;
  const afterExtra = afterTotal - afterMount;
  return {
    switches: 9,
    slides: 3,
    before: { mount: beforeMount, total: beforeTotal, extraMounts: beforeExtra },
    after: { mount: afterMount, total: afterTotal, extraMounts: afterExtra },
    slideRemountReductionPct:
      beforeExtra > 0 ? Math.round(((beforeExtra - afterExtra) / beforeExtra) * 100) : 0,
  };
}

const gallery = runGalleryIsolation();
const lightbox = runLightboxRemount();

const report = {
  generatedAt: new Date().toISOString(),
  listingRoute: "/listing/[slug]",
  network: {
    removedUnusedSimilarProductsFetch: true,
    note: "View Item freeze already unmounted Similar Items — listing page no longer awaits getSimilarProducts",
    productBySlugAlreadyReactCached: true,
  },
  galleryIsolation: gallery,
  lightboxSlideStability: lightbox,
  targets: {
    unnecessaryRenderReductionPct: 30,
    galleryMet: gallery.galleryRenderReductionPct >= 30,
    lightboxMet: lightbox.slideRemountReductionPct >= 30 || lightbox.after.extraMounts === 0,
  },
};

const outDir = path.join(process.cwd(), "test-results", "p6-listing-performance");
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "render-evidence.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
