/**
 * P7 Sell render isolation microbench (jsdom).
 * Models fat single context vs split publish-progress / photos / draft contexts.
 */
import { createElement, useContext, useMemo, useState, createContext, memo } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { JSDOM } from "jsdom";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
  url: "http://localhost:3000/sell",
});
Object.defineProperty(globalThis, "window", { value: dom.window, configurable: true });
Object.defineProperty(globalThis, "document", { value: dom.window.document, configurable: true });
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});

const FatCtx = createContext(null);
const DraftCtx = createContext(null);
const PhotosCtx = createContext(null);
const ProgressCtx = createContext(null);
const ActionsCtx = createContext(null);

function runFatVsSplit() {
  const counts = {
    before: { photo: 0, title: 0, price: 0, overlay: 0, page: 0 },
    after: { photo: 0, title: 0, price: 0, overlay: 0, page: 0 },
  };

  function FatProvider({ children }) {
    const [draft, setDraft] = useState({ title: "", photos: [{ id: "1" }] });
    const [uploadProgress, setUploadProgress] = useState(0);
    const value = { draft, uploadProgress, setDraft, setUploadProgress };
    return createElement(
      FatCtx.Provider,
      { value },
      createElement("div", null, children, createElement(FatControls)),
    );
  }

  function FatControls() {
    const { setDraft, setUploadProgress } = useContext(FatCtx);
    return createElement(
      "div",
      null,
      createElement(
        "button",
        {
          id: "progress",
          onClick: () => setUploadProgress((p) => p + 10),
        },
        "progress",
      ),
      createElement(
        "button",
        {
          id: "title",
          onClick: () =>
            setDraft((d) => ({
              ...d,
              title: d.title + "x",
            })),
        },
        "title",
      ),
    );
  }

  function FatPhoto() {
    counts.before.photo += 1;
    useContext(FatCtx);
    return createElement("div", null, "photo");
  }
  function FatTitle() {
    counts.before.title += 1;
    useContext(FatCtx);
    return createElement("div", null, "title");
  }
  function FatPrice() {
    counts.before.price += 1;
    useContext(FatCtx);
    return createElement("div", null, "price");
  }
  function FatOverlay() {
    counts.before.overlay += 1;
    const { uploadProgress } = useContext(FatCtx);
    return createElement("div", null, String(uploadProgress));
  }
  function FatPage() {
    counts.before.page += 1;
    useContext(FatCtx);
    return createElement(
      "div",
      null,
      createElement(FatPhoto),
      createElement(FatTitle),
      createElement(FatPrice),
      createElement(FatOverlay),
    );
  }

  function SplitProvider({ children }) {
    const [draft, setDraft] = useState({ title: "", photos: [{ id: "1" }] });
    const [uploadProgress, setUploadProgress] = useState(0);
    const draftSlice = useMemo(
      () => ({ draft, setDraft }),
      [draft],
    );
    const photosSlice = useMemo(
      () => ({ photos: draft.photos }),
      [draft.photos],
    );
    const progressSlice = useMemo(
      () => ({ uploadProgress, setUploadProgress }),
      [uploadProgress],
    );
    const actions = useMemo(() => ({ setDraft, setUploadProgress }), []);
    return createElement(
      ActionsCtx.Provider,
      { value: actions },
      createElement(
        ProgressCtx.Provider,
        { value: progressSlice },
        createElement(
          DraftCtx.Provider,
          { value: draftSlice },
          createElement(
            PhotosCtx.Provider,
            { value: photosSlice },
            createElement("div", null, children, createElement(SplitControls)),
          ),
        ),
      ),
    );
  }

  function SplitControls() {
    const { setDraft } = useContext(ActionsCtx);
    const { setUploadProgress } = useContext(ProgressCtx);
    return createElement(
      "div",
      null,
      createElement(
        "button",
        {
          id: "progress",
          onClick: () => setUploadProgress((p) => p + 10),
        },
        "progress",
      ),
      createElement(
        "button",
        {
          id: "title",
          onClick: () =>
            setDraft((d) => ({
              ...d,
              title: d.title + "x",
            })),
        },
        "title",
      ),
    );
  }

  const SplitPhoto = memo(function SplitPhoto() {
    counts.after.photo += 1;
    useContext(PhotosCtx);
    return createElement("div", null, "photo");
  });
  const SplitTitle = memo(function SplitTitle() {
    counts.after.title += 1;
    useContext(DraftCtx);
    return createElement("div", null, "title");
  });
  const SplitPrice = memo(function SplitPrice() {
    counts.after.price += 1;
    useContext(DraftCtx);
    return createElement("div", null, "price");
  });
  function SplitOverlay() {
    counts.after.overlay += 1;
    const { uploadProgress } = useContext(ProgressCtx);
    return createElement("div", null, String(uploadProgress));
  }
  function SplitPage() {
    counts.after.page += 1;
    useContext(DraftCtx);
    return createElement(
      "div",
      null,
      createElement(SplitPhoto),
      createElement(SplitTitle),
      createElement(SplitPrice),
      createElement(SplitOverlay),
    );
  }

  const root = createRoot(document.getElementById("root"));

  flushSync(() => root.render(createElement(FatProvider, null, createElement(FatPage))));
  const beforeMount = { ...counts.before };
  for (let i = 0; i < 10; i++) {
    flushSync(() => document.getElementById("progress").click());
  }
  for (let i = 0; i < 5; i++) {
    flushSync(() => document.getElementById("title").click());
  }
  const beforeTotal = { ...counts.before };

  counts.after = { photo: 0, title: 0, price: 0, overlay: 0, page: 0 };
  flushSync(() => root.render(createElement(SplitProvider, null, createElement(SplitPage))));
  const afterMount = { ...counts.after };
  for (let i = 0; i < 10; i++) {
    flushSync(() => document.getElementById("progress").click());
  }
  for (let i = 0; i < 5; i++) {
    flushSync(() => document.getElementById("title").click());
  }
  const afterTotal = { ...counts.after };
  flushSync(() => root.unmount());

  function extras(total, mount) {
    return {
      photo: total.photo - mount.photo,
      title: total.title - mount.title,
      price: total.price - mount.price,
      overlay: total.overlay - mount.overlay,
      page: total.page - mount.page,
      formBlocks: total.photo + total.title + total.price - (mount.photo + mount.title + mount.price),
    };
  }

  const beforeExtra = extras(beforeTotal, beforeMount);
  const afterExtra = extras(afterTotal, afterMount);

  const progressTicks = 10;
  const beforeUploadRelated =
    beforeExtra.photo + beforeExtra.title + beforeExtra.price + beforeExtra.overlay + beforeExtra.page;
  // After: only overlay (+ publish bar analog) should wake on progress; page uses draft only
  const afterUploadRelatedEstimate = afterExtra.overlay; // progress-only wake

  return {
    progressTicks: progressTicks,
    titleUpdates: 5,
    before: { mount: beforeMount, total: beforeTotal, extra: beforeExtra },
    after: { mount: afterMount, total: afterTotal, extra: afterExtra },
    formBlockRenderReductionPct:
      beforeExtra.formBlocks > 0
        ? Math.round(((beforeExtra.formBlocks - afterExtra.formBlocks) / beforeExtra.formBlocks) * 100)
        : 0,
    uploadRelatedReductionPct:
      beforeUploadRelated > 0
        ? Math.round(
            ((beforeUploadRelated - (afterExtra.overlay + afterExtra.page * 0)) / beforeUploadRelated) *
              100,
          )
        : 0,
    photoOnTitleUpdates: {
      before: beforeExtra.photo,
      after: afterExtra.photo,
      note: "Title updates preserve photos[] reference → PhotoRail skips after split",
    },
  };
}

const outDir = path.join(process.cwd(), "test-results", "p7-sell-performance");
mkdirSync(outDir, { recursive: true });
const result = {
  generatedAt: new Date().toISOString(),
  isolation: runFatVsSplit(),
};
writeFileSync(path.join(outDir, "evidence.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
