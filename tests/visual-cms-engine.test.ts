import { describe, expect, it } from "vitest";
import { createDefaultVisualCmsEngineDocument } from "@/lib/visual-cms-engine/defaults";
import {
  VISUAL_CMS_BUILDERS,
  VISUAL_CMS_CANVAS_ELEMENTS,
  getVisualCmsBuilder,
  registerVisualCmsBuilder,
} from "@/lib/visual-cms-engine/registry";
import {
  buildVisualCmsDashboard,
  canPublishVisualCms,
  canRollbackVisualCms,
  computeVisualCmsAnalytics,
  countEnabledFlags,
  countEnabledItems,
  estimateCanvasNodeCapacity,
  filterEnabledBuilders,
  getComponentLibraryActions,
  getPixelEditorCapabilities,
  getPublishWorkflowStages,
} from "@/lib/visual-cms-engine/timeline";
import { searchStudioAssets } from "@/lib/platform-visual/studio-pro/assets";
import { createCanvasNodeFromComponent, duplicateCanvasNode } from "@/lib/platform-visual/studio-pro/canvas";
import { STUDIO_COMPONENT_LIBRARY } from "@/lib/platform-visual/studio-pro/defaults";

describe("visual cms engine", () => {
  it("creates default document with UK v1 configuration", () => {
    const doc = createDefaultVisualCmsEngineDocument();
    expect(doc.marketplaceVersion).toBe("ROVEXO v1.0");
    expect(doc.primaryCountry).toBe("United Kingdom");
    expect(doc.currency).toBe("GBP");
    expect(doc.builders.length).toBe(25);
    expect(doc.canvasElements.length).toBe(30);
    expect(doc.security.superAdminPublish).toBe(true);
    expect(doc.integrations.themeStudioPro).toBe(true);
  });

  it("registers all visual builders", () => {
    const ids = VISUAL_CMS_BUILDERS.map((builder) => builder.id);
    expect(ids).toContain("homepage-builder");
    expect(ids).toContain("theme-variables-builder");
    expect(ids).toContain("checkout-builder");
    expect(getVisualCmsBuilder("modal-builder")?.label).toBe("Modal Builder");
  });

  it("registers canvas elements for drag-and-drop editor", () => {
    const ids = VISUAL_CMS_CANVAS_ELEMENTS.map((element) => element.id);
    expect(ids).toContain("container");
    expect(ids).toContain("markdown-block");
    expect(ids).toContain("lottie");
  });

  it("supports canvas node create and duplicate", () => {
    const definition = STUDIO_COMPONENT_LIBRARY[0];
    const node = createCanvasNodeFromComponent(definition, { x: 0, y: 0 }, 0);
    const duplicate = duplicateCanvasNode(node, 1);
    expect(duplicate.id).not.toBe(node.id);
    expect(duplicate.layer).toBe(1);
  });

  it("builds dashboard and analytics from config", () => {
    const doc = createDefaultVisualCmsEngineDocument();
    const dashboard = buildVisualCmsDashboard({ config: doc, themeHistory: [] });
    expect(dashboard.designScore).toBeGreaterThan(50);
    expect(dashboard.buildersEnabled).toBe(25);

    const analytics = computeVisualCmsAnalytics({ builders: VISUAL_CMS_BUILDERS, config: doc });
    expect(analytics.layoutBuilders).toBeGreaterThan(0);
    expect(countEnabledItems(doc.builders)).toBe(25);
    expect(countEnabledFlags(doc.performance)).toBeGreaterThan(0);
  });

  it("filters enabled builders and canvas capacity", () => {
    const doc = createDefaultVisualCmsEngineDocument();
    const builders = filterEnabledBuilders(VISUAL_CMS_BUILDERS, doc);
    expect(builders.length).toBe(25);
    expect(estimateCanvasNodeCapacity(doc)).toBeGreaterThan(25);
  });

  it("exposes publish workflow and permissions", () => {
    const doc = createDefaultVisualCmsEngineDocument();
    expect(getPublishWorkflowStages()).toEqual(["draft", "preview", "compare-live", "approve", "published"]);
    expect(canPublishVisualCms(doc)).toBe(true);
    expect(canRollbackVisualCms(doc)).toBe(true);
  });

  it("searches enterprise asset library", () => {
    const results = searchStudioAssets("hero");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((asset) => asset.tags.includes("hero"))).toBe(true);
  });

  it("exposes pixel editor and component library actions", () => {
    const doc = createDefaultVisualCmsEngineDocument();
    const pixel = getPixelEditorCapabilities(doc);
    const actions = getComponentLibraryActions(doc);
    expect(pixel).toContain("width");
    expect(pixel).toContain("backdropBlur");
    expect(actions).toContain("duplicate");
    expect(actions).toContain("templateSave");
  });

  it("registers builder updates", () => {
    const next = registerVisualCmsBuilder({
      id: "homepage-builder",
      label: "Homepage Builder Pro",
      icon: "🏠",
      description: "Updated homepage builder",
      href: "/super-admin/visual-cms",
      category: "layout",
    });
    expect(next.find((builder) => builder.id === "homepage-builder")?.label).toBe("Homepage Builder Pro");
  });
});
