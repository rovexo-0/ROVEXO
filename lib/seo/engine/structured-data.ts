import type { Product } from "@/lib/products/types";

export type StructuredDataValidationIssue = {
  type: string;
  message: string;
  severity: "critical" | "warning";
};

const SUPPORTED_TYPES = new Set([
  "Product",
  "Offer",
  "Review",
  "AggregateRating",
  "ItemList",
  "BreadcrumbList",
  "CollectionPage",
  "Store",
  "ProfilePage",
  "Organization",
  "WebSite",
  "SearchAction",
  "ListItem",
  "FAQPage",
  "Question",
  "Answer",
]);

function validateSchemaNode(record: Record<string, unknown>, path = ""): StructuredDataValidationIssue[] {
  const issues: StructuredDataValidationIssue[] = [];

  if (!record["@context"] && !record["@graph"]) {
    issues.push({
      type: "missing_context",
      message: `JSON-LD missing @context${path ? ` at ${path}` : ""}`,
      severity: "warning",
    });
  }

  const type = record["@type"];
  if (!type && !record["@graph"]) {
    issues.push({
      type: "missing_type",
      message: `JSON-LD missing @type${path ? ` at ${path}` : ""}`,
      severity: "warning",
    });
  }

  if (typeof type === "string" && !SUPPORTED_TYPES.has(type)) {
    issues.push({
      type: "unsupported_type",
      message: `Unsupported schema type: ${type}`,
      severity: "warning",
    });
  }

  if (type === "Product" && !record.name) {
    issues.push({ type: "product_missing_name", message: "Product schema missing name", severity: "critical" });
  }

  if (type === "Offer" && record.price === undefined && !record.priceSpecification) {
    issues.push({ type: "offer_missing_price", message: "Offer schema missing price", severity: "warning" });
  }

  if (type === "ItemList" && !record.itemListElement) {
    issues.push({
      type: "itemlist_missing_elements",
      message: "ItemList schema missing itemListElement",
      severity: "warning",
    });
  }

  if (type === "BreadcrumbList" && !record.itemListElement) {
    issues.push({
      type: "breadcrumb_missing_elements",
      message: "BreadcrumbList schema missing itemListElement",
      severity: "critical",
    });
  }

  if (type === "WebSite" && !record.url) {
    issues.push({ type: "website_missing_url", message: "WebSite schema missing url", severity: "critical" });
  }

  if (type === "SearchAction" && !record.target) {
    issues.push({
      type: "searchaction_missing_target",
      message: "SearchAction schema missing target",
      severity: "critical",
    });
  }

  return issues;
}

/** Structured Data Engine — validates JSON-LD for all supported schema types. */
export function validateJsonLdGraph(items: unknown[]): StructuredDataValidationIssue[] {
  const issues: StructuredDataValidationIssue[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object") {
      issues.push({ type: "invalid", message: "JSON-LD entry is not an object", severity: "critical" });
      continue;
    }

    const record = item as Record<string, unknown>;

    if (Array.isArray(record["@graph"])) {
      for (const node of record["@graph"]) {
        if (node && typeof node === "object") {
          issues.push(...validateSchemaNode(node as Record<string, unknown>, "@graph"));
        }
      }
    } else {
      issues.push(...validateSchemaNode(record));
    }
  }

  return issues;
}

export function buildProductStructuredData(product: Product, reviews?: unknown[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.title,
        image: product.imageUrl,
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "GBP",
          availability: "https://schema.org/InStock",
        },
        aggregateRating:
          product.reviewCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: product.rating,
                reviewCount: product.reviewCount,
              }
            : undefined,
        review: reviews,
      },
    ].filter(Boolean),
  };
}

export function buildWebSiteSearchAction(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/** Block deployment on critical structured data validation failures. */
export function assertStructuredDataValid(items: unknown[]): void {
  const issues = validateJsonLdGraph(items);
  const critical = issues.filter((issue) => issue.severity === "critical");
  if (critical.length) {
    throw new Error(`Structured data validation failed: ${critical.map((issue) => issue.message).join("; ")}`);
  }
}

export function hasCriticalStructuredDataErrors(items: unknown[]): boolean {
  return validateJsonLdGraph(items).some((issue) => issue.severity === "critical");
}

export function safeStructuredDataJson(items: unknown[]): unknown[] {
  return items.filter(Boolean);
}
