import { AccountCanonicalShell } from "@/features/account-canonical";
import { CanonicalCard, CanonicalInfoBlock } from "@/src/components/canonical";
import { requireAuthContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/wallet/utils";
import { privatePageMetadata } from "@/lib/seo/private-metadata";
import { redirect } from "next/navigation";

export const metadata = {
  ...privatePageMetadata,
  title: "Offers · ROVEXO",
};

type OffersPageProps = {
  searchParams: Promise<{ role?: string }>;
};

export default async function AccountOffersPage({ searchParams }: OffersPageProps) {
  const params = await searchParams;
  const role = params.role === "seller" ? "seller" : "buyer";

  let userId: string;
  try {
    const auth = await requireAuthContext();
    userId = auth.user.id;
  } catch {
    redirect(`/login?next=/account/offers${role === "seller" ? "?role=seller" : ""}`);
  }

  const supabase = await createClient();
  const column = role === "seller" ? "seller_id" : "buyer_id";
  const { data: offers } = await supabase
    .from("offers")
    .select("id, amount, status, created_at, products(title)")
    .eq(column, userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (offers ?? []).map((offer) => {
    const product = offer.products as { title?: string } | { title?: string }[] | null;
    const productTitle = Array.isArray(product) ? product[0]?.title : product?.title;
    return {
      id: offer.id as string,
      amount: Number(offer.amount),
      status: String(offer.status),
      productTitle: productTitle ?? "Offer",
    };
  });

  return (
    <AccountCanonicalShell
      title="Offers"
      backHref={role === "seller" ? "/seller" : "/account/buying"}
      backLabel={role === "seller" ? "Selling" : "Buying"}
      showHeaderTitle
    >
      {rows.length === 0 ? (
        <CanonicalCard variant="list" className="px-ds-4 py-ds-4">
          <CanonicalInfoBlock variant="description">No offers yet.</CanonicalInfoBlock>
        </CanonicalCard>
      ) : (
        <CanonicalCard variant="list">
          {rows.map((offer) => (
            <div key={offer.id} className="cds-menu-row flex flex-col gap-ds-1 px-ds-4 py-ds-4 text-left">
              <span className="cds-menu-row__title">{offer.productTitle}</span>
              <span className="cds-menu-row__subtitle">
                {formatCurrency(offer.amount)} · {offer.status}
              </span>
            </div>
          ))}
        </CanonicalCard>
      )}
    </AccountCanonicalShell>
  );
}
