import "server-only";

import {
  apiFetchWithRetry,
  ConnectorApiError,
  parseLinkHeader,
} from "@/lib/seller/migration/connectors/api/http-client";
import type { MigrationConnectorInput, MigrationRawListing } from "@/lib/seller/migration/engine/types";

const API_VERSION = "2024-10";

export function normalizeShopifyStoreUrl(storeUrl: string): string {
  const trimmed = storeUrl.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http")) return trimmed;
  const host = trimmed.includes(".") ? trimmed : `${trimmed}.myshopify.com`;
  return `https://${host.replace(/^https?:\/\//, "")}`;
}

function shopifyHeaders(accessToken: string): Record<string, string> {
  return {
    "X-Shopify-Access-Token": accessToken,
    Accept: "application/json",
  };
}

export async function verifyShopifyConnection(
  storeUrl: string,
  accessToken: string,
): Promise<{ currency: string; name: string }> {
  const base = normalizeShopifyStoreUrl(storeUrl);
  const response = await apiFetchWithRetry(`${base}/admin/api/${API_VERSION}/shop.json`, {
    headers: shopifyHeaders(accessToken),
  });

  if (response.status === 401 || response.status === 403) {
    throw new ConnectorApiError("Shopify authentication failed. Check your access token.", response.status);
  }
  if (!response.ok) {
    throw new ConnectorApiError(`Shopify API responded with ${response.status}.`, response.status);
  }

  const payload = (await response.json()) as {
    shop?: { currency?: string; name?: string };
  };

  return {
    currency: payload.shop?.currency ?? "GBP",
    name: payload.shop?.name ?? "Shopify Store",
  };
}

export async function getShopifyProductCount(storeUrl: string, accessToken: string): Promise<number> {
  const base = normalizeShopifyStoreUrl(storeUrl);
  const response = await apiFetchWithRetry(
    `${base}/admin/api/${API_VERSION}/products/count.json?status=active`,
    { headers: shopifyHeaders(accessToken) },
  );

  if (!response.ok) {
    throw new ConnectorApiError(`Shopify count API responded with ${response.status}.`, response.status);
  }

  const payload = (await response.json()) as { count?: number };
  return payload.count ?? 0;
}

type ShopifyProduct = {
  id: number;
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  status?: string;
  tags?: string;
  variants?: Array<{
    id?: number;
    title?: string;
    price?: string;
    compare_at_price?: string;
    sku?: string;
    inventory_quantity?: number;
    barcode?: string;
  }>;
  images?: Array<{ src?: string; position?: number }>;
};

function mapShopifyProduct(
  product: ShopifyProduct,
  input: MigrationConnectorInput,
  currency: string,
): MigrationRawListing {
  const variants = product.variants ?? [];
  const primary = variants[0];
  const sortedImages = [...(product.images ?? [])]
    .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
    .map((image) => image.src)
    .filter((url): url is string => Boolean(url));

  const collections = [product.product_type, ...(product.tags?.split(",").map((tag) => tag.trim()) ?? [])]
    .filter(Boolean)
    .join(", ");

  return {
    externalId: String(product.id),
    title: product.title,
    description: product.body_html?.replace(/<[^>]*>/g, "") ?? product.title,
    brand: product.vendor,
    price: Number.parseFloat(primary?.price ?? "0") || 0,
    currency,
    sku: primary?.sku,
    ean: primary?.barcode,
    quantity: primary?.inventory_quantity ?? 1,
    sourceCategory: product.product_type || collections || undefined,
    condition: product.status === "active" ? "new" : "used",
    imageUrls: sortedImages,
    attributes: {
      source: "shopify",
      method: input.importMethod,
      status: product.status ?? "active",
      variantCount: variants.length,
      variants: JSON.stringify(
        variants.map((variant) => ({
          id: variant.id,
          title: variant.title,
          price: variant.price,
          sku: variant.sku,
          quantity: variant.inventory_quantity,
        })),
      ),
      collections,
    },
  };
}

async function fetchShopifyProductPage(
  url: string,
  accessToken: string,
): Promise<{ products: ShopifyProduct[]; nextUrl: string | null }> {
  const response = await apiFetchWithRetry(url, { headers: shopifyHeaders(accessToken) });

  if (!response.ok) {
    throw new ConnectorApiError(`Shopify API responded with ${response.status}.`, response.status);
  }

  const payload = (await response.json()) as { products?: ShopifyProduct[] };
  const links = parseLinkHeader(response.headers.get("link"));
  return {
    products: payload.products ?? [],
    nextUrl: links.next ?? null,
  };
}

export async function fetchShopifyProducts(
  input: MigrationConnectorInput,
  storeUrl: string,
  accessToken: string,
  currency = "GBP",
): Promise<MigrationRawListing[]> {
  const base = normalizeShopifyStoreUrl(storeUrl);
  const targetStart = input.offset;
  const targetEnd = input.offset + input.limit;
  const results: MigrationRawListing[] = [];
  let seen = 0;

  let pageUrl: string | null =
    `${base}/admin/api/${API_VERSION}/products.json?limit=250&status=active`;

  while (pageUrl && seen < targetEnd) {
    const page = await fetchShopifyProductPage(pageUrl, accessToken);
    for (const product of page.products) {
      if (seen >= targetStart && seen < targetEnd) {
        results.push(mapShopifyProduct(product, input, currency));
      }
      seen += 1;
      if (seen >= targetEnd) break;
    }
    pageUrl = page.nextUrl;
  }

  return results;
}
