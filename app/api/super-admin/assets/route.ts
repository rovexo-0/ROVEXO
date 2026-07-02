import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import {
  archiveEnterpriseAsset,
  deleteEnterpriseAsset,
  exportAssetManagerEngineDocument,
  importAssetManagerEngineDocument,
  patchAssetManagerEngineDraft,
  publishAssetManagerEngine,
  replaceEnterpriseAsset,
  resetAssetManagerEngineDraft,
  rollbackAssetManagerEngine,
  saveAssetManagerEngineDraft,
} from "@/lib/asset-manager-engine/engine";
import { ASSET_MANAGER_LIBRARIES } from "@/lib/asset-manager-engine/registry";
import { getAssetManagerEngineSnapshot, searchAssetManagerAssets } from "@/lib/asset-manager-engine/reader";
import type { AssetManagerEngineDocument, AssetSearchFilters, EnterpriseAssetRecord } from "@/lib/asset-manager-engine/types";

export const dynamic = "force-dynamic";

const actionSchema = z.object({
  action: z.enum(["save-draft", "publish", "rollback", "reset-draft", "export", "import", "replace", "archive"]),
  document: z.record(z.string(), z.unknown()).optional(),
  historyId: z.string().optional(),
  assetId: z.string().optional(),
  asset: z.record(z.string(), z.unknown()).optional(),
});

const patchSchema = z.object({
  action: z.literal("save-draft").optional(),
  document: z.record(z.string(), z.unknown()).optional(),
  patch: z.record(z.string(), z.unknown()).optional(),
});

const deleteSchema = z.object({
  assetId: z.string(),
});

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const filters: AssetSearchFilters = {
    query: url.searchParams.get("q") ?? undefined,
    tag: url.searchParams.get("tag") ?? undefined,
    fileType: url.searchParams.get("type") ?? undefined,
    status: (url.searchParams.get("status") as AssetSearchFilters["status"]) ?? undefined,
  };

  if (filters.query || filters.tag || filters.fileType || filters.status) {
    const search = await searchAssetManagerAssets(filters);
    return NextResponse.json(search);
  }

  const snapshot = await getAssetManagerEngineSnapshot();
  return NextResponse.json({
    ...snapshot,
    libraries: ASSET_MANAGER_LIBRARIES,
  });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = actionSchema.parse(await request.json());

    if (body.action === "export") {
      const document = await exportAssetManagerEngineDocument();
      return NextResponse.json({ ok: true, document });
    }

    if (body.action === "import") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await importAssetManagerEngineDocument(body.document as AssetManagerEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "save-draft") {
      if (!body.document) return NextResponse.json({ error: "document is required." }, { status: 400 });
      const saved = await saveAssetManagerEngineDraft(body.document as AssetManagerEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.action === "publish") {
      const published = await publishAssetManagerEngine(auth.user.id);
      const snapshot = await getAssetManagerEngineSnapshot();
      return NextResponse.json({ ok: true, live: published, snapshot });
    }

    if (body.action === "rollback") {
      if (!body.historyId) return NextResponse.json({ error: "historyId is required." }, { status: 400 });
      const restored = await rollbackAssetManagerEngine(body.historyId, auth.user.id);
      const snapshot = await getAssetManagerEngineSnapshot();
      return NextResponse.json({ ok: true, live: restored, snapshot });
    }

    if (body.action === "reset-draft") {
      const draft = await resetAssetManagerEngineDraft(auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    if (body.action === "replace") {
      if (!body.assetId || !body.asset) {
        return NextResponse.json({ error: "assetId and asset are required." }, { status: 400 });
      }
      await replaceEnterpriseAsset(body.assetId, body.asset as Partial<EnterpriseAssetRecord>, auth.user.id);
      const snapshot = await getAssetManagerEngineSnapshot();
      return NextResponse.json({ ok: true, snapshot });
    }

    if (body.action === "archive") {
      if (!body.assetId) return NextResponse.json({ error: "assetId is required." }, { status: 400 });
      await archiveEnterpriseAsset(body.assetId, auth.user.id);
      const snapshot = await getAssetManagerEngineSnapshot();
      return NextResponse.json({ ok: true, snapshot });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Asset Manager.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = patchSchema.parse(await request.json());

    if (body.document) {
      const saved = await saveAssetManagerEngineDraft(body.document as AssetManagerEngineDocument, auth.user.id);
      return NextResponse.json({ ok: true, draft: saved });
    }

    if (body.patch) {
      const draft = await patchAssetManagerEngineDraft(body.patch as Partial<AssetManagerEngineDocument>, auth.user.id);
      return NextResponse.json({ ok: true, draft });
    }

    return NextResponse.json({ error: "No patch payload provided." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to patch Asset Manager.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = deleteSchema.parse(await request.json());
    await deleteEnterpriseAsset(body.assetId, auth.user.id);
    const snapshot = await getAssetManagerEngineSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete asset.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
