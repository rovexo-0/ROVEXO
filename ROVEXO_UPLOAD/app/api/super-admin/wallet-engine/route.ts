import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  duplicateWalletEngineDraft,
  exportWalletEngineDocument,
  importWalletEngineDocument,
  publishWalletEngine,
  resetWalletEngineDraft,
  rollbackWalletEngine,
  saveWalletEngineDraft,
} from "@/lib/wallet-engine/engine";
import {
  WALLET_ENGINE_FILTERS,
  WALLET_ENGINE_MODULES,
  WALLET_ENGINE_TIMELINE_EVENTS,
} from "@/lib/wallet-engine/registry";
import { getWalletEngineSnapshot } from "@/lib/wallet-engine/reader";
import type { WalletEngineDocument } from "@/lib/wallet-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "duplicate", "export", "import"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
});

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getWalletEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: {
      modules: WALLET_ENGINE_MODULES,
      timelineEvents: WALLET_ENGINE_TIMELINE_EVENTS,
      filters: WALLET_ENGINE_FILTERS,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportWalletEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importWalletEngineDocument(body.document as WalletEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveWalletEngineDraft(body.document as WalletEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishWalletEngine(auth.user.id);
      const snapshot = await getWalletEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackWalletEngine(body.historyId, auth.user.id);
      const snapshot = await getWalletEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetWalletEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "duplicate") {
      const draft = await duplicateWalletEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Wallet Engine.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
