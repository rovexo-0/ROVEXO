/** No artificial ROVEXO import cap — process in safe batches. */
export const MIGRATION_BATCH_SIZE = 50;

/** Max batches processed per API invocation (serverless timeout guard). */
export const MIGRATION_MAX_BATCHES_PER_RUN = 5;

/** Polling interval hint for client (ms). */
export const MIGRATION_POLL_INTERVAL_MS = 2000;
