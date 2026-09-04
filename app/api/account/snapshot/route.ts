import { NextResponse } from "next/server";
import { fetchAccountHubSnapshot } from "@/lib/account-center/snapshot";
import { requireApiAuth } from "@/lib/auth/session";
import { fetchProfile } from "@/lib/profile/queries";
import {
  isSellerContext,
  normalizeSellerContext,
} from "@/lib/seller-context/seller-context-v1";
import { getWalletData } from "@/lib/wallet/store";

/**
 * Account snapshot — context-aware wallet payload (Phase 1F).
 * Query: ?sellerContext=individual|business
 * Default: individual (Account hub / Checkout).
 * Never silently substitutes the other wallet context.
 */
export async function GET(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const url = new URL(request.url);
  const raw = url.searchParams.get("sellerContext");
  if (raw != null && raw !== "" && !isSellerContext(raw)) {
    return NextResponse.json({ error: "Invalid seller context." }, { status: 400 });
  }
  const sellerContext = normalizeSellerContext(raw);

  try {
    const profile = await fetchProfile();
    const [snapshot, wallet] = await Promise.all([
      fetchAccountHubSnapshot(profile),
      getWalletData(auth.user.id, sellerContext).catch(() => null),
    ]);

    // Fail closed: never return a wallet tagged for another context.
    if (wallet?.walletContext && wallet.walletContext !== sellerContext) {
      return NextResponse.json(
        {
          snapshot,
          wallet: null,
          sellerContext,
          error: "wallet_context_mismatch",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ snapshot, wallet, sellerContext });
  } catch {
    return NextResponse.json({ error: "Unable to load account snapshot." }, { status: 500 });
  }
}
