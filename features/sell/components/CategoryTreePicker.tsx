"use client";

import { useMemo, useState } from "react";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import { getCategoryTree, toPathId } from "@/lib/categories/queries";
import type { FlatCategoryPath } from "@/lib/categories/types";
import { focusRing, transitionFast } from "@/components/ui/tokens";

type CategoryTreePickerProps = {
  value: string | null;
  onChange: (path: FlatCategoryPath) => void;
  className?: string;
};

function findFlatPath(categorySlug: string, subcategorySlug: string, childSlug?: string): FlatCategoryPath | null {
  const tree = getCategoryTree();
  const category = tree.find((node) => node.slug === categorySlug);
  const subcategory = category?.children?.find((node) => node.slug === subcategorySlug);
  const child = childSlug
    ? subcategory?.children?.find((node) => node.slug === childSlug)
    : undefined;

  if (!category || !subcategory) return null;

  return {
    categoryId: category.id,
    categoryName: category.name,
    categorySlug: category.slug,
    subcategoryId: subcategory.id,
    subcategoryName: subcategory.name,
    subcategorySlug: subcategory.slug,
    childCategoryId: child?.id,
    childCategoryName: child?.name,
    childCategorySlug: child?.slug,
    pathLabel: [category.name, subcategory.name, child?.name].filter(Boolean).join(" › "),
  };
}

export function CategoryTreePicker({ value, onChange, className }: CategoryTreePickerProps) {
  const tree = useMemo(() => getCategoryTree(), []);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [subcategorySlug, setSubcategorySlug] = useState<string | null>(null);

  const selectedCategory = tree.find((node) => node.slug === categorySlug) ?? null;
  const selectedSubcategory =
    selectedCategory?.children?.find((node) => node.slug === subcategorySlug) ?? null;

  return (
    <div className={cn("flex flex-col gap-ds-4", className)}>
      <div>
        <p className="mb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Category</p>
        <div className="flex flex-wrap gap-ds-2">
          {tree.map((category) => (
            <CategoryChip
              key={category.id}
              label={category.name}
              active={categorySlug === category.slug}
              onClick={() => {
                setCategorySlug(category.slug);
                setSubcategorySlug(null);
              }}
            />
          ))}
        </div>
      </div>

      {selectedCategory?.children && (
        <div>
          <p className="mb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Subcategory</p>
          <div className="flex flex-wrap gap-ds-2">
            {selectedCategory.children.map((subcategory) => (
              <CategoryChip
                key={subcategory.id}
                label={subcategory.name}
                active={subcategorySlug === subcategory.slug}
                onClick={() => {
                  setSubcategorySlug(subcategory.slug);

                  if (!subcategory.children?.length) {
                    const flat = findFlatPath(categorySlug!, subcategory.slug);
                    if (flat) onChange(flat);
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {selectedSubcategory?.children && (
        <div>
          <p className="mb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Child Category</p>
          <div className="flex flex-wrap gap-ds-2">
            {selectedSubcategory.children.map((child) => {
              const pathId = `${categorySlug}:${subcategorySlug}:${child.slug}`;
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => {
                    const flat = findFlatPath(categorySlug!, subcategorySlug!, child.slug);
                    if (flat) onChange(flat);
                  }}
                  className={cn(
                    "inline-flex min-h-ds-7 items-center rounded-ds-full px-ds-4 py-ds-2 text-sm font-medium",
                    transitionFast,
                    focusRing,
                    value === pathId
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-text-secondary hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {child.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function flatPathFromSelection(
  categorySlug: string,
  subcategorySlug: string,
  childCategorySlug?: string,
): FlatCategoryPath | null {
  return findFlatPath(categorySlug, subcategorySlug, childCategorySlug);
}
