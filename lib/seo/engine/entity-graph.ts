export type EntityType = "product" | "store" | "brand" | "category" | "location" | "collection";

export type EntityNode = {
  id: string;
  type: EntityType;
  slug: string;
  name: string;
  path: string;
};

export type EntityEdge = {
  from: string;
  to: string;
  relation:
    | "in_category"
    | "sold_by"
    | "located_in"
    | "brand_of"
    | "related_to"
    | "part_of_collection"
    | "similar_to";
};

export type EntityGraph = {
  nodes: EntityNode[];
  edges: EntityEdge[];
};

export function createEntityGraph(): EntityGraph {
  return { nodes: [], edges: [] };
}

export function addEntity(graph: EntityGraph, node: EntityNode): EntityGraph {
  if (graph.nodes.some((entry) => entry.id === node.id)) return graph;
  return { ...graph, nodes: [...graph.nodes, node] };
}

export function linkEntities(
  graph: EntityGraph,
  from: string,
  to: string,
  relation: EntityEdge["relation"],
): EntityGraph {
  const edge: EntityEdge = { from, to, relation };
  if (graph.edges.some((entry) => entry.from === from && entry.to === to && entry.relation === relation)) {
    return graph;
  }
  return { ...graph, edges: [...graph.edges, edge] };
}

export function entityId(type: EntityType, slug: string): string {
  return `${type}:${slug}`;
}

export function buildPageEntityGraph(input: {
  pagePath: string;
  pageTitle: string;
  pageKind: EntityType;
  products: { slug: string; title: string; sellerUsername?: string | null; brand?: string | null }[];
  categories?: { slug: string; name: string; path: string }[];
  brands?: { slug: string; name: string }[];
  locations?: { slug: string; name: string }[];
}): EntityGraph {
  let graph = createEntityGraph();
  const pageSlug = input.pagePath.replace(/^\//, "").replace(/\//g, "-");
  const pageNode: EntityNode = {
    id: entityId(input.pageKind === "collection" ? "collection" : "category", pageSlug),
    type: input.pageKind === "collection" ? "collection" : "category",
    slug: pageSlug,
    name: input.pageTitle,
    path: input.pagePath,
  };
  graph = addEntity(graph, pageNode);

  for (const product of input.products.slice(0, 12)) {
    const productNode: EntityNode = {
      id: entityId("product", product.slug),
      type: "product",
      slug: product.slug,
      name: product.title,
      path: `/listing/${product.slug}`,
    };
    graph = addEntity(graph, productNode);
    graph = linkEntities(graph, pageNode.id, productNode.id, "related_to");

    if (product.sellerUsername) {
      const storeNode: EntityNode = {
        id: entityId("store", product.sellerUsername),
        type: "store",
        slug: product.sellerUsername,
        name: product.sellerUsername,
        path: `/user/${product.sellerUsername}`,
      };
      graph = addEntity(graph, storeNode);
      graph = linkEntities(graph, productNode.id, storeNode.id, "sold_by");
    }

    if (product.brand) {
      const brandSlug = product.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const brandNode: EntityNode = {
        id: entityId("brand", brandSlug),
        type: "brand",
        slug: brandSlug,
        name: product.brand,
        path: `/brand/${brandSlug}`,
      };
      graph = addEntity(graph, brandNode);
      graph = linkEntities(graph, productNode.id, brandNode.id, "brand_of");
    }
  }

  for (const category of input.categories ?? []) {
    const catNode: EntityNode = {
      id: entityId("category", category.slug),
      type: "category",
      slug: category.slug,
      name: category.name,
      path: category.path,
    };
    graph = addEntity(graph, catNode);
    graph = linkEntities(graph, pageNode.id, catNode.id, "in_category");
  }

  for (const location of input.locations ?? []) {
    const locNode: EntityNode = {
      id: entityId("location", location.slug),
      type: "location",
      slug: location.slug,
      name: location.name,
      path: `/l/${location.slug}`,
    };
    graph = addEntity(graph, locNode);
    graph = linkEntities(graph, pageNode.id, locNode.id, "located_in");
  }

  return graph;
}

export function graphInternalLinks(graph: EntityGraph, limit = 8): { label: string; href: string }[] {
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
  const links: { label: string; href: string }[] = [];
  const seen = new Set<string>();

  for (const edge of graph.edges) {
    const target = nodeMap.get(edge.to);
    if (!target || seen.has(target.path)) continue;
    seen.add(target.path);
    links.push({ label: target.name, href: target.path });
    if (links.length >= limit) break;
  }

  return links;
}
