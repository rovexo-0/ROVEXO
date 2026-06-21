"use client";

import { useMemo, useState } from "react";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import { getCategoryTree } from "@/lib/categories/queries";
import {
  flatPathFromSegments,
  type CategorySegment,
  type FlatCategoryPath,
  type CategoryNode,
} from "@/lib/categories/types";

type CategoryTreePickerProps = {
  value: string | null;
  onChange: (path: FlatCategoryPath) => void;
  className?: string;
};

function nodesToSegments(nodes: CategoryNode[]): CategorySegment[] {
  return nodes.map((node) => ({ id: node.id, name: node.name, slug: node.slug }));
}

export function CategoryTreePicker({ onChange, className }: CategoryTreePickerProps) {
  const tree = useMemo(() => getCategoryTree(), []);
  const [selectedPath, setSelectedPath] = useState<CategoryNode[]>([]);

  const levels = useMemo(() => {
    const result: { label: string; nodes: CategoryNode[] }[] = [
      { label: "Category", nodes: tree },
    ];

    for (const node of selectedPath) {
      if (node.children?.length) {
        result.push({ label: "Subcategory", nodes: node.children });
      }
    }

    return result;
  }, [selectedPath, tree]);

  function selectNode(levelIndex: number, node: CategoryNode) {
    const nextPath = [...selectedPath.slice(0, levelIndex), node];
    setSelectedPath(nextPath);

    if (!node.children?.length && nextPath.length >= 2) {
      onChange(flatPathFromSegments(nodesToSegments(nextPath)));
    }
  }

  return (
    <div className={cn("flex flex-col gap-ds-4", className)}>
      {levels.map((level, levelIndex) => (
        <div key={`${level.label}-${levelIndex}`}>
          <p className="mb-ds-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            {levelIndex === 0 ? level.label : levelIndex === 1 ? "Subcategory" : "Refine"}
          </p>
          <div className="flex flex-wrap gap-ds-2">
            {level.nodes.map((node) => (
              <CategoryChip
                key={node.id}
                label={node.name}
                active={selectedPath[levelIndex]?.id === node.id}
                onClick={() => selectNode(levelIndex, node)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function flatPathFromSelection(
  categorySlug: string,
  subcategorySlug: string,
  childCategorySlug?: string,
): FlatCategoryPath | null {
  const slugs = childCategorySlug
    ? [categorySlug, subcategorySlug, childCategorySlug]
    : [categorySlug, subcategorySlug];

  const tree = getCategoryTree();
  const path: CategoryNode[] = [];
  let nodes = tree;

  for (const slug of slugs) {
    const node = nodes.find((entry) => entry.slug === slug);
    if (!node) return null;
    path.push(node);
    nodes = node.children ?? [];
  }

  return path.length >= 2 ? flatPathFromSegments(nodesToSegments(path)) : null;
}
