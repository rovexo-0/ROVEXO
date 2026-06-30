import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateSearchEngineDraft,
  exportSearchEngineDocument,
  importSearchEngineDocument,
  publishSearchEngine,
  resetSearchEngineDraft,
  rollbackSearchEngine,
  saveSearchEngineDraft,
} from "@/lib/search-engine/engine";
import {
  SEARCH_ENGINE_INDEXES,
  SEARCH_ENGINE_MODULES,
  SEARCH_ENGINE_SORT_OPTIONS,
  SEARCH_ENGINE_TYPES,
} from "@/lib/search-engine/registry";
import { getSearchEngineSnapshot } from "@/lib/search-engine/reader";
import type { SearchEngineDocument } from "@/lib/search-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getSearchEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: SEARCH_ENGINE_MODULES,
      searchTypes: SEARCH_ENGINE_TYPES,
      sortOptions: SEARCH_ENGINE_SORT_OPTIONS,
      indexes: SEARCH_ENGINE_INDEXES,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportSearchEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importSearchEngineDocument(body.document as SearchEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveSearchEngineDraft(body.document as SearchEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishSearchEngine(auth.user.id);
      const snapshot = await getSearchEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackSearchEngine(body.historyId, auth.user.id);
      const snapshot = await getSearchEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetSearchEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateSearchEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Search Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
