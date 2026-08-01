/**
 * ROVEXO View Item — Product Information Field Map v1.0
 * Owner FINAL PRODUCT INFORMATION CERTIFICATION
 *
 * Configurable ordered map. Render a row only when the value is populated.
 * Never hardcode empty rows. Never change order.
 *
 * Stock status stays under price only — never duplicated in this table.
 * Quantity selector is separate (stock > 1) and is not an info row.
 */

export const PRODUCT_INFORMATION_FIELD_MAP_V1 = [
  { id: "category", label: "Category", clickable: true },
  { id: "brand", label: "Brand", clickable: true },
  { id: "condition", label: "Condition", clickable: false },
  { id: "material", label: "Material", clickable: false },
  { id: "colour", label: "Colour", clickable: false },
  { id: "size", label: "Size", clickable: false },
  { id: "storage", label: "Storage", clickable: false },
  { id: "network", label: "Network", clickable: false },
  { id: "compatibility", label: "Compatibility", clickable: false },
  { id: "season", label: "Season", clickable: false },
  { id: "uploaded", label: "Uploaded", clickable: false },
] as const;

export type ProductInformationFieldId =
  (typeof PRODUCT_INFORMATION_FIELD_MAP_V1)[number]["id"];

/**
 * Description suffix labels written by Sell publish
 * (`formatAttributeNote` / `buildPublishDescription`).
 * Keys map onto Product Information field ids.
 */
export const PRODUCT_INFORMATION_NOTE_LABEL_ALIASES_V1: Readonly<
  Record<string, ProductInformationFieldId>
> = {
  Material: "material",
  "Material (recommended)": "material",
  Colour: "colour",
  Color: "colour",
  Colours: "colour",
  Colors: "colour",
  Size: "size",
  Storage: "storage",
  Network: "network",
  Season: "season",
  "Season Rating": "season",
  Compatibility: "compatibility",
};

export const PRODUCT_INFORMATION_FIELD_MAP_SSOT =
  "lib/product-detail/product-information-field-map-v1.ts" as const;
