import "server-only";

import { BaseUniversalConnector } from "@/lib/seller/migration/connectors/base-connector";
import { createStubMigrationHandlers } from "@/lib/seller/migration/connectors/adapter";
import { getConnectorDefinition } from "@/lib/seller/migration/connectors/definitions";
import { createCsvConnector } from "@/lib/seller/migration/connectors/implementations/file-csv";
import { createXlsxConnector } from "@/lib/seller/migration/connectors/implementations/file-xlsx";
import { createXmlConnector } from "@/lib/seller/migration/connectors/implementations/file-xml";
import { createShopifyConnector } from "@/lib/seller/migration/connectors/implementations/api-shopify";
import { createWooCommerceConnector } from "@/lib/seller/migration/connectors/implementations/api-woocommerce";
import { createEbayConnector } from "@/lib/seller/migration/connectors/implementations/api-ebay";
import { createEtsyConnector } from "@/lib/seller/migration/connectors/implementations/api-etsy";
import type { UniversalConnector } from "@/lib/seller/migration/connectors/types";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export function createConnector(platform: MigrationPlatformId): UniversalConnector {
  const definition = getConnectorDefinition(platform);

  switch (definition.implementation) {
    case "file_csv":
      return createCsvConnector(definition);
    case "file_xlsx":
      return createXlsxConnector(definition);
    case "file_xml":
      return createXmlConnector(definition);
    case "api_shopify":
      return createShopifyConnector(definition);
    case "api_woocommerce":
      return createWooCommerceConnector(definition);
    case "api_ebay":
      return createEbayConnector(definition);
    case "api_etsy":
      return createEtsyConnector(definition);
    default: {
      const { connect: _stubConnect, ...stubHandlers } = createStubMigrationHandlers(definition);
      void _stubConnect;
      return new BaseUniversalConnector(definition, stubHandlers);
    }
  }
}
