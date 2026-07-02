import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateEnterpriseCoreDraft,
  exportEnterpriseCoreDocument,
  importEnterpriseCoreDocument,
  publishEnterpriseCore,
  resetEnterpriseCoreDraft,
  rollbackEnterpriseCore,
  saveEnterpriseCoreDraft,
} from "@/lib/enterprise-core/engine";
import {
  ENTERPRISE_CORE_REGISTRY,
  ENTERPRISE_CORE_SEARCH_CATEGORIES,
  ENTERPRISE_CORE_SETTING_GROUPS,
} from "@/lib/enterprise-core/registry";
import { getEnterpriseCoreSnapshot, searchEnterpriseCore } from "@/lib/enterprise-core/snapshot";
import type { EnterpriseCoreDocument } from "@/lib/enterprise-core/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import", "search"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
  query: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  if (q && q.length >= 2) {
    const search = await searchEnterpriseCore(q);
    return NextResponse.json(search);
  }

  const snapshot = await getEnterpriseCoreSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      registry: ENTERPRISE_CORE_REGISTRY,
      searchCategories: ENTERPRISE_CORE_SEARCH_CATEGORIES,
      settingGroups: ENTERPRISE_CORE_SETTING_GROUPS,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "search") {
      if (!body.query || body.query.trim().length < 2) {
        return NextResponse.json({ error: "query must be at least 2 characters." }, { status: 400 });
      }
      const search = await searchEnterpriseCore(body.query);
      return NextResponse.json({ ok: true, ...search });
    }

    if (body.action === "export") {
      const document = await exportEnterpriseCoreDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importEnterpriseCoreDocument(body.document as EnterpriseCoreDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveEnterpriseCoreDraft(body.document as EnterpriseCoreDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishEnterpriseCore(auth.user.id);
      const snapshot = await getEnterpriseCoreSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackEnterpriseCore(body.historyId, auth.user.id);
      const snapshot = await getEnterpriseCoreSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetEnterpriseCoreDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateEnterpriseCoreDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Enterprise Core.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
