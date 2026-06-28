import { describe, expect, it } from "vitest";
import { getDiscoveredModuleV2 } from "@/lib/enterprise-module-registry-v2/discovery";
import { getEnterpriseModuleDescriptor } from "@/lib/enterprise-architecture/registry";
import { generateHomepageAiSuggestions, generateBannerContent, optimizeLayoutScore, suggestSectionsForGoal } from "@/lib/homepage-builder-engine/ai";
import { buildAssetReferences, getIntegrationEndpoints, linkAssetToSection } from "@/lib/homepage-builder-engine/assets";
import { canPerformHomepageAction, createHomepageAuditEntry, requiresMfaForHomepage } from "@/lib/homepage-builder-engine/audit";
import { createComponent, createDefaultComponentLibrary, registerComponent } from "@/lib/homepage-builder-engine/components";
import { HOMEPAGE_BUILDER_MODULE_DESCRIPTOR } from "@/lib/homepage-builder-engine/descriptor";
import {
  autosaveSections,
  copySection,
  createEditorState,
  deleteSection,
  duplicateSection,
  hideSection,
  lockSection,
  moveSection,
  pasteSection,
  redoEditor,
  reorderSections,
  showSection,
  undoEditor,
  unlockSection,
} from "@/lib/homepage-builder-engine/editor";
import {
  buildHomepageDashboard,
  createDefaultHomepageBuilderSettings,
  createDefaultHomepageDocument,
  findSection,
  upsertSection,
} from "@/lib/homepage-builder-engine/engine";
import { computeHomepageBuilderHealth } from "@/lib/homepage-builder-engine/health";
import {
  buildPreviewSections,
  isDarkPreviewMode,
  previewDimensions,
  resolvePreviewDevice,
} from "@/lib/homepage-builder-engine/preview";
import { preparePreviewDocument, preparePublishDocument, runPublishPipeline, validateHomepageDocument } from "@/lib/homepage-builder-engine/publish";
import {
  HOMEPAGE_BUILDER_API,
  HOMEPAGE_BUILDER_ROUTES,
  HOMEPAGE_COMPONENT_TYPES,
  HOMEPAGE_PREVIEW_MODES,
  HOMEPAGE_SECTION_TYPES,
} from "@/lib/homepage-builder-engine/registry";
import {
  createDefaultHomepageSections,
  createSection,
  filterVisibleSections,
  getSectionLabel,
  isValidSectionType,
} from "@/lib/homepage-builder-engine/sections";
import { validateHomepageBuilderReadiness } from "@/lib/homepage-builder-engine/reader";
import {
  bumpHomepageVersion,
  cloneHomepageDocument,
  compareHomepageDocuments,
  createVersionEntry,
  detectPendingPublish,
  duplicateHomepageDocument,
  exportHomepageBundle,
  importHomepageBundle,
} from "@/lib/homepage-builder-engine/versioning";

const sampleDoc = createDefaultHomepageDocument();

describe("homepage builder descriptor", () => {
  it("registers module id", () => {
    expect(HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.id).toBe("homepage-builder-engine");
  });

  it("auto registers", () => {
    expect(HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.autoRegister).toBe(true);
  });

  it("uses homepage builder base href", () => {
    expect(HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.baseHref).toBe("/super-admin/homepage-builder");
  });

  it("includes seven feature flags", () => {
    expect(HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.featureFlags.length).toBe(7);
  });

  it("requires MFA for publish", () => {
    expect(HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.permissions.find((p) => p.action === "publish-config")?.requiresMfa).toBe(true);
  });

  it("requires MFA for rollback", () => {
    expect(HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.permissions.find((p) => p.action === "rollback-config")?.requiresMfa).toBe(true);
  });

  it("requires MFA for delete", () => {
    expect(HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.permissions.find((p) => p.action === "delete")?.requiresMfa).toBe(true);
  });

  it("is in enterprise architecture registry", () => {
    expect(getEnterpriseModuleDescriptor("homepage-builder-engine")).toBeDefined();
  });

  it("is discovered by registry v2", () => {
    expect(getDiscoveredModuleV2("homepage-builder-engine")).toBeDefined();
  });

  it("depends on visual cms", () => {
    expect(HOMEPAGE_BUILDER_MODULE_DESCRIPTOR.relatedModules).toContain("visual-cms");
  });
});

describe("homepage routes and registry", () => {
  it("registers seven admin routes", () => {
    expect(HOMEPAGE_BUILDER_ROUTES.length).toBe(7);
  });

  it("includes editor route", () => {
    expect(HOMEPAGE_BUILDER_ROUTES.some((r) => r.id === "editor")).toBe(true);
  });

  it("registers thirty-four section types", () => {
    expect(HOMEPAGE_SECTION_TYPES.length).toBe(34);
    expect(HOMEPAGE_SECTION_TYPES).toContain("hero-banner");
    expect(HOMEPAGE_SECTION_TYPES).toContain("faq");
  });

  it("registers twenty component types", () => {
    expect(HOMEPAGE_COMPONENT_TYPES.length).toBe(20);
  });

  it("registers eight preview modes", () => {
    expect(HOMEPAGE_PREVIEW_MODES.length).toBe(8);
  });

  it("exposes snapshot API", () => {
    expect(HOMEPAGE_BUILDER_API.snapshot).toBe("/api/super-admin/homepage-builder");
  });

  it("exposes lifecycle API endpoints", () => {
    expect(HOMEPAGE_BUILDER_API.publish).toContain("/publish");
    expect(HOMEPAGE_BUILDER_API.rollback).toContain("/rollback");
    expect(HOMEPAGE_BUILDER_API.compare).toContain("/compare");
    expect(HOMEPAGE_BUILDER_API.assets).toContain("/assets");
  });
});

describe("homepage sections", () => {
  it("creates default sections", () => {
    expect(createDefaultHomepageSections().length).toBe(34);
  });

  it("creates section by type", () => {
    expect(createSection("hero-banner", 0).label).toBe("Hero Banner");
  });

  it("validates section types", () => {
    expect(isValidSectionType("trending")).toBe(true);
    expect(isValidSectionType("invalid")).toBe(false);
  });

  it("gets section label", () => {
    expect(getSectionLabel("ai-picks")).toBe("AI Picks");
  });

  it("filters visible desktop sections", () => {
    const sections = createDefaultHomepageSections();
    expect(filterVisibleSections(sections, "desktop").length).toBeGreaterThan(0);
  });

  it("hides disabled sections", () => {
    const sections = createDefaultHomepageSections().map((s) => ({ ...s, hidden: true }));
    expect(filterVisibleSections(sections, "desktop").length).toBe(0);
  });
});

describe("visual editor", () => {
  it("creates editor state", () => {
    expect(createEditorState(sampleDoc.sections).sections.length).toBe(34);
  });

  it("reorders sections", () => {
    const reordered = reorderSections(sampleDoc.sections, 0, 2);
    expect(reordered[2]?.id).toBe(sampleDoc.sections[0]?.id);
  });

  it("duplicates section", () => {
    const dup = duplicateSection(sampleDoc.sections[0]!);
    expect(dup.id).not.toBe(sampleDoc.sections[0]!.id);
  });

  it("moves section in editor", () => {
    const state = createEditorState(sampleDoc.sections);
    const id = state.sections[5]!.id;
    const moved = moveSection(state, id, 0);
    expect(moved.sections[0]?.id).toBe(id);
  });

  it("hides and shows section", () => {
    const state = createEditorState(sampleDoc.sections);
    const id = state.sections[0]!.id;
    const hidden = hideSection(state, id);
    expect(hidden.sections[0]?.hidden).toBe(true);
    const shown = showSection(hidden, id);
    expect(shown.sections[0]?.hidden).toBe(false);
  });

  it("locks and unlocks section", () => {
    const state = createEditorState(sampleDoc.sections);
    const id = state.sections[0]!.id;
    expect(lockSection(state, id).sections[0]?.locked).toBe(true);
    expect(unlockSection(state, id).sections[0]?.locked).toBe(false);
  });

  it("deletes unlocked section", () => {
    const state = createEditorState(sampleDoc.sections);
    const id = state.sections[0]!.id;
    expect(deleteSection(state, id).sections.length).toBe(state.sections.length - 1);
  });

  it("skips delete on locked section", () => {
    const state = lockSection(createEditorState(sampleDoc.sections), sampleDoc.sections[0]!.id);
    expect(deleteSection(state, sampleDoc.sections[0]!.id).sections.length).toBe(state.sections.length);
  });

  it("copies and pastes section", () => {
    const state = copySection(createEditorState(sampleDoc.sections), sampleDoc.sections[0]!.id);
    const pasted = pasteSection(state);
    expect(pasted.sections.length).toBe(state.sections.length + 1);
  });

  it("supports undo and redo", () => {
    const state = createEditorState(sampleDoc.sections);
    const moved = moveSection(state, state.sections[1]!.id, 0);
    const undone = undoEditor(moved);
    expect(undone.sections[0]?.id).toBe(state.sections[0]?.id);
    const redone = redoEditor(undone);
    expect(redone.sections[0]?.id).toBe(moved.sections[0]?.id);
  });

  it("autosaves sections", () => {
    expect(autosaveSections(sampleDoc.sections).sectionCount).toBe(34);
  });
});

describe("preview and publish", () => {
  it("resolves preview device", () => {
    expect(resolvePreviewDevice("phone")).toBe("mobile");
    expect(resolvePreviewDevice("desktop")).toBe("desktop");
  });

  it("builds preview sections", () => {
    expect(buildPreviewSections(sampleDoc.sections, "desktop").length).toBeGreaterThan(0);
  });

  it("returns preview dimensions", () => {
    expect(previewDimensions("phone").width).toBe(390);
  });

  it("detects dark preview mode", () => {
    expect(isDarkPreviewMode("dark")).toBe(true);
  });

  it("validates homepage document", () => {
    expect(validateHomepageDocument(sampleDoc).valid).toBe(true);
  });

  it("runs publish pipeline", () => {
    const pipeline = runPublishPipeline(sampleDoc, true);
    expect(pipeline.some((p) => p.stage === "approval")).toBe(true);
  });

  it("prepares publish document", () => {
    const published = preparePublishDocument(sampleDoc, "admin");
    expect(published.label).toBe("Live");
  });

  it("prepares preview document", () => {
    expect(preparePreviewDocument(sampleDoc).label).toBe("Preview");
  });
});

describe("versioning import export", () => {
  it("creates version entry", () => {
    expect(createVersionEntry(sampleDoc, "admin", "Publish").rollbackAvailable).toBe(true);
  });

  it("bumps homepage version", () => {
    expect(bumpHomepageVersion("2.0.0")).toBe("2.0.1");
  });

  it("compares homepage documents", () => {
    const dup = duplicateHomepageDocument(sampleDoc);
    const diff = compareHomepageDocuments(sampleDoc, dup);
    expect(diff.reordered).toBe(false);
  });

  it("clones homepage document", () => {
    expect(cloneHomepageDocument(sampleDoc, "hp-clone").id).toBe("hp-clone");
  });

  it("detects pending publish", () => {
    const modified = { ...sampleDoc, sections: [...sampleDoc.sections.slice(0, 10)] };
    expect(detectPendingPublish(modified, sampleDoc)).toBe(true);
  });

  it("exports homepage bundle", () => {
    expect(exportHomepageBundle(sampleDoc, sampleDoc).version).toBe("2.0.0");
  });

  it("imports homepage bundle", () => {
    const imported = importHomepageBundle({ draft: sampleDoc }, sampleDoc);
    expect(imported.id).toBe(sampleDoc.id);
  });
});

describe("components and ai", () => {
  it("creates component library", () => {
    expect(createDefaultComponentLibrary().length).toBe(20);
  });

  it("creates component by type", () => {
    expect(createComponent("product-card").type).toBe("product-card");
  });

  it("registers component", () => {
    const lib = createDefaultComponentLibrary();
    const custom = createComponent("button");
    custom.id = "custom-btn";
    expect(registerComponent(lib, custom).length).toBe(lib.length + 1);
  });

  it("generates AI suggestions", () => {
    expect(generateHomepageAiSuggestions([]).length).toBeGreaterThan(0);
  });

  it("suggests sections for conversion", () => {
    expect(suggestSectionsForGoal("conversion")).toContain("hero-banner");
  });

  it("generates banner content", () => {
    expect(generateBannerContent("Summer Sale").title.length).toBeGreaterThan(0);
  });

  it("optimizes layout score", () => {
    expect(optimizeLayoutScore(sampleDoc.sections)).toBeGreaterThan(50);
  });
});

describe("assets permissions audit", () => {
  it("builds asset references", () => {
    expect(buildAssetReferences(true).length).toBeGreaterThan(0);
  });

  it("links asset to section", () => {
    expect(linkAssetToSection("s1", "a1").sectionId).toBe("s1");
  });

  it("exposes integration endpoints", () => {
    expect(getIntegrationEndpoints().assetManager).toContain("/assets");
  });

  it("allows view for super-admin", () => {
    expect(canPerformHomepageAction({ action: "view" }).allowed).toBe(true);
  });

  it("requires MFA for publish", () => {
    expect(requiresMfaForHomepage("publish")).toBe(true);
  });

  it("creates audit entry", () => {
    expect(createHomepageAuditEntry("publish", "admin", "homepage-primary").action).toBe("publish");
  });
});

describe("engine dashboard and health", () => {
  it("creates default settings", () => {
    expect(createDefaultHomepageBuilderSettings().autosaveEnabled).toBe(true);
  });

  it("builds dashboard metrics", () => {
    const draft = createDefaultHomepageDocument("Draft");
    const metrics = buildHomepageDashboard(sampleDoc, draft, [], 0, 90);
    expect(metrics.draftSections).toBe(34);
  });

  it("finds section by id", () => {
    expect(findSection(sampleDoc, sampleDoc.sections[0]!.id)).toBeDefined();
  });

  it("upserts section", () => {
    const section = { ...sampleDoc.sections[0]!, label: "Updated Hero" };
    expect(upsertSection(sampleDoc, section).sections[0]?.label).toBe("Updated Hero");
  });

  it("validates builder readiness", () => {
    const readiness = validateHomepageBuilderReadiness({
      tab: "dashboard",
      dashboard: buildHomepageDashboard(sampleDoc, sampleDoc, [], 0, 90),
      production: sampleDoc,
      draft: sampleDoc,
      previewMode: "desktop",
      history: [],
      schedules: [],
      componentLibrary: [],
      aiSuggestions: [],
      auditLog: [],
      featureFlags: { homepage_builder_enabled: true },
      pendingPublish: false,
      health: { status: "healthy", score: 90, message: "ok" },
      integrations: { assetManager: true, visualCms: true, workflowEngine: true },
    });
    expect(readiness.ready).toBe(true);
  });

  it("computes builder health", () => {
    const health = computeHomepageBuilderHealth({
      health: { status: "healthy", score: 90, message: "ok" },
      featureFlags: { homepage_builder_enabled: true },
      dashboard: { productionSections: 10, healthScore: 90 } as never,
    });
    expect(health.score).toBe(90);
  });
});

describe("registry v2 integration", () => {
  it("discovered module has routes", () => {
    expect(getDiscoveredModuleV2("homepage-builder-engine")?.routes.length).toBeGreaterThan(0);
  });

  it("discovered module has feature flags", () => {
    expect(getDiscoveredModuleV2("homepage-builder-engine")?.featureFlags.some((f) => f.id === "visual_editor_enabled")).toBe(true);
  });

  it("discovered module depends on visual cms category", () => {
    const mod = getDiscoveredModuleV2("homepage-builder-engine");
    expect(mod?.dependencies).toContain("visual-cms");
  });

  it("discovered module has configuration schema", () => {
    expect(getDiscoveredModuleV2("homepage-builder-engine")?.configurationSchema.draftKey).toContain("homepage_builder_engine");
  });
});
