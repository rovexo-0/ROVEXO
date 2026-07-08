import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Card } from "@/components/ui/Card";
import { ALL_UK_LOCATIONS, findLocationBySlug, getLocationChildren } from "@/lib/seo/locations/uk";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { localBusinessJsonLd } from "@/lib/seo/json-ld";
import { getEligibleListings } from "@/lib/listings/eligible-listings";

type LocalPageProps = {
  params: Promise<{ location: string }>;
};

export async function generateMetadata({ params }: LocalPageProps): Promise<Metadata> {
  const { location: slug } = await params;
  const location = findLocationBySlug(slug);
  if (!location) return { title: "Location not found · ROVEXO" };

  return buildPageMetadata({
    title: `Buy & Sell in ${location.name} | ROVEXO`,
    description: `Discover local listings in ${location.name} on ROVEXO. Buy and sell with purchase protection across the UK.`,
    path: `/l/${slug}`,
  });
}

export default async function LocalLandingPage({ params }: LocalPageProps) {
  const { location: slug } = await params;
  const location = findLocationBySlug(slug);
  if (!location) notFound();

  const children = getLocationChildren(slug);
  const results = await getEligibleListings({ surface: "search", page: 1, pageSize: 12 });
  const jsonLd = localBusinessJsonLd({
    name: `ROVEXO ${location.name}`,
    locationName: location.name,
    path: `/l/${slug}`,
  });

  return (
    <BetaAppShell bottomNavTab="search">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="mx-auto max-w-6xl px-ds-4 py-ds-6">
        <h1 className="text-2xl font-bold">Marketplace in {location.name}</h1>
        <p className="mt-ds-2 text-sm text-text-secondary">
          Browse local listings and popular categories in {location.name}.
        </p>

        {children.length > 0 && (
          <section className="mt-ds-6">
            <h2 className="text-lg font-semibold">Areas in {location.name}</h2>
            <div className="mt-ds-3 flex flex-wrap gap-ds-2">
              {children.map((child) => (
                <Link
                  key={child.slug}
                  href={`/l/${child.slug}`}
                  className="rounded-full bg-surface-muted px-ds-3 py-ds-1 text-sm capitalize"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-ds-8">
          <h2 className="text-lg font-semibold">Popular categories</h2>
          <div className="mt-ds-3 grid gap-ds-3 sm:grid-cols-2 lg:grid-cols-3">
            {["cars", "phones", "furniture", "fashion", "electronics", "home-garden"].map((alias) => (
              <Link key={alias} href={`/browse/${alias}/${slug}`}>
                <Card className="p-ds-4 capitalize hover:bg-surface-muted">{alias.replace(/-/g, " ")} in {location.name}</Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-ds-8">
          <h2 className="text-lg font-semibold">Recent listings</h2>
          <p className="mt-ds-2 text-sm text-text-muted">{results.total} listings available</p>
        </section>
      </main>
    </BetaAppShell>
  );
}

export function generateStaticParams() {
  return ALL_UK_LOCATIONS.filter((location) => location.type === "city" || location.type === "nation").map(
    (location) => ({ location: location.slug }),
  );
}
