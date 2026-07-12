/**
 * Material finish suffixes for deterministic expansion.
 */

export const MATERIAL_FINISHES: Record<string, readonly string[]> = {
  default: ["Matte", "Gloss", "Satin", "Textured", "Smooth", "Embossed"],
  metals: ["Brushed", "Polished", "Hammered", "Antiqued", "Patinated"],
  woods: ["Natural", "Dark", "Light", "Rustic", "Modern"],
  stone: ["Honed", "Polished", "Brushed", "Flamed", "Sandblasted"],
  ceramics: ["Glazed", "Unglazed", "Matte Glaze", "Crackle Glaze"],
  textiles: ["Plain Weave", "Twill", "Sateen", "Jacquard", "Dobby"],
};
