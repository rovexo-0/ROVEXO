import "server-only";

import { apiFetchWithRetry, ConnectorApiError } from "@/lib/seller/migration/connectors/api/http-client";
import type { MigrationConnectorInput, MigrationRawListing } from "@/lib/seller/migration/engine/types";

export function normalizeWooStoreUrl(storeUrl: string): string {
  const trimmed = storeUrl.trim().replace(/\/$/, "");
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

function wooHeaders(apiKey: string, apiSecret: string): Record<string, string> {
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  return {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  };
}

export async function verifyWooCommerceConnection(
  storeUrl: string,
  apiKey: string,
  apiSecret: string,
): Promise<{ currency: string; name: string }> {
  const base = normalizeWooStoreUrl(storeUrl);
  const response = await apiFetchWithRetry(`${base}/wp-json/wc/v3/system_status`, {
    headers: wooHeaders(apiKey, apiSecret),
  });

  if (response.status === 401 || response.status === 403) {
    throw new ConnectorApiError(
      "WooCommerce authentication failed. Check consumer key and secret.",
      response.status,
    );
  }
  if (!response.ok) {
    throw new ConnectorApiError(`WooCommerce API responded with ${response.status}.`, response.status);
  }

  const payload = (await response.json()) as {
    settings?: { currency?: string; title?: string };
    environment?: { site_url?: string };
  };

  return {
    currency: payload.settings?.currency ?? "GBP",
    name: payload.settings?.title ?? payload.environment?.site_url ?? "WooCommerce Store",
  };
}

export async function getWooProductCount(
  storeUrl: string,
  apiKey: string,
  apiSecret: string,
): Promise<number> {
  const base = normalizeWooStoreUrl(storeUrl);
  const response = await apiFetchWithRetry(`${base}/wp-json/wc/v3/products?per_page=1&status=publish`, {
    headers: wooHeaders(apiKey, apiSecret),
  });

  if (!response.ok) {
    throw new ConnectorApiError(`WooCommerce API responded with ${response.status}.`, response.status);
  }

  const total = response.headers.get("x-wp-total");
  return total ? Number.parseInt(total, 10) || 0 : 0;
}

type WooProduct = {
  id: number;
  name: string;
  description?: string;
  regular_price?: string;
  sale_price?: string;
  sku?: string;
  stock_quantity?: number | null;
  status?: string;
  categories?: Array<{ name?: string }>;
  images?: Array<{ src?: string }>;
  attributes?: Array<{ name?: string; options?: string[] }>;
};

function mapWooProduct(
  product: WooProduct,
  input: MigrationConnectorInput,
  currency: string,
): MigrationRawListing {
  const priceRaw = product.sale_price || product.regular_price || "0";
  const attributeMap = Object.fromEntries(
    (product.attributes ?? []).map((attribute) => [
      attribute.name?.toLowerCase() ?? "attribute",
      (attribute.options ?? []).join(", "),
    ]),
  );

  return {
    externalId: String(product.id),
    title: product.name,
    description: product.description?.replace(/<[^>]*>/g, "") ?? product.name,
    price: Number.parseFloat(priceRaw) || 0,
    currency,
    sku: product.sku,
    quantity: product.stock_quantity ?? 1,
    sourceCategory: product.categories?.map((category) => category.name).filter(Boolean).join(" > "),
    condition: product.status === "publish" ? "new" : "used",
    imageUrls: (product.images ?? []).map((image) => image.src).filter(Boolean) as string[],
    attributes: {
      source: "woocommerce",
      method: input.importMethod,
      status: product.status ?? "publish",
      regularPrice: product.regular_price ?? "",
      salePrice: product.sale_price ?? "",
      ...attributeMap,
    },
  };
}

export async function fetchWooProducts(
  input: MigrationConnectorInput,
  storeUrl: string,
  apiKey: string,
  apiSecret: string,
  currency = "GBP",
): Promise<MigrationRawListing[]> {
  const base = normalizeWooStoreUrl(storeUrl);
  const page = Math.floor(input.offset / input.limit) + 1;
  const perPage = Math.min(input.limit, 100);
  const url = new URL(`${base}/wp-json/wc/v3/products`);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  url.searchParams.set("status", "publish");

  const response = await apiFetchWithRetry(url.toString(), {
    headers: wooHeaders(apiKey, apiSecret),
  });

  if (!response.ok) {
    throw new ConnectorApiError(`WooCommerce API responded with ${response.status}.`, response.status);
  }

  const products = (await response.json()) as WooProduct[];
  return products.map((product) => mapWooProduct(product, input, currency));
}
