import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { getConnectorRecord, updateConnectorSettings } from "@/lib/seller/migration/connectors/credentials";
import { listFileMappingFields } from "@/lib/seller/migration/connectors/file/field-mapping";

const mappingSchema = z.object({
  fileColumnMapping: z.record(z.string(), z.string()),
});

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  if (!isStoreMigrationEnabled()) {
    return NextResponse.json({ error: "Migration feature is disabled." }, { status: 404 });
  }

  const record = await getConnectorRecord(auth.user.id, "xlsx");
  const mapping = record?.settings?.fileColumnMapping ?? record?.settings?.xlsxColumnMapping ?? {};

  return NextResponse.json({
    platform: "xlsx",
    mapping,
    supportedFields: listFileMappingFields(),
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
    const record = await updateConnectorSettings(auth.user.id, "xlsx", {
      fileColumnMapping: body.fileColumnMapping,
      xlsxColumnMapping: body.fileColumnMapping,
    });

    return NextResponse.json({
      platform: "xlsx",
      mapping: record.settings.fileColumnMapping ?? body.fileColumnMapping,
      supportedFields: listFileMappingFields(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid mapping request." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save XLSX mapping." },
      { status: 400 },
    );
  }
}
