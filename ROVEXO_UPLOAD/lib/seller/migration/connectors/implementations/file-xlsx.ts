import { BaseUniversalConnector } from "@/lib/seller/migration/connectors/base-connector";
import { loadSellerFileColumnMapping } from "@/lib/seller/migration/connectors/file/mapping-settings";
import {
  countXlsxRows,
  listingsFromXlsxContent,
  previewXlsxContent,
  resolveXlsxBuffer,
} from "@/lib/seller/migration/connectors/file/xlsx-parser";
import type { ConnectorConnectInput, ConnectorDefinition } from "@/lib/seller/migration/connectors/types";
import type { MigrationConnectorInput } from "@/lib/seller/migration/engine/types";

export function createXlsxConnector(definition: ConnectorDefinition): BaseUniversalConnector {
  return new BaseUniversalConnector(definition, {
    validateConfiguration: (input: ConnectorConnectInput) => {
      const content = input.fileContent ?? (input.settings?.fileContent as string | undefined);
      if (!input.fileName && !content) {
        return {
          valid: false,
          errors: [{ field: "fileName", message: "XLSX file name or content is required." }],
        };
      }
      if (content) {
        const buffer = Buffer.from(content, content.trim().match(/^[A-Za-z0-9+/=]+$/) ? "base64" : "utf8");
        const preview = previewXlsxContent(buffer, 1);
        if (preview.rows.length === 0) {
          return {
            valid: false,
            errors: [{ field: "fileContent", message: "Spreadsheet has no importable rows." }],
          };
        }
      }
      return { valid: true, errors: [] };
    },
    connect: async () => undefined,
    estimateTotal: async (input) => {
      const buffer = resolveXlsxBuffer(input.payload);
      if (buffer) return countXlsxRows(buffer);
      return 0;
    },
    fetchListings: async (input: MigrationConnectorInput) => {
      const buffer = resolveXlsxBuffer(input.payload);
      if (!buffer) {
        throw new Error("XLSX file content is missing from the migration job.");
      }
      const mapping = await loadSellerFileColumnMapping(input.sellerId, input.platform);
      return listingsFromXlsxContent(
        buffer,
        input.platform,
        input.importMethod,
        input.offset,
        input.limit,
        mapping,
      );
    },
  });
}
