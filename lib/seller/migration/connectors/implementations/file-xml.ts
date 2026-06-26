import { BaseUniversalConnector } from "@/lib/seller/migration/connectors/base-connector";
import { loadSellerFileColumnMapping } from "@/lib/seller/migration/connectors/file/mapping-settings";
import {
  countXmlItems,
  listingsFromXmlContent,
  previewXmlContent,
  resolveXmlContent,
} from "@/lib/seller/migration/connectors/file/xml-parser";
import type { ConnectorConnectInput, ConnectorDefinition } from "@/lib/seller/migration/connectors/types";
import type { MigrationConnectorInput } from "@/lib/seller/migration/engine/types";

export function createXmlConnector(definition: ConnectorDefinition): BaseUniversalConnector {
  return new BaseUniversalConnector(definition, {
    validateConfiguration: (input: ConnectorConnectInput) => {
      const content = input.fileContent ?? (input.settings?.fileContent as string | undefined);
      if (!input.fileName && !content) {
        return {
          valid: false,
          errors: [{ field: "fileName", message: "XML file name or content is required." }],
        };
      }
      if (content) {
        const preview = previewXmlContent(content, 1);
        if (preview.rows.length === 0) {
          return {
            valid: false,
            errors: [{ field: "fileContent", message: "XML file has no importable products." }],
          };
        }
      }
      return { valid: true, errors: [] };
    },
    connect: async () => undefined,
    estimateTotal: async (input) => {
      const content = resolveXmlContent(input.payload);
      if (content) return countXmlItems(content);
      return 0;
    },
    fetchListings: async (input: MigrationConnectorInput) => {
      const content = resolveXmlContent(input.payload);
      if (!content) {
        throw new Error("XML file content is missing from the migration job.");
      }
      const mapping = await loadSellerFileColumnMapping(input.sellerId, input.platform);
      return listingsFromXmlContent(
        content,
        input.platform,
        input.importMethod,
        input.offset,
        input.limit,
        mapping,
      );
    },
  });
}
