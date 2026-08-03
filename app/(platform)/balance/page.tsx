import { redirect } from "next/navigation";

type BalanceLegacyRedirectProps = {
  searchParams: Promise<{ connect?: string }>;
};

/**
 * Legacy `/balance` → canonical `/wallet` (Blood XIII · one entry point).
 * Visible title remains Balance on the Wallet hub.
 */
export default async function BalanceLegacyRedirect({ searchParams }: BalanceLegacyRedirectProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.connect) query.set("connect", params.connect);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  redirect(`/wallet${suffix}`);
}

export async function generateMetadata() {
  return {
    title: "Balance | ROVEXO",
    robots: { index: false, follow: false },
  };
}
