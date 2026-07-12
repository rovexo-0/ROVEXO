import { NextResponse } from "next/server";
import { fetchAccountHubSnapshot } from "@/lib/account-center/snapshot";
import { requireApiAuth } from "@/lib/auth/session";
import { fetchProfile } from "@/lib/profile/queries";
import { getWalletData } from "@/lib/wallet/store";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const profile = await fetchProfile();
    const [snapshot, wallet] = await Promise.all([
      fetchAccountHubSnapshot(profile),
      getWalletData(auth.user.id).catch(() => null),
    ]);

    return NextResponse.json({ snapshot, wallet });
  } catch {
    return NextResponse.json({ error: "Unable to load account snapshot." }, { status: 500 });
  }
}
