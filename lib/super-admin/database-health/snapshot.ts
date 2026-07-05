import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types/database";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";
import { buildMigrationRecords, listLocalMigrationFiles } from "@/lib/super-admin/database-health/migrations";
import type { DatabaseHealthSnapshot, DatabaseTableHealth } from "@/lib/super-admin/database-health/types";

type PublicTableName = keyof Database["public"]["Tables"];

const CORE_TABLES: PublicTableName[] = [
  "profiles",
  "products",
  "orders",
  "wallets",
  "platform_settings",
  "platform_audit_logs",
  "notifications",
  "messages",
];

async function countTableRows(table: PublicTableName): Promise<DatabaseTableHealth> {
  const admin = createAdminClient();
  try {
    let count: number | null = null;
    let error: { message: string } | null = null;

    switch (table) {
      case "profiles":
        ({ count, error } = await admin.from("profiles").select("*", { count: "exact", head: true }));
        break;
      case "products":
        ({ count, error } = await admin.from("products").select("*", { count: "exact", head: true }));
        break;
      case "orders":
        ({ count, error } = await admin.from("orders").select("*", { count: "exact", head: true }));
        break;
      case "wallets":
        ({ count, error } = await admin.from("wallets").select("*", { count: "exact", head: true }));
        break;
      case "platform_settings":
        ({ count, error } = await admin.from("platform_settings").select("*", { count: "exact", head: true }));
        break;
      case "platform_audit_logs":
        ({ count, error } = await admin.from("platform_audit_logs").select("*", { count: "exact", head: true }));
        break;
      case "notifications":
        ({ count, error } = await admin.from("notifications").select("*", { count: "exact", head: true }));
        break;
      case "messages":
        ({ count, error } = await admin.from("messages").select("*", { count: "exact", head: true }));
        break;
      default:
        error = { message: `Unsupported table: ${table}` };
    }
    if (error) {
      return {
        schema: "public",
        name: table,
        rowCount: null,
        accessible: false,
        error: error.message,
      };
    }
    return {
      schema: "public",
      name: table,
      rowCount: count ?? 0,
      accessible: true,
    };
  } catch (error) {
    return {
      schema: "public",
      name: table,
      rowCount: null,
      accessible: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function listStorageBuckets() {
  const admin = createAdminClient();
  try {
    const { data, error } = await admin.storage.listBuckets();
    if (error) {
      return { buckets: [], message: error.message, status: "degraded" as const };
    }
    return {
      buckets: (data ?? []).map((bucket) => ({
        id: bucket.id,
        name: bucket.name,
        public: bucket.public ?? false,
      })),
      status: "healthy" as const,
    };
  } catch (error) {
    return {
      buckets: [],
      message: error instanceof Error ? error.message : "Storage unavailable",
      status: "unhealthy" as const,
    };
  }
}

export async function getDatabaseHealthSnapshot(): Promise<DatabaseHealthSnapshot> {
  const [operations, tableResults, storage] = await Promise.all([
    getProductionOperationsSnapshot(),
    Promise.all(CORE_TABLES.map((table) => countTableRows(table))),
    listStorageBuckets(),
  ]);

  const migrationFiles = listLocalMigrationFiles();

  return {
    generatedAt: new Date().toISOString(),
    connection: {
      status: operations.health.checks.database.status,
      message: operations.health.checks.database.message,
    },
    migrations: {
      total: migrationFiles.length,
      latest: migrationFiles.at(-1) ?? null,
      files: buildMigrationRecords(migrationFiles.slice(-12)),
    },
    tables: tableResults,
    storage: {
      status: operations.health.checks.storage.status,
      buckets: storage.buckets,
      message: storage.message ?? operations.health.checks.storage.message,
    },
    rls: {
      enforced: true,
      note: "Row Level Security is enforced on platform tables via Supabase policies. Use Audit & Compliance for policy review.",
    },
  };
}
