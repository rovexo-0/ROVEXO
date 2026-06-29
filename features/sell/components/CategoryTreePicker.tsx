"use client";

import { useEffect, useMemo, useState } from "react";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { cn } from "@/lib/cn";
import { getCategoryTree } from "@/lib/categories/queries";
import { loadCategoriesWithRecovery } from "@/lib/categories/category-loader";
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
  const [tree, setTree] = useState<CategoryNode[]>(() => getCategoryTree());
  const [loadNotice, setLoadNotice] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<CategoryNode[]>([]);

  useEffect(() => {
    let cancelled = false;

    void loadCategoriesWithRecovery().then((result) => {
      if (cancelled) return;
      setTree(result.tree);
      if (result.source === "static" && result.recovered) {
        setLoadNotice("Categories loaded from offline backup. You can still publish.");
      } else if (result.recovered) {
        setLoadNotice("Categories recovered. You can still publish.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

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
      {loadNotice ? (
        <p className="text-xs text-text-secondary" role="status">
          {loadNotice}
        </p>
      ) : null}
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
  tree: CategoryNode[] = getCategoryTree(),
): FlatCategoryPath | null {
  const slugs = childCategorySlug
    ? [categorySlug, subcategorySlug, childCategorySlug]
    : [categorySlug, subcategorySlug];

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
