export type CategoryFilterType = "text" | "number" | "select" | "boolean" | "range";

export type CategoryFilterDefinition = {
  key: string;
  label: string;
  type: CategoryFilterType;
  options?: string[];
  required?: boolean;
};

export type CategoryFilterGroup = {
  categorySlug: string;
  filters: CategoryFilterDefinition[];
};

const COMMON_FILTERS: CategoryFilterDefinition[] = [
  { key: "condition", label: "Condition", type: "select", options: ["New", "Like New", "Very Good", "Good", "Fair"] },
  { key: "price", label: "Price", type: "range" },
  { key: "brand", label: "Brand", type: "text" },
  { key: "location", label: "Location", type: "text" },
];

export const CATEGORY_FILTER_GROUPS: CategoryFilterGroup[] = [
  {
    categorySlug: "vehicle-parts",
    filters: [
      ...COMMON_FILTERS,
      { key: "make", label: "Vehicle Make", type: "text", required: true },
      { key: "model", label: "Model", type: "text" },
      { key: "colour", label: "Colour", type: "text" },
    ],
  },
  {
    categorySlug: "phones-tablets",
    filters: [
      ...COMMON_FILTERS,
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "model", label: "Model", type: "text" },
      { key: "storage", label: "Storage", type: "select", options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
      { key: "colour", label: "Colour", type: "text" },
      { key: "warranty", label: "Warranty", type: "boolean" },
      { key: "unlocked", label: "Unlocked", type: "boolean" },
    ],
  },
  {
    categorySlug: "computers",
    filters: [
      ...COMMON_FILTERS,
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "model", label: "Model", type: "text" },
      { key: "storage", label: "Storage", type: "select", options: ["256GB", "512GB", "1TB", "2TB"] },
      { key: "ram", label: "RAM", type: "select", options: ["8GB", "16GB", "32GB", "64GB"] },
      { key: "colour", label: "Colour", type: "text" },
      { key: "warranty", label: "Warranty", type: "boolean" },
    ],
  },
  {
    categorySlug: "diy-tools",
    filters: [
      ...COMMON_FILTERS,
      { key: "brand", label: "Brand", type: "text", required: true },
      { key: "voltage", label: "Voltage", type: "select", options: ["12V", "18V", "240V"] },
      { key: "cordless", label: "Cordless", type: "boolean" },
    ],
  },
  {
    categorySlug: "electronics",
    filters: [
      ...COMMON_FILTERS,
      { key: "storage", label: "Storage", type: "select", options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"] },
      { key: "colour", label: "Colour", type: "text" },
      { key: "warranty", label: "Warranty", type: "boolean" },
    ],
  },
  {
    categorySlug: "womens-fashion",
    filters: [
      ...COMMON_FILTERS,
      { key: "size", label: "Size", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
      { key: "colour", label: "Colour", type: "text" },
      { key: "material", label: "Material", type: "text" },
    ],
  },
  {
    categorySlug: "mens-fashion",
    filters: [
      ...COMMON_FILTERS,
      { key: "size", label: "Size", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
      { key: "colour", label: "Colour", type: "text" },
      { key: "material", label: "Material", type: "text" },
    ],
  },
  {
    categorySlug: "fashion",
    filters: [
      ...COMMON_FILTERS,
      { key: "size", label: "Size", type: "select", options: ["XS", "S", "M", "L", "XL", "XXL"] },
      { key: "colour", label: "Colour", type: "text" },
      { key: "gender", label: "Gender", type: "select", options: ["Women", "Men", "Unisex", "Kids"] },
      { key: "material", label: "Material", type: "text" },
    ],
  },
  {
    categorySlug: "home-garden",
    filters: [
      ...COMMON_FILTERS,
      { key: "room", label: "Room", type: "select", options: ["Bedroom", "Living Room", "Kitchen", "Bathroom", "Garden", "Office"] },
      { key: "material", label: "Material", type: "text" },
      { key: "dimensions", label: "Dimensions", type: "text" },
    ],
  },
  {
    categorySlug: "furniture",
    filters: [
      ...COMMON_FILTERS,
      { key: "material", label: "Material", type: "text" },
      { key: "colour", label: "Colour", type: "text" },
      { key: "width", label: "Width (cm)", type: "number" },
      { key: "height", label: "Height (cm)", type: "number" },
      { key: "depth", label: "Depth (cm)", type: "number" },
      { key: "assembly", label: "Assembly Required", type: "boolean" },
    ],
  },
  {
    categorySlug: "bedding",
    filters: [
      ...COMMON_FILTERS,
      { key: "size", label: "Bed Size", type: "select", options: ["Single", "Double", "King", "Super King"] },
      { key: "material", label: "Material", type: "text" },
      { key: "colour", label: "Colour", type: "text" },
      { key: "brand", label: "Brand", type: "text" },
    ],
  },
  {
    categorySlug: "sports",
    filters: [
      ...COMMON_FILTERS,
      { key: "sport", label: "Sport", type: "text" },
      { key: "size", label: "Size", type: "text" },
    ],
  },
  {
    categorySlug: "gaming",
    filters: [
      ...COMMON_FILTERS,
      { key: "platform", label: "Platform", type: "select", options: ["PlayStation", "Xbox", "Nintendo", "PC"] },
      { key: "region", label: "Region", type: "select", options: ["UK", "EU", "US", "Global"] },
    ],
  },
  {
    categorySlug: "pet-supplies",
    filters: [
      ...COMMON_FILTERS,
      { key: "pet_type", label: "Pet Type", type: "select", options: ["Dog", "Cat", "Bird", "Fish", "Other"] },
      { key: "size", label: "Size", type: "select", options: ["Small", "Medium", "Large"] },
    ],
  },
  {
    categorySlug: "books",
    filters: [...COMMON_FILTERS],
  },
  {
    categorySlug: "collectibles",
    filters: [...COMMON_FILTERS],
  },
  {
    categorySlug: "jewellery",
    filters: [
      ...COMMON_FILTERS,
      { key: "material", label: "Material", type: "text" },
      { key: "colour", label: "Colour", type: "text" },
    ],
  },
  {
    categorySlug: "kids-fashion",
    filters: [
      ...COMMON_FILTERS,
      { key: "size", label: "Size", type: "text" },
      { key: "colour", label: "Colour", type: "text" },
    ],
  },
];

export function getFiltersForCategorySlug(slug: string, slugPath: string[] = [slug]): CategoryFilterDefinition[] {
  for (let index = slugPath.length; index > 0; index--) {
    const candidate = slugPath[index - 1]!;
    const group = CATEGORY_FILTER_GROUPS.find((entry) => entry.categorySlug === candidate);
    if (group) return group.filters;
  }

  const direct = CATEGORY_FILTER_GROUPS.find((entry) => entry.categorySlug === slug);
  return direct?.filters ?? COMMON_FILTERS;
}

export function getAllFilterGroupSlugs(): string[] {
  return CATEGORY_FILTER_GROUPS.map((group) => group.categorySlug);
}
