import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import {
  getPublicWalletEngineConfig,
  getWalletEngineAnalyticsForUser,
  getWalletEngineContext,
  getWalletEngineTransactionContext,
  listWalletEngineSummaries,
} from "@/lib/wallet-engine/reader";
import type { WalletEngineFilterId, WalletEngineWalletType } from "@/lib/wallet-engine/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transactionId");
  const filter = url.searchParams.get("filter") as WalletEngineFilterId | null;
  const query = url.searchParams.get("q") ?? undefined;
  const walletType = (url.searchParams.get("type") as WalletEngineWalletType | null) ?? "seller";

  if (transactionId) {
    const context = await getWalletEngineTransactionContext(auth.user.id, transactionId);
    if (!context) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    return NextResponse.json({ context });
  }

  const [config, context, summaries, analytics] = await Promise.all([
    getPublicWalletEngineConfig(),
    getWalletEngineContext(auth.user.id, walletType),
    listWalletEngineSummaries(auth.user.id, { filter: filter ?? undefined, query }),
    getWalletEngineAnalyticsForUser(auth.user.id),
  ]);

  return NextResponse.json({ config, context, summaries, analytics });
}
