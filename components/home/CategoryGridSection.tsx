export type HomeCategoryCard = {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  imageUrl: string;
};

type CategoryGridSectionProps = {
  categories: HomeCategoryCard[];
};

/** @deprecated Legacy category grid — retired in favour of HomeCategoryRail. Kept as null stub for migration safety. */
export function CategoryGridSection(
  {}: CategoryGridSectionProps,
) {
  return null;
}