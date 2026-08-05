/**
 * P4 render-isolation microbench (jsdom).
 * Mirrors the exact anti-patterns fixed in P4.
 */
import { createElement, memo, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { JSDOM } from "jsdom";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost:3000/",
});
Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

function runToastBench() {
  let childRenders = 0;
  // Non-memo leaf — represents a typical app subtree under ToastProvider.
  function AppChild() {
    childRenders += 1;
    return createElement("span", null, "app");
  }

  // BEFORE: toast state lives in the same component that renders children JSX
  function ToastBefore() {
    const [toasts, setToasts] = useState([]);
    return createElement(
      "div",
      null,
      createElement(AppChild),
      createElement(
        "button",
        {
          id: "push",
          onClick: () => setToasts((t) => [...t, t.length]),
        },
        `toasts:${toasts.length}`,
      ),
    );
  }

  const ToastTree = memo(function ToastTree({ children }) {
    return children;
  });

  // AFTER: toast state in shell; children arrive as props from a parent that does not own toast state
  function ToastShell({ children }) {
    const [toasts, setToasts] = useState([]);
    return createElement(
      "div",
      null,
      createElement(ToastTree, null, children),
      createElement(
        "button",
        {
          id: "push",
          onClick: () => setToasts((t) => [...t, t.length]),
        },
        `toasts:${toasts.length}`,
      ),
    );
  }

  function ToastAfter() {
    return createElement(ToastShell, null, createElement(AppChild));
  }

  const rootEl = document.getElementById("root");
  const root = createRoot(rootEl);

  childRenders = 0;
  flushSync(() => root.render(createElement(ToastBefore)));
  const beforeMount = childRenders;
  for (let i = 0; i < 5; i++) {
    flushSync(() => {
      document.getElementById("push").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
  }
  const beforeTotal = childRenders;

  childRenders = 0;
  flushSync(() => root.render(createElement(ToastAfter)));
  const afterMount = childRenders;
  for (let i = 0; i < 5; i++) {
    flushSync(() => {
      document.getElementById("push").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
  }
  const afterTotal = childRenders;

  flushSync(() => root.unmount());
  rootEl.innerHTML = "";

  const beforeExtra = beforeTotal - beforeMount;
  const afterExtra = afterTotal - afterMount;
  const reduction =
    beforeExtra > 0 ? Math.round(((beforeExtra - afterExtra) / beforeExtra) * 100) : 0;

  return {
    pushes: 5,
    before: { mount: beforeMount, total: beforeTotal, extraOnPush: beforeExtra },
    after: { mount: afterMount, total: afterTotal, extraOnPush: afterExtra },
    childRenderReductionPct: reduction,
  };
}

function runSearchHoverBench() {
  let cardRenders = 0;

  const SearchCard = memo(function SearchCard({ isActive, onHover, hoverNavIndex, onHoverIndex }) {
    cardRenders += 1;
    const enter =
      onHoverIndex != null && hoverNavIndex != null
        ? () => onHoverIndex(hoverNavIndex)
        : onHover;
    return createElement(
      "li",
      { "data-active": isActive ? "1" : "0", onMouseEnter: enter },
      `card`,
    );
  });

  function ListBefore({ activeIndex, onHoverIndex }) {
    return createElement(
      "ul",
      null,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) =>
        createElement(SearchCard, {
          key: i,
          isActive: activeIndex === i,
          // Anti-pattern fixed in P4 — new function every parent render
          onHover: () => onHoverIndex(i),
        }),
      ),
    );
  }

  function ListAfter({ activeIndex, onHoverIndex }) {
    return createElement(
      "ul",
      null,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) =>
        createElement(SearchCard, {
          key: i,
          isActive: activeIndex === i,
          hoverNavIndex: i,
          onHoverIndex,
        }),
      ),
    );
  }

  function Host({ mode }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const onHoverIndex = useCallback((i) => setActiveIndex(i), []);
    return createElement(
      "div",
      null,
      mode === "before"
        ? createElement(ListBefore, { activeIndex, onHoverIndex })
        : createElement(ListAfter, { activeIndex, onHoverIndex }),
      createElement(
        "button",
        {
          id: "next",
          onClick: () => setActiveIndex((i) => (i + 1) % 10),
        },
        "next",
      ),
    );
  }

  const rootEl = document.getElementById("root");
  const root = createRoot(rootEl);

  cardRenders = 0;
  flushSync(() => root.render(createElement(Host, { mode: "before" })));
  const beforeMount = cardRenders;
  for (let i = 0; i < 10; i++) {
    flushSync(() => {
      document.getElementById("next").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
  }
  const beforeTotal = cardRenders;

  cardRenders = 0;
  flushSync(() => root.render(createElement(Host, { mode: "after" })));
  const afterMount = cardRenders;
  for (let i = 0; i < 10; i++) {
    flushSync(() => {
      document.getElementById("next").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
  }
  const afterTotal = cardRenders;

  flushSync(() => root.unmount());
  rootEl.innerHTML = "";

  const beforeExtra = beforeTotal - beforeMount;
  const afterExtra = afterTotal - afterMount;
  const reduction =
    beforeExtra > 0 ? Math.round(((beforeExtra - afterExtra) / beforeExtra) * 100) : 0;

  return {
    cards: 10,
    activeIndexSteps: 10,
    before: {
      mount: beforeMount,
      total: beforeTotal,
      extraOnSteps: beforeExtra,
      rendersPerStep: beforeExtra / 10,
    },
    after: {
      mount: afterMount,
      total: afterTotal,
      extraOnSteps: afterExtra,
      rendersPerStep: afterExtra / 10,
    },
    cardRenderReductionPct: reduction,
  };
}

function runBadgeBailBench() {
  let consumerRenders = 0;

  function Consumer({ badges }) {
    consumerRenders += 1;
    return createElement("span", null, String(badges.notifications));
  }

  function ProviderBefore() {
    const [badges, setBadges] = useState({ notifications: 1, messages: 0 });
    return createElement(
      "div",
      null,
      createElement(Consumer, { badges }),
      createElement(
        "button",
        {
          id: "poll",
          // Always allocates a new object — forces consumer render
          onClick: () => setBadges({ notifications: 1, messages: 0 }),
        },
        "poll",
      ),
    );
  }

  function ProviderAfter() {
    const [badges, setBadges] = useState({ notifications: 1, messages: 0 });
    return createElement(
      "div",
      null,
      createElement(Consumer, { badges }),
      createElement(
        "button",
        {
          id: "poll",
          onClick: () =>
            setBadges((prev) => {
              const next = { notifications: 1, messages: 0 };
              if (prev.notifications === next.notifications && prev.messages === next.messages) {
                return prev;
              }
              return next;
            }),
        },
        "poll",
      ),
    );
  }

  const rootEl = document.getElementById("root");
  const root = createRoot(rootEl);

  consumerRenders = 0;
  flushSync(() => root.render(createElement(ProviderBefore)));
  const beforeMount = consumerRenders;
  for (let i = 0; i < 10; i++) {
    flushSync(() => {
      document.getElementById("poll").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
  }
  const beforeTotal = consumerRenders;

  consumerRenders = 0;
  flushSync(() => root.render(createElement(ProviderAfter)));
  const afterMount = consumerRenders;
  for (let i = 0; i < 10; i++) {
    flushSync(() => {
      document.getElementById("poll").dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    });
  }
  const afterTotal = consumerRenders;

  flushSync(() => root.unmount());
  rootEl.innerHTML = "";

  const beforeExtra = beforeTotal - beforeMount;
  const afterExtra = afterTotal - afterMount;
  const reduction =
    beforeExtra > 0 ? Math.round(((beforeExtra - afterExtra) / beforeExtra) * 100) : 0;

  return {
    polls: 10,
    before: { mount: beforeMount, total: beforeTotal, extraOnPoll: beforeExtra },
    after: { mount: afterMount, total: afterTotal, extraOnPoll: afterExtra },
    consumerRenderReductionPct: reduction,
  };
}

const toast = runToastBench();
const search = runSearchHoverBench();
const badges = runBadgeBailBench();

const report = {
  generatedAt: new Date().toISOString(),
  toastIsolation: {
    ...toast,
    note: "ToastTree memo: non-memo app children must not re-render on toast push",
  },
  searchHoverMemo: {
    ...search,
    note: "Stable hoverNavIndex + onHoverIndex vs inline onHover={() => ...}",
  },
  badgeBail: {
    ...badges,
    note: "applyState returns previous badge object when counts unchanged",
  },
  targets: {
    unnecessaryRenderReductionPct: 30,
    toastMet: toast.childRenderReductionPct >= 30,
    searchMet: search.cardRenderReductionPct >= 30,
    badgeMet: badges.consumerRenderReductionPct >= 30,
  },
};

const outDir = path.join(process.cwd(), "test-results", "p4-react-rendering");
mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "render-evidence.json");
writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`Wrote ${outFile}`);
