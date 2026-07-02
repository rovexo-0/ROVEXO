import { describe, expect, it } from "vitest";
import { createDefaultHomepageBuilderConfig } from "@/lib/super-admin/mission-control/defaults";
import {
  canvasNodesFromHomepage,
  createDefaultStudioProDocument,
  STUDIO_COMPONENT_LIBRARY,
  STUDIO_TEMPLATE_LIBRARY,
} from "@/lib/platform-visual/studio-pro/defaults";
import {
  createCanvasNodeFromComponent,
  duplicateCanvasNode,
  snapValue,
  syncHomepageFromCanvas,
} from "@/lib/platform-visual/studio-pro/canvas";
import { STUDIO_MODULE_REGISTRY } from "@/lib/platform-visual/studio-pro/registry";
import { searchStudioAssets } from "@/lib/platform-visual/studio-pro/assets";

describe("theme studio pro", () => {
  it("builds canvas nodes from homepage builder", () => {
    const homepage = createDefaultHomepageBuilderConfig();
    const nodes = canvasNodesFromHomepage(homepage);
    expect(nodes.length).toBe(homepage.components.length);
    expect(nodes.some((node) => node.linkedSectionId === "hero-slider")).toBe(true);
  });

  it("creates and duplicates canvas nodes", () => {
    const definition = STUDIO_COMPONENT_LIBRARY[0];
    const node = createCanvasNodeFromComponent(definition, { x: 0, y: 0 }, 0);
    const duplicate = duplicateCanvasNode(node, 1);
    expect(duplicate.x).toBeGreaterThan(node.x);
    expect(duplicate.layer).toBe(1);
  });

  it("syncs homepage from canvas nodes", () => {
    const homepage = createDefaultHomepageBuilderConfig();
    const nodes = canvasNodesFromHomepage(homepage);
    const synced = syncHomepageFromCanvas(homepage, nodes);
    expect(synced.components.length).toBe(homepage.components.length);
  });

  it("exposes component, template, and module libraries", () => {
    expect(STUDIO_COMPONENT_LIBRARY.length).toBeGreaterThan(10);
    expect(STUDIO_TEMPLATE_LIBRARY.some((item) => item.id === "homepage")).toBe(true);
    expect(STUDIO_MODULE_REGISTRY.some((item) => item.id === "mission-control")).toBe(true);
  });

  it("searches asset library", () => {
    const results = searchStudioAssets("hero");
    expect(results.length).toBeGreaterThan(0);
  });

  it("snaps values to grid", () => {
    expect(snapValue(13, 8)).toBe(16);
  });

  it("creates default studio document", () => {
    const doc = createDefaultStudioProDocument(createDefaultHomepageBuilderConfig());
    expect(doc.canvas.nodes.length).toBeGreaterThan(0);
    expect(doc.designTokens.colorMode).toBe("light");
  });
});
