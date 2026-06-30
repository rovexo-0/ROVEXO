import type { HomepageBuilderDocument, HomepageValidationResult } from "@/lib/homepage-builder-engine/types";
import { isValidSectionType } from "@/lib/homepage-builder-engine/sections";

export type PublishStage = "draft" | "validate" | "preview" | "approval" | "publish" | "audit" | "rollback-point";

export function validateHomepageDocument(doc: HomepageBuilderDocument): HomepageValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (doc.sections.length === 0) errors.push("Homepage must have at least one section");
  if (!doc.sections.some((s) => s.type === "hero-banner")) warnings.push("Missing hero banner section");
  if (!doc.sections.some((s) => s.type === "footer")) warnings.push("Missing footer section");

  for (const section of doc.sections) {
    if (!isValidSectionType(section.type)) errors.push(`Invalid section type: ${section.type}`);
    if (section.settings.rolloutPercent !== undefined && (section.settings.rolloutPercent < 0 || section.settings.rolloutPercent > 100)) {
      errors.push(`Invalid rollout percent for ${section.id}`);
    }
  }

  const score = Math.max(0, 100 - errors.length * 20 - warnings.length * 5);
  return { valid: errors.length === 0, score, errors, warnings };
}

export function runPublishPipeline(
  doc: HomepageBuilderDocument,
  approvalRequired: boolean,
): { stage: PublishStage; valid: boolean; message: string }[] {
  const validation = validateHomepageDocument(doc);
  const pipeline: { stage: PublishStage; valid: boolean; message: string }[] = [
    { stage: "draft", valid: true, message: "Draft ready" },
    { stage: "validate", valid: validation.valid, message: validation.valid ? "Validation passed" : validation.errors.join("; ") },
    { stage: "preview", valid: validation.valid, message: "Preview generated" },
    { stage: "approval", valid: !approvalRequired || validation.valid, message: approvalRequired ? "Awaiting approval" : "Approval skipped" },
    { stage: "publish", valid: validation.valid, message: "Published to production" },
    { stage: "audit", valid: true, message: "Audit log recorded" },
    { stage: "rollback-point", valid: true, message: "Rollback point created" },
  ];
  return pipeline;
}

export function preparePublishDocument(doc: HomepageBuilderDocument, editor: string): HomepageBuilderDocument {
  return {
    ...doc,
    label: "Live",
    updatedAt: new Date().toISOString(),
    lastPublishedAt: new Date().toISOString(),
    lastEditor: editor,
    sections: doc.sections.map((s) => ({ ...s, published: true })),
  };
}

export function preparePreviewDocument(doc: HomepageBuilderDocument): HomepageBuilderDocument {
  return { ...doc, label: "Preview", updatedAt: new Date().toISOString() };
}
