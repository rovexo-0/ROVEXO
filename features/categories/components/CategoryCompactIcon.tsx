import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { resolveCategoryCompactIcon } from "@/lib/categories/category-compact-icon";
import type { HomeCategoryIconType } from "@/lib/home/constants";

type CategoryCompactIconProps = {
  type: HomeCategoryIconType;
};

export function CategoryCompactIcon({ type }: CategoryCompactIconProps) {
  return (
    <span className="rx-category-icon" aria-hidden>
      <RovexoIcon icon={resolveCategoryCompactIcon(type)} variant="category" alt="" />
    </span>
  );
}
