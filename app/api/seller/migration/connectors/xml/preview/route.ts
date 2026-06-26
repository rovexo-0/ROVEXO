import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAuth, requireApiRole } from "@/lib/auth/session";
import { isStoreMigrationEnabled } from "@/lib/seller/migration/config";
import { validationPipeline } from "@/lib/seller/migration/connectors/pipelines";
import { previewXmlContent } from "@/lib/seller/migration/connectors/file/xml-parser";

const previewSchema = z.object({
  fileContent: z.string().min(1).max(5_000_000),
  limit: z.number().int().min(1).max(25).optional(),
  mapping: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const roleCheck = await requireApiRole(["seller", "business", "admin"]);
  if (roleCheck instanceof NextResponse) return roleCheck;

  if (!isStoreMigrationEnabled()) {
    return NextResponse.json({ error: "Migration feature is disabled." }, { status: 404 });
  }

  try {
    const body = previewSchema.parse(await request.json());
    const content = body.fileContent;
    const preview = previewXmlContent(content, body.limit ?? 5, body.mapping);

    const validation = preview.preview.map((listing) => ({
      externalId: listing.externalId,
      valid: validationPipeline.validateRaw(listing).valid,
      errors: validationPipeline.validateRaw(listing).errors,
    }));

    return NextResponse.json({
      encoding: preview.encoding,
      headers: preview.headers,
      detectedMapping: preview.detectedMapping,
      totalRows: preview.rows.length,
      preview: preview.preview,
      validation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid preview request." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to preview XML." },
      { status: 400 },
    );
  }
}
