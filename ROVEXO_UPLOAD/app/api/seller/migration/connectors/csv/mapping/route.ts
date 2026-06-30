import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import {
  getConnectorRecord,
  updateConnectorSettings,
} from "@/lib/seller/migration/connectors/credentials";
import { listCsvMappingFields } from "@/lib/seller/migration/connectors/file/csv-mapping";

const mappingSchema = z.object({
  csvColumnMapping: z.record(z.string(), z.string()),
});

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  if (!isStoreMigrationEnabled()) {
    return NextResponse.json({ error: "Migration feature is disabled." }, { status: 404 });
  }

  const record = await getConnectorRecord(auth.user.id, "csv");
  const mapping = record?.settings?.csvColumnMapping ?? {};

  return NextResponse.json({
    platform: "csv",
    mapping,
    supportedFields: listCsvMappingFields(),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  if (!isStoreMigrationEnabled()) {
    return NextResponse.json({ error: "Migration feature is disabled." }, { status: 404 });
  }

  try {
    const body = mappingSchema.parse(await request.json());
    const record = await updateConnectorSettings(auth.user.id, "csv", {
      csvColumnMapping: body.csvColumnMapping,
    });

    return NextResponse.json({
      platform: "csv",
      mapping: record.settings.csvColumnMapping ?? {},
      supportedFields: listCsvMappingFields(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid mapping request." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save CSV mapping." },
      { status: 400 },
    );
  }
}
