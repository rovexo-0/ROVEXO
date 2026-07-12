/**
 * Enterprise marketplace materials database — re-exports canonical SSOT from lib/materials.
 */

export {
  MARKETPLACE_MATERIALS,
  MARKETPLACE_MATERIALS_BY_VERTICAL,
  MARKETPLACE_MATERIALS_BY_SCOPE,
  FASHION_MATERIALS,
  HOME_MATERIALS,
  PILLOW_MATERIALS,
  BEDDING_MATERIALS,
  MATERIAL_DATABASE,
  MATERIAL_COUNT,
  getMaterialsForVertical,
  validateMaterial,
  type MaterialRecord,
} from "@/lib/materials";
