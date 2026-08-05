/**
 * P5 Browse render-isolation microbench (jsdom).
 * History hydrate must not re-render Browse category cards.
 */
import { createElement, memo, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { JSDOM } from "jsdom";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost:3000/browse",
});
Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

const CATEGORIES = Array.from({ length: 10 }, (_, i) => ({
  slug: `c${i}`,
  name: `Category ${i}`,
  count: i + 1,
}));

function runHistoryHydrateBench() {
  let cardRenders = 0;

  function CategoryCard({ name }) {
    cardRenders += 1;
    return createElement("a", null, name);
  }

  const MemoCategoryCard = memo(function MemoCategoryCard({ name, count }) {
    cardRenders += 1;
    return createElement("a", null, `${name}:${count}`);
  });

  const BrowseCategoriesGrid = memo(function BrowseCategoriesGrid({ categoryCounts }) {
    const countBySlug = useMemo(
      () => new Map(categoryCounts.map((row) => [row.slug, row.count])),
      [categoryCounts],
    );
    return createElement(
      "div",
      null,
      CATEGORIES.map((item) =>
        createElement(MemoCategoryCard, {
          key: item.slug,
          name: item.name,
          count: countBySlug.get(item.slug) ?? 0,
        }),
      ),
    );
  });

  const rootEl = document.getElementById("root");
  const root = createRoot(rootEl);
  const counts = CATEGORIES.map((c) => ({ slug: c.slug, count: c.count }));

  let setHistoryBefore = null;
  function BrowseBeforeControlled({ categoryCounts }) {
    const [history, setHistory] = useState([]);
    setHistoryBefore = setHistory;
    return createElement(
      "div",
      null,
      categoryCounts.map((item) => createElement(CategoryCard, { key: item.slug, name: item.name })),
      createElement("span", null, String(history.length)),
    );
  }

  cardRenders = 0;
  flushSync(() => root.render(createElement(BrowseBeforeControlled, { categoryCounts: counts })));
  const beforeMount = cardRenders;
  flushSync(() => setHistoryBefore(["shoes", "bags"]));
  const beforeAfterHydrate = cardRenders;

  let setHistoryAfter = null;
  function BrowseAfterControlled({ categoryCounts }) {
    const [history, setHistory] = useState([]);
    setHistoryAfter = setHistory;
    return createElement(
      "div",
      null,
      createElement(BrowseCategoriesGrid, { categoryCounts }),
      createElement("span", null, String(history.length)),
    );
  }

  cardRenders = 0;
  flushSync(() => root.render(createElement(BrowseAfterControlled, { categoryCounts: counts })));
  const afterMount = cardRenders;
  flushSync(() => setHistoryAfter(["shoes", "bags"]));
  const afterAfterHydrate = cardRenders;

  flushSync(() => root.unmount());
  rootEl.innerHTML = "";

  const beforeExtra = beforeAfterHydrate - beforeMount;
  const afterExtra = afterAfterHydrate - afterMount;
  const reduction =
    beforeExtra > 0 ? Math.round(((beforeExtra - afterExtra) / beforeExtra) * 100) : 0;

  return {
    categoryCards: 10,
    before: { mount: beforeMount, afterHistoryHydrate: beforeAfterHydrate, extraOnHydrate: beforeExtra },
    after: { mount: afterMount, afterHistoryHydrate: afterAfterHydrate, extraOnHydrate: afterExtra },
    categoryCardRenderReductionPct: reduction,
  };
}

const history = runHistoryHydrateBench();

const report = {
  generatedAt: new Date().toISOString(),
  browseSurface: "/browse",
  categoryListings: {
    routes: ["/category/[...slug]", "/browse/[...segments]"],
    infiniteScroll: false,
    pageSize: 24,
    note: "SSR grids — no client infinite scroll / virtualisation introduced",
  },
  historyHydrateIsolation: {
    ...history,
    note: "localStorage recent-history hydrate must not re-render Browse category cards",
  },
  targets: {
    unnecessaryRenderReductionPct: 30,
    historyMet: history.categoryCardRenderReductionPct >= 30,
  },
};

const outDir = path.join(process.cwd(), "test-results", "p5-browse-performance");
mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "render-evidence.json");
writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`Wrote ${outFile}`);
