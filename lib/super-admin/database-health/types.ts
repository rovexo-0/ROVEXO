import type { HealthStatus } from "@/lib/ops/health";

export type DatabaseMigrationRecord = {
  id: string;
  filename: string;
  applied: boolean | null;
};

export type DatabaseTableHealth = {
  schema: string;
  name: string;
  rowCount: number | null;
  accessible: boolean;
  error?: string;
};

export type DatabaseStorageBucket = {
  id: string;
  name: string;
  public: boolean;
};

export type DatabaseHealthSnapshot = {
  generatedAt: string;
  connection: {
    status: HealthStatus;
    message?: string;
  };
  migrations: {
    total: number;
    latest: string | null;
    files: DatabaseMigrationRecord[];
  };
  tables: DatabaseTableHealth[];
  storage: {
    status: HealthStatus;
    buckets: DatabaseStorageBucket[];
    message?: string;
  };
  rls: {
    enforced: boolean;
    note: string;
  };
};
