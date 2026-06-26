import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { MIGRATION_PLATFORM_IDS } from "@/lib/seller/migration/providers/registry";
import {
  createMigrationJob,
  listMigrationJobsForSeller,
} from "@/lib/seller/migration/repository";
import { runMigrationEngine } from "@/lib/seller/migration/service";
import type { MigrationImportMethodId, MigrationPlatformId } from "@/lib/seller/migration/types";

const platformSchema = z
  .string()
  .refine((value): value is MigrationPlatformId =>
    (MIGRATION_PLATFORM_IDS as readonly string[]).includes(value),
  );

const importMethodSchema = z.enum([
  "single_url",
  "multiple_urls",
  "bulk_import",
  "store_import",
  "csv",
  "xlsx",
  "xml",
  "api_import",
]) as z.ZodType<MigrationImportMethodId>;

const createSchema = z.object({
  platform: platformSchema,
  importMethod: importMethodSchema,
  duplicatePolicy: z.enum(["skip", "replace", "update", "create_new"]).optional(),
  input: z
    .object({
      urls: z.array(z.string().url()).optional(),
      fileName: z.string().max(200).optional(),
      fileContent: z.string().max(5_000_000).optional(),
      fileStoragePath: z.string().max(500).optional(),
      storeUrl: z.string().max(500).optional(),
      apiCredentialsRef: z.string().max(100).optional(),
    })
    .optional(),
  notifyOnComplete: z.boolean().optional(),
  autoPublish: z.boolean().optional(),
  start: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  const jobs = await listMigrationJobsForSeller(auth.user.id);
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  try {
    const body = createSchema.parse(await request.json());
    const job = await createMigrationJob({
      sellerId: auth.user.id,
      platform: body.platform,
      importMethod: body.importMethod,
      duplicatePolicy: body.duplicatePolicy,
      input: body.input,
      notifyOnComplete: body.notifyOnComplete,
      autoPublish: body.autoPublish,
    });

    if (!job) {
      return NextResponse.json({ error: "Unable to create migration job." }, { status: 500 });
    }

    if (body.start) {
      const completed = await runMigrationEngine(auth.user.id, job.id);
      return NextResponse.json({ job: completed ?? job });
    }

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid migration request." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Unable to create migration job." }, { status: 500 });
  }
}
