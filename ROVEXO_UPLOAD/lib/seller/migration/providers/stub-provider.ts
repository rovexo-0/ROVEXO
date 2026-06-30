import type {
  MigrationConnectorInput,
  MigrationProvider,
  MigrationRawListing,
} from "@/lib/seller/migration/engine/types";
import type { MigrationImportMethodId, MigrationPlatformId } from "@/lib/seller/migration/types";
import { getConnectorDefinition } from "@/lib/seller/migration/connectors/definitions";
import { classifiedsCapabilities } from "@/lib/seller/migration/connectors/capabilities";

function estimateCount(importMethod: MigrationImportMethodId): number {
  switch (importMethod) {
    case "single_url":
      return 1;
    case "multiple_urls":
      return 12;
    case "bulk_import":
      return 80;
    case "store_import":
      return 240;
    case "csv":
    case "xlsx":
    case "xml":
      return 120;
    case "api_import":
      return 500;
    default:
      return 24;
  }
}

function buildStubListing(
  platform: MigrationPlatformId,
  importMethod: MigrationImportMethodId,
  index: number,
): MigrationRawListing {
  const brands = ["Nike", "Apple", "Samsung", "IKEA", "Zara"];
  const brand = brands[index % brands.length]!;
  return {
    externalId: `${platform}-${importMethod}-${index}`,
    title: `${brand} imported item #${index + 1}`,
    description: `Imported via ${platform} (${importMethod}). Ready for ROVEXO publishing.`,
    brand,
    model: `Model-${(index % 5) + 1}`,
    variant: index % 3 === 0 ? "Limited" : undefined,
    condition: index % 4 === 0 ? "new" : "used",
    price: 15 + (index % 20) * 5.5,
    currency: "GBP",
    colour: ["Black", "White", "Blue", "Red"][index % 4],
    size: index % 2 === 0 ? "M" : "L",
    sku: `SKU-${platform}-${index}`,
    quantity: 1 + (index % 3),
    sourceCategory: ["Fashion", "Electronics", "Home", "Sports"][index % 4],
    imageUrls: [`https://picsum.photos/seed/${platform}-${index}/800/800`],
    attributes: { source: platform, method: importMethod },
  };
}

export function createStubProvider(
  id: MigrationPlatformId,
  name: string,
  supportedMethods: MigrationImportMethodId[],
): MigrationProvider {
  const definition = getConnectorDefinition(id);
  return {
    capabilities: {
      id,
      name,
      supportedMethods,
      integrationStatus: "stub",
      capabilities: definition.capabilities ?? classifiedsCapabilities(),
    },
    async connect(): Promise<void> {
      return;
    },
    async estimateTotal(input: Omit<MigrationConnectorInput, "offset" | "limit">): Promise<number> {
      return estimateCount(input.importMethod);
    },
    async fetchListings(input: MigrationConnectorInput): Promise<MigrationRawListing[]> {
      const total = estimateCount(input.importMethod);
      const start = input.offset;
      const end = Math.min(start + input.limit, total);
      const items: MigrationRawListing[] = [];
      for (let i = start; i < end; i += 1) {
        items.push(buildStubListing(input.platform, input.importMethod, i));
      }
      return items;
    },
  };
}
