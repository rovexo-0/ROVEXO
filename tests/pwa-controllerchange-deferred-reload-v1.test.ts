import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isUnsafePwaReloadPath,
  resetDeferredSafeServiceWorkerReloadForTests,
  scheduleDeferredSafeServiceWorkerReload,
  shouldReloadForServiceWorkerUpdate,
} from "@/lib/pwa/pwa-update-engine-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function homepageReloadInput(overrides?: {
  getPathname?: () => string;
  reload?: () => void;
  schedule?: (run: () => void) => void;
  getAlreadyReloadedForVersion?: () => string | null;
  getIsFormActive?: () => boolean;
}) {
  return {
    getPathname: overrides?.getPathname ?? (() => "/"),
    nextVersion: "rovexo-static-v17",
    getAlreadyReloadedForVersion: overrides?.getAlreadyReloadedForVersion ?? (() => null),
    getIsFormActive: overrides?.getIsFormActive ?? (() => false),
    reload: overrides?.reload ?? (() => undefined),
    schedule: overrides?.schedule,
  };
}

describe("Phase 3B — controllerchange reload is deferred on first homepage load", () => {
  beforeEach(() => {
    resetDeferredSafeServiceWorkerReloadForTests();
  });

  afterEach(() => {
    resetDeferredSafeServiceWorkerReloadForTests();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("does not call reload synchronously for the initial homepage controllerchange", () => {
    let reloads = 0;
    const queued: Array<() => void> = [];
    const decision = scheduleDeferredSafeServiceWorkerReload(
      homepageReloadInput({
        reload: () => {
          reloads += 1;
        },
        schedule: (run) => {
          queued.push(run);
        },
      }),
    );

    expect(decision).toBe("scheduled");
    expect(reloads).toBe(0);
    expect(queued).toHaveLength(1);
  });

  it("defers reload until the after-paint scheduler fires", () => {
    let reloads = 0;
    const queued: Array<() => void> = [];
    scheduleDeferredSafeServiceWorkerReload(
      homepageReloadInput({
        reload: () => {
          reloads += 1;
        },
        schedule: (run) => {
          queued.push(run);
        },
      }),
    );

    expect(reloads).toBe(0);
    queued[0]!();
    expect(reloads).toBe(1);
  });

  it("reloads at most once for the same controllerchange lifecycle", () => {
    let reloads = 0;
    const queued: Array<() => void> = [];
    const first = scheduleDeferredSafeServiceWorkerReload(
      homepageReloadInput({
        reload: () => {
          reloads += 1;
        },
        schedule: (run) => {
          queued.push(run);
        },
      }),
    );
    const second = scheduleDeferredSafeServiceWorkerReload(
      homepageReloadInput({
        reload: () => {
          reloads += 1;
        },
        schedule: (run) => {
          queued.push(run);
        },
      }),
    );

    expect(first).toBe("scheduled");
    expect(second).toBe("already-armed");
    expect(queued).toHaveLength(1);
    queued[0]!();
    queued[0]!();
    expect(reloads).toBe(1);
  });

  it("does not arm a reload loop from repeated controllerchange events", () => {
    let reloads = 0;
    const queued: Array<() => void> = [];
    for (let i = 0; i < 8; i += 1) {
      scheduleDeferredSafeServiceWorkerReload(
        homepageReloadInput({
          reload: () => {
            reloads += 1;
          },
          schedule: (run) => {
            queued.push(run);
          },
        }),
      );
    }
    expect(queued).toHaveLength(1);
    queued[0]!();
    expect(reloads).toBe(1);
  });

  it("keeps existing unsafe route protections intact", () => {
    expect(isUnsafePwaReloadPath("/checkout")).toBe(true);
    expect(isUnsafePwaReloadPath("/sell")).toBe(true);
    expect(isUnsafePwaReloadPath("/login")).toBe(true);
    expect(isUnsafePwaReloadPath("/register")).toBe(true);
    expect(isUnsafePwaReloadPath("/auth/callback")).toBe(true);
    expect(isUnsafePwaReloadPath("/forgot-password")).toBe(true);
    expect(isUnsafePwaReloadPath("/reset-password")).toBe(true);
    expect(isUnsafePwaReloadPath("/verify")).toBe(true);
    expect(isUnsafePwaReloadPath("/inbox/conversation/abc")).toBe(true);
    expect(isUnsafePwaReloadPath("/orders/abc")).toBe(true);
    expect(isUnsafePwaReloadPath("/")).toBe(false);
    expect(isUnsafePwaReloadPath("/search")).toBe(false);
    expect(isUnsafePwaReloadPath("/orders")).toBe(false);

    let reloads = 0;
    const checkout = scheduleDeferredSafeServiceWorkerReload(
      homepageReloadInput({
        getPathname: () => "/checkout",
        reload: () => {
          reloads += 1;
        },
        schedule: (run) => run(),
      }),
    );
    expect(checkout).toBe("skipped");
    expect(reloads).toBe(0);
    expect(
      shouldReloadForServiceWorkerUpdate({
        pathname: "/sell",
        nextVersion: "rovexo-static-v17",
        alreadyReloadedForVersion: null,
        isFormActive: false,
      }),
    ).toBe(false);
  });

  it("does not fire a scheduled homepage reload if the path becomes unsafe before paint", () => {
    let pathname = "/";
    let reloads = 0;
    const queued: Array<() => void> = [];
    const decision = scheduleDeferredSafeServiceWorkerReload(
      homepageReloadInput({
        getPathname: () => pathname,
        reload: () => {
          reloads += 1;
        },
        schedule: (run) => {
          queued.push(run);
        },
      }),
    );
    expect(decision).toBe("scheduled");
    pathname = "/checkout";
    queued[0]!();
    expect(reloads).toBe(0);
  });

  it("default after-paint scheduler does not reload until double rAF + idle/timeout", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal("requestIdleCallback", undefined);
    vi.useFakeTimers();

    let reloads = 0;
    const decision = scheduleDeferredSafeServiceWorkerReload(
      homepageReloadInput({
        reload: () => {
          reloads += 1;
        },
      }),
    );

    expect(decision).toBe("scheduled");
    expect(reloads).toBe(0);
    expect(frames).toHaveLength(1);
    frames[0]!(0);
    expect(reloads).toBe(0);
    expect(frames).toHaveLength(2);
    frames[1]!(0);
    expect(reloads).toBe(0);
    vi.runAllTimers();
    expect(reloads).toBe(1);
  });

  it("PwaProvider still registers the SW, handles controllerchange, and defers reload", () => {
    const pwa = readSource("components/pwa/PwaProvider.tsx");
    const engine = readSource("lib/pwa/pwa-update-engine-v1.ts");

    expect(pwa).toContain("ROVEXO_SW_SCRIPT");
    expect(pwa).toContain("ROVEXO_SW_SCOPE");
    expect(pwa).toContain("ROVEXO_SW_SKIP_WAITING_MESSAGE");
    expect(pwa).toContain('addEventListener("controllerchange"');
    expect(pwa).toContain("reloadOnceWhenSafe");
    expect(pwa).toContain("scheduleDeferredSafeServiceWorkerReload");
    expect(pwa).toContain("window.location.reload()");
    expect(pwa).toContain("reg.update()");
    expect(pwa).toMatch(
      /const onControllerChange = \(\) => \{\s*reloadOnceWhenSafe\(ROVEXO_SW_CACHE_NAME\);\s*\};/,
    );
    expect(engine).toContain("scheduleDeferredSafeServiceWorkerReload");
    expect(engine).toContain("requestAnimationFrame");
    expect(engine).toContain("already-armed");
  });
});
