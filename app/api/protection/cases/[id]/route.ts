import { NextResponse } from "next/server";
import { getUserRole, isPlatformAdminRole, requireApiAuth } from "@/lib/auth/session";
import {
  addProtectionEvidence,
  getProtectionCase,
  listProtectionCaseEvents,
  submitCaseAppeal,
} from "@/lib/protection/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;
  const role = await getUserRole(auth.user.id);
  const [caseRecord, events] = await Promise.all([getProtectionCase(id), listProtectionCaseEvents(id)]);

  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  if (
    caseRecord.buyerId !== auth.user.id &&
    caseRecord.sellerId !== auth.user.id &&
    !isPlatformAdminRole(role ?? "buyer")
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json({ case: caseRecord, events });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const role = await getUserRole(auth.user.id);

  const { id } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const caseRecord = await getProtectionCase(id);

  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  if (body.action === "appeal" && typeof body.reason === "string") {
    const updated = await submitCaseAppeal({
      caseId: id,
      userId: auth.user.id,
      reason: body.reason,
    });
    return updated
      ? NextResponse.json({ case: updated })
      : NextResponse.json({ error: "Failed to submit appeal." }, { status: 500 });
  }

  if (body.action === "resolve" && isPlatformAdminRole(role ?? "buyer")) {
    return NextResponse.json(
      {
        error:
          "Manual resolution is disabled. The Resolution Engine processes all cases automatically.",
      },
      { status: 410 },
    );
  }

  if (body.action === "evidence" && typeof body.fileUrl === "string" && typeof body.fileName === "string") {
    if (
      caseRecord.buyerId !== auth.user.id &&
      caseRecord.sellerId !== auth.user.id &&
      !isPlatformAdminRole(role ?? "buyer")
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const evidence = await addProtectionEvidence({
      caseId: id,
      uploadedBy: auth.user.id,
      fileUrl: body.fileUrl,
      fileName: body.fileName,
      description: typeof body.description === "string" ? body.description : "",
    });
    return evidence
      ? NextResponse.json({ evidence })
      : NextResponse.json({ error: "Failed to upload evidence." }, { status: 500 });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
