import "server-only";

import { getConnectorRecord } from "@/lib/seller/migration/connectors/credentials";
import type { FileColumnMapping } from "@/lib/seller/migration/connectors/file/field-mapping";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";

export function readFileColumnMapping(
  settings: Record<string, unknown> | undefined,
): FileColumnMapping | undefined {
  const mapping =
    settings?.fileColumnMapping ??
    settings?.csvColumnMapping ??
    settings?.xmlColumnMapping ??
    settings?.xlsxColumnMapping;

  if (!mapping || typeof mapping !== "object") return undefined;
  return mapping as FileColumnMapping;
}

export async function loadSellerFileColumnMapping(
  sellerId: string,
  platform: MigrationPlatformId,
): Promise<FileColumnMapping | undefined> {
  const record = await getConnectorRecord(sellerId, platform);
  return readFileColumnMapping(record?.settings);
}
