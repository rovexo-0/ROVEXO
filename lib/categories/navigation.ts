import type { CategoryNode } from "@/lib/categories/types";

export type CategorySegment = {
  id: string;
  name: string;
  slug: string;
};

export type CategoryBreadcrumb = CategorySegment & {
  href: string;
};

function categoryHref(segments: CategorySegment[]): string {
  return `/category/${segments.map((segment) => segment.slug).join("/")}`;
}

export function findNodeBySlugPath(
  tree: CategoryNode[],
  slugs: string[],
): CategoryNode[] | null {
  if (!slugs.length) return null;

  const path: CategoryNode[] = [];
  let nodes = tree;

  for (const slug of slugs) {
    const node = nodes.find((entry) => entry.slug === slug);
    if (!node) return null;
    path.push(node);
    nodes = node.children ?? [];
  }

  return path;
}

export function segmentsFromPath(path: CategoryNode[]): CategorySegment[] {
  return path.map((node) => ({
    id: node.id,
    name: node.name,
    slug: node.slug,
  }));
}

export function breadcrumbsFromPath(path: CategoryNode[]): CategoryBreadcrumb[] {
  const segments: CategorySegment[] = [];

  return path.map((node) => {
    segments.push({ id: node.id, name: node.name, slug: node.slug });
    return {
      id: node.id,
      name: node.name,
      slug: node.slug,
      href: categoryHref(segments),
    };
  });
}

export function collectLeafPaths(
  tree: CategoryNode[],
): { path: CategoryNode[]; segments: CategorySegment[] }[] {
  const results: { path: CategoryNode[]; segments: CategorySegment[] }[] = [];

  function walk(node: CategoryNode, ancestors: CategoryNode[]) {
    const path = [...ancestors, node];
    if (!node.children?.length) {
      results.push({ path, segments: segmentsFromPath(path) });
      return;
    }
    for (const child of node.children) {
      walk(child, path);
    }
  }

  for (const root of tree) {
    if (root.children?.length) {
      for (const child of root.children) {
        walk(child, [root]);
      }
    } else {
      results.push({ path: [root], segments: segmentsFromPath([root]) });
    }
  }

  return results;
}

export function collectDescendantSlugs(node: CategoryNode): string[] {
  const slugs = [node.slug];

  function walk(current: CategoryNode) {
    for (const child of current.children ?? []) {
      slugs.push(child.slug);
      walk(child);
    }
  }

  walk(node);
  return slugs;
}

export function getCategoryHrefFromSlugs(slugs: string[]): string {
  return `/category/${slugs.join("/")}`;
}
