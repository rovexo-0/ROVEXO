"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import RovexoHeaderV2 from "@/components/header/RovexoHeaderV2";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { HomePageShell } from "@/components/home/HomePageShell";
import { ScrollContainer } from "@/components/ui/ScrollContainer";
import { AuctionCard } from "@/features/auctions/components/AuctionCard";
import { AuctionsCategoryGrid } from "@/features/auctions/components/AuctionsCategoryGrid";
import { AuctionsEmptyState } from "@/features/auctions/components/AuctionsEmptyState";
import { AUCTION_FILTERS } from "@/lib/auctions/constants";
import { filterAuctions } from "@/lib/auctions/utils";
import type { AuctionFilter, AuctionsPageData } from "@/lib/auctions/types";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type AuctionsPageProps = {
  initialData: AuctionsPageData;
};

function AuctionsSectionBlock({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="px-ds-4">
      <h2 id={id} className="auctions-section-title mb-ds-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function AuctionsPage({ initialData }: AuctionsPageProps) {
  const [data, setData] = useState(initialData);
  const [filter, setFilter] = useState<AuctionFilter>("all");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);

  const filteredItems = useMemo(
    () => filterAuctions(data.all, filter, categorySlug),
    [categorySlug, data.all, filter],
  );

  const hasAuctions = data.all.length > 0;

  const refreshFiltered = useCallback(async (nextFilter: AuctionFilter, nextCategory: string | null) => {
    const params = new URLSearchParams();
    if (nextFilter !== "all") params.set("filter", nextFilter);
    if (nextCategory) params.set("category", nextCategory);

    const response = await fetch(`/api/auctions?${params.toString()}`, { cache: "no-store" });
    if (!response.ok) return;

    const payload = (await response.json()) as {
      stats: AuctionsPageData["stats"];
      categories: AuctionsPageData["categories"];
      featured: AuctionsPageData["featured"];
      endingSoon: AuctionsPageData["endingSoon"];
      newest: AuctionsPageData["newest"];
      mostWatched: AuctionsPageData["mostWatched"];
      items: AuctionsPageData["all"];
    };

    setData((current) => ({
      ...current,
      stats: payload.stats,
      categories: payload.categories,
      featured: payload.featured,
      endingSoon: payload.endingSoon,
      newest: payload.newest,
      mostWatched: payload.mostWatched,
      all: payload.items.length ? payload.items : current.all,
    }));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshFiltered(filter, categorySlug);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [categorySlug, filter, refreshFiltered]);

  return (
    <BetaAppShell bottomNavTab="home">
      <HomePageShell header={<RovexoHeaderV2 />} bottomNav={null}>
        <ScrollContainer withBottomNav className="auctions-page flex flex-col gap-ds-3">
          <header className="px-ds-4 pt-ds-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              🏆 Live Auctions
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Bid on unique items across every category.
            </p>

            <div className="auctions-stat-grid mt-ds-3">
              {[
                { label: "Live Auctions", value: data.stats.liveAuctions },
                { label: "Ending Soon", value: data.stats.endingSoon },
                { label: "Active Bidders", value: data.stats.activeBidders },
                { label: "Watching Now", value: data.stats.watchingNow },
              ].map((stat) => (
                <div key={stat.label} className="auctions-stat-card">
                  <p className="auctions-stat-card__value">{stat.value}</p>
                  <p className="auctions-stat-card__label">{stat.label}</p>
                </div>
              ))}
            </div>
          </header>

          <section aria-label="Auction filters" className="px-ds-4">
            <div className="auctions-filter-rail">
              {AUCTION_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "auctions-filter-chip",
                    filter === item.id && "auctions-filter-chip--active",
                    focusRing,
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          {!hasAuctions ? (
            <AuctionsEmptyState />
          ) : (
            <>
              <AuctionsCategoryGrid
                categories={data.categories}
                activeSlug={categorySlug}
                onSelect={setCategorySlug}
              />

              {data.featured.length > 0 ? (
                <AuctionsSectionBlock id="featured-auctions-heading" title="Featured Auctions">
                  <div className="auctions-featured-carousel -mx-ds-4 px-ds-4">
                    {data.featured.map((auction) => (
                      <AuctionCard key={auction.id} auction={auction} variant="featured" />
                    ))}
                  </div>
                </AuctionsSectionBlock>
              ) : null}

              {data.endingSoon.length > 0 ? (
                <AuctionsSectionBlock id="ending-soon-heading" title="Ending Soon">
                  <div className="auctions-list-grid">
                    {data.endingSoon.map((auction) => (
                      <AuctionCard key={auction.id} auction={auction} />
                    ))}
                  </div>
                </AuctionsSectionBlock>
              ) : null}

              {data.newest.length > 0 ? (
                <AuctionsSectionBlock id="new-auctions-heading" title="New Auctions">
                  <div className="auctions-list-grid">
                    {data.newest.map((auction) => (
                      <AuctionCard key={auction.id} auction={auction} />
                    ))}
                  </div>
                </AuctionsSectionBlock>
              ) : null}

              {data.mostWatched.length > 0 ? (
                <AuctionsSectionBlock id="most-watched-heading" title="Most Watched">
                  <div className="auctions-list-grid">
                    {data.mostWatched.map((auction) => (
                      <AuctionCard key={auction.id} auction={auction} />
                    ))}
                  </div>
                </AuctionsSectionBlock>
              ) : null}

              {filteredItems.length > 0 && (filter !== "all" || categorySlug) ? (
                <AuctionsSectionBlock
                  id="filtered-auctions-heading"
                  title={filter === "all" && !categorySlug ? "All Live Auctions" : "Results"}
                >
                  <div className="auctions-list-grid">
                    {filteredItems.map((auction) => (
                      <AuctionCard key={`${auction.id}-filtered`} auction={auction} />
                    ))}
                  </div>
                </AuctionsSectionBlock>
              ) : null}
            </>
          )}
        </ScrollContainer>
      </HomePageShell>
    </BetaAppShell>
  );
}
