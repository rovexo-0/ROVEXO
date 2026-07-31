import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  canAccessHmrcSellerCentre,
  resolveHmrcEligibility,
} from "@/lib/compliance/hmrc-eligibility-v1";
import { loadHmrcSellerSnapshot } from "@/lib/compliance/hmrc-seller-snapshot.server";
import {
  buildAnnualReportPdf,
  buildHmrcExportCsv,
  buildSalesSummaryPdf,
  hmrcDocumentFilename,
  type HmrcDocumentKind,
} from "@/lib/compliance/hmrc-documents-v1";
import { fetchProfile } from "@/lib/profile/queries";

type RouteContext = { params: Promise<{ kind: string }> };

const KINDS = new Set<HmrcDocumentKind>(["sales_summary", "annual_report", "hmrc_export"]);

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { kind: rawKind } = await context.params;
  if (!KINDS.has(rawKind as HmrcDocumentKind)) {
    return NextResponse.json({ error: "Unknown document." }, { status: 404 });
  }
  const kind = rawKind as HmrcDocumentKind;

  const profile = await fetchProfile();
  // Fail-closed: own account only — never cross-account HMRC exports.
  if (!profile || profile.id !== auth.user.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const access = resolveHmrcEligibility({
    authenticated: true,
    hasSellingActivity: Boolean(profile.capabilities?.hasSellingActivity),
    role: profile.role,
  });
  if (!canAccessHmrcSellerCentre(access)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const snapshot = await loadHmrcSellerSnapshot(profile);
  const meta = snapshot.documents.find((d) => d.id === kind);
  if (meta && meta.available === false) {
    return NextResponse.json({ error: "Document not available." }, { status: 404 });
  }

  const filename = hmrcDocumentFilename(kind, snapshot.counters.currentTaxYear);
  const sellerName =
    snapshot.prefill.find((f) => f.id === "full_name")?.value ?? profile.fullName ?? "Seller";

  if (kind === "hmrc_export") {
    const csv = buildHmrcExportCsv({
      counters: snapshot.counters,
      prefill: snapshot.prefill,
    });
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const pdf =
    kind === "sales_summary"
      ? buildSalesSummaryPdf({ counters: snapshot.counters, sellerName })
      : buildAnnualReportPdf({
          counters: snapshot.counters,
          prefill: snapshot.prefill,
          statusTitle: snapshot.status.title,
          sellerName,
        });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
