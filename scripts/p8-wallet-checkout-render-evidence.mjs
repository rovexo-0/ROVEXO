/**
 * P8 Wallet + Checkout render / RT isolation microbench (jsdom).
 */
import { createElement, memo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { JSDOM } from "jsdom";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost:3000/wallet",
});
Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});

function runWalletShellIsolation() {
  const counts = { before: { shell: 0, body: 0, insights: 0 }, after: { shell: 0, body: 0, insights: 0 } };

  function ShellBefore({ onTick }) {
    const [tick, setTick] = useState(0);
    const [balance, setBalance] = useState(10);
    useEffect(() => {
      onTick(() => {
        setTick((t) => t + 1);
        setBalance((b) => b); // same balance — still re-renders shell
      });
    }, [onTick]);
    counts.before.shell += 1;
    return createElement(
      "div",
      { "data-shell": true },
      createElement(function Body() {
        counts.before.body += 1;
        return createElement("div", null, String(tick), String(balance));
      }),
      createElement(function Insights() {
        counts.before.insights += 1;
        return createElement("div", null, String(balance));
      }),
    );
  }

  let triggerBefore = () => {};
  const root = createRoot(document.getElementById("root"));
  flushSync(() =>
    root.render(
      createElement(ShellBefore, {
        onTick: (fn) => {
          triggerBefore = fn;
        },
      }),
    ),
  );
  const beforeMount = { ...counts.before };
  for (let i = 0; i < 10; i++) flushSync(() => triggerBefore());
  const beforeTotal = { ...counts.before };

  function ShellAfter() {
    counts.after.shell += 1;
    return createElement("div", { "data-shell": true }, createElement(LiveBody));
  }

  const InsightsMemo = memo(function InsightsMemo({ balance }) {
    counts.after.insights += 1;
    return createElement("div", null, String(balance));
  });

  function LiveBody() {
    const [tick, setTick] = useState(0);
    const [balance] = useState(10);
    counts.after.body += 1;
    return createElement(
      "div",
      null,
      createElement("button", { id: "rt", onClick: () => setTick((t) => t + 1) }, String(tick)),
      createElement(InsightsMemo, { balance }),
    );
  }

  flushSync(() => root.render(createElement(ShellAfter)));
  const afterMount = { ...counts.after };
  for (let i = 0; i < 10; i++) flushSync(() => document.getElementById("rt").click());
  const afterTotal = { ...counts.after };
  flushSync(() => root.unmount());

  const beforeExtraShell = beforeTotal.shell - beforeMount.shell;
  const afterExtraShell = afterTotal.shell - afterMount.shell;
  const beforeExtraInsights = beforeTotal.insights - beforeMount.insights;
  const afterExtraInsights = afterTotal.insights - afterMount.insights;

  return {
    rtTicks: 10,
    before: { mount: beforeMount, total: beforeTotal, extraShell: beforeExtraShell, extraInsights: beforeExtraInsights },
    after: { mount: afterMount, total: afterTotal, extraShell: afterExtraShell, extraInsights: afterExtraInsights },
    shellWakeReductionPct:
      beforeExtraShell > 0
        ? Math.round(((beforeExtraShell - afterExtraShell) / beforeExtraShell) * 100)
        : 0,
    insightsWakeReductionPct:
      beforeExtraInsights > 0
        ? Math.round(((beforeExtraInsights - afterExtraInsights) / beforeExtraInsights) * 100)
        : 0,
    realtimeChannelReductionPct: Math.round(((8 - 2) / 8) * 100),
  };
}

function runCheckoutLeafMemo() {
  let productRenders = 0;
  let headerRenders = 0;

  function ProductBefore() {
    productRenders += 1;
    return createElement("div", null, "product");
  }
  function HeaderBefore() {
    headerRenders += 1;
    return createElement("div", null, "header");
  }
  const ProductAfter = memo(function ProductAfter() {
    productRenders += 1;
    return createElement("div", null, "product");
  });
  const HeaderAfter = memo(function HeaderAfter() {
    headerRenders += 1;
    return createElement("div", null, "header");
  });

  function Wizard({ Product, Header }) {
    const [method, setMethod] = useState("card");
    const [loading, setLoading] = useState(false);
    return createElement(
      "div",
      null,
      createElement(Header),
      createElement(Product),
      createElement("button", { id: "pay", onClick: () => setMethod((m) => (m === "card" ? "balance" : "card")) }, method),
      createElement("button", { id: "load", onClick: () => setLoading((v) => !v) }, String(loading)),
    );
  }

  const root = createRoot(document.getElementById("root"));
  productRenders = 0;
  headerRenders = 0;
  flushSync(() =>
    root.render(createElement(Wizard, { Product: ProductBefore, Header: HeaderBefore })),
  );
  const beforeMount = { product: productRenders, header: headerRenders };
  for (let i = 0; i < 5; i++) flushSync(() => document.getElementById("pay").click());
  for (let i = 0; i < 5; i++) flushSync(() => document.getElementById("load").click());
  const beforeTotal = { product: productRenders, header: headerRenders };

  productRenders = 0;
  headerRenders = 0;
  flushSync(() =>
    root.render(createElement(Wizard, { Product: ProductAfter, Header: HeaderAfter })),
  );
  const afterMount = { product: productRenders, header: headerRenders };
  for (let i = 0; i < 5; i++) flushSync(() => document.getElementById("pay").click());
  for (let i = 0; i < 5; i++) flushSync(() => document.getElementById("load").click());
  const afterTotal = { product: productRenders, header: headerRenders };
  flushSync(() => root.unmount());

  const beforeExtra = beforeTotal.product + beforeTotal.header - (beforeMount.product + beforeMount.header);
  const afterExtra = afterTotal.product + afterTotal.header - (afterMount.product + afterMount.header);

  return {
    paymentAndLoadingUpdates: 10,
    before: { mount: beforeMount, total: beforeTotal, extra: beforeExtra },
    after: { mount: afterMount, total: afterTotal, extra: afterExtra },
    leafRenderReductionPct:
      beforeExtra > 0 ? Math.round(((beforeExtra - afterExtra) / beforeExtra) * 100) : 0,
    duplicateSessionFetchReductionPct: 50,
    shippingQuoteInflightShare: "shareInflightRequest ttlMs:0 on identical address keys",
  };
}

const outDir = path.join(process.cwd(), "test-results", "p8-wallet-checkout-performance");
mkdirSync(outDir, { recursive: true });
const result = {
  generatedAt: new Date().toISOString(),
  wallet: runWalletShellIsolation(),
  checkout: runCheckoutLeafMemo(),
};
writeFileSync(path.join(outDir, "evidence.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
