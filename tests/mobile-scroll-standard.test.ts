import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  RX_MODAL_BODY,
  RX_MODAL_FULLSCREEN,
  RX_MODAL_PANEL,
  RX_MODAL_SHELL,
  RX_SCROLL_PAGE,
} from "@/lib/mobile-ui/scroll-standard";

describe("mobile scroll standard v1", () => {
  it("exports canonical class tokens", () => {
    expect(RX_SCROLL_PAGE).toBe("rx-scroll-page");
    expect(RX_MODAL_SHELL).toBe("rx-modal-shell");
    expect(RX_MODAL_PANEL).toBe("rx-modal-shell__panel");
    expect(RX_MODAL_FULLSCREEN).toBe("rx-modal-shell-fullscreen");
    expect(RX_MODAL_BODY).toBe("rx-modal-shell-fullscreen__body");
  });

  it("defines scroll CSS with touch momentum and safe-area", () => {
    const css = fs.readFileSync(
      path.join(process.cwd(), "styles/rovexo/mobile-scroll-v1.css"),
      "utf8",
    );
    expect(css).toContain("-webkit-overflow-scrolling: touch");
    expect(css).toContain("env(safe-area-inset-bottom");
    expect(css).toContain("env(safe-area-inset-top");
    expect(css).toContain("overflow-y: auto");
    expect(css).toContain("100dvh");
    expect(css).not.toContain("touch-action: none");
  });

  it("imports mobile-scroll-v1 in rovexo index", () => {
    const index = fs.readFileSync(path.join(process.cwd(), "styles/rovexo/index.css"), "utf8");
    expect(index).toContain("mobile-scroll-v1.css");
  });

  it("does not use ad-hoc body overflow locks in feature overlays", () => {
    const roots = ["features", "components"];
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules") continue;
          walk(full);
          continue;
        }
        if (!/\.(tsx|ts)$/.test(entry.name)) continue;
        if (full.includes("ModalContainer.tsx")) continue;
        const content = fs.readFileSync(full, "utf8");
        if (content.includes("document.body.style.overflow")) {
          offenders.push(full.replace(process.cwd() + path.sep, ""));
        }
      }
    }

    for (const root of roots) walk(path.join(process.cwd(), root));
    expect(offenders).toEqual([]);
  });

  it("does not use ad-hoc fixed inset-0 modal shells in features", () => {
    const roots = ["features", "components"];
    const allowlist = new Set([
      "components/ui/ModalContainer.tsx",
      "components/celebration/CelebrationAnimation.tsx",
    ]);
    const offenders: string[] = [];

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules") continue;
          walk(full);
          continue;
        }
        if (!/\.tsx$/.test(entry.name)) continue;
        const rel = full.replace(process.cwd() + path.sep, "").replace(/\\/g, "/");
        if (allowlist.has(rel)) continue;
        const content = fs.readFileSync(full, "utf8");
        if (/fixed inset-0/.test(content)) {
          offenders.push(rel);
        }
      }
    }

    for (const root of roots) walk(path.join(process.cwd(), root));
    expect(offenders).toEqual([]);
  });
});
