/**
 * Index Quality Engine v4 — formalizes quality scoring for index decisions.
 * Re-exports quality module with v4 naming for the enterprise SEO ecosystem.
 */
export {
  computeSeoQualityScore,
  computeSeoQualityScore as computeIndexQualityScore,
  type SeoQualityScore,
  type SeoQualityScore as IndexQualityScore,
  type QualityFactors,
  type QualityFactors as IndexQualityFactors,
} from "@/lib/seo/engine/quality";
