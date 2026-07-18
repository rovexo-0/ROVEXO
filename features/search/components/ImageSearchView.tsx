"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/ui/ListingCard";
import { ProductGridSkeleton } from "@/components/home/ProductSectionStates";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import { readImageSearchQuery } from "@/lib/image-search/storage";
import type { ImageSearchMatch } from "@/lib/image-search/search";
import css from "@/components/homepage/canonical/CanonicalHomepage.module.css";
import "@/styles/rovexo/image-search.css";

const EXACT_SCORE = 0.85;

function priceBucket(price: number): string {
  if (price < 25) return "Under £25";
  if (price < 50) return "£25–£50";
  if (price < 100) return "£50–£100";
  if (price < 250) return "£100–£250";
  return "£250+";
}

export function ImageSearchView() {
  const router = useRouter();
  const queryDataUrl = useMemo(() => readImageSearchQuery(), []);
  const [phase, setPhase] = useState<"searching" | "results" | "missing">(
    queryDataUrl ? "searching" : "missing",
  );
  const [matches, setMatches] = useState<ImageSearchMatch[]>([]);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);

  useEffect(() => {
    if (!queryDataUrl) return;

    const controller = new AbortController();

    void import("@/lib/image-search/search")
      .then(({ runImageSimilaritySearch }) =>
        runImageSimilaritySearch(queryDataUrl, controller.signal),
      )
      .then((results) => {
        if (controller.signal.aborted) return;
        setMatches(results);
        setPhase("results");
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setMatches([]);
          setPhase("results");
        }
      });

    return () => controller.abort();
  }, [queryDataUrl]);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { product } of matches) {
      const brand = product.brand?.trim();
      if (!brand) continue;
      counts.set(brand, (counts.get(brand) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([brand]) => brand);
  }, [matches]);

  const priceRanges = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { product } of matches) {
      const bucket = priceBucket(product.price);
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([bucket]) => bucket);
  }, [matches]);

  const filtered = useMemo(() => {
    return matches.filter(({ product, score }) => {
      if (brandFilter && product.brand?.trim() !== brandFilter) return false;
      if (priceFilter && priceBucket(product.price) !== priceFilter) return false;
      return score >= 0;
    });
  }, [matches, brandFilter, priceFilter]);

  const exactMatches = filtered.filter(({ score }) => score >= EXACT_SCORE);
  const similarMatches = filtered.filter(({ score }) => score < EXACT_SCORE);

  if (phase === "missing") {
    return (
      <section className="rx-image-search-results" data-image-search="missing">
        <header className="rx-image-search-results__header">
          <h1 className="rx-image-search-results__title">Image Search</h1>
          <p className="rx-image-search-results__subtitle">
            Exact matches, similar products, brands and price ranges
          </p>
        </header>
        <p className="rx-image-search-results__empty">
          Use the camera on Homepage or Search to take or choose a photo.
        </p>
        <button type="button" className="rx-image-search-results__back" onClick={() => router.push("/")}>
          Back to Home
        </button>
      </section>
    );
  }

  return (
    <section className="rx-image-search-results" data-image-search={phase}>
      <header className="rx-image-search-results__header">
        <h1 className="rx-image-search-results__title">Image Search</h1>
        <p className="rx-image-search-results__subtitle">
          Exact matches, similar products, brands and price ranges
        </p>
      </header>

      {queryDataUrl ? (
        <div className="rx-image-search-results__query" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={queryDataUrl} alt="" className="rx-image-search-results__thumb" width={72} height={72} />
        </div>
      ) : null}

      {phase === "searching" ? (
        <>
          <p className="rx-image-search-results__status sr-only" role="status" aria-live="polite">
            Searching...
          </p>
          <div className="rx-image-search-results__grid-slot" aria-busy="true">
            <ProductGridSkeleton count={8} />
          </div>
        </>
      ) : null}

      {phase === "results" && matches.length > 0 ? (
        <div className="rx-image-search-results__facets" role="group" aria-label="Refine results">
          {brands.length > 0 ? (
            <div className="rx-image-search-results__facet-row">
              <span className="rx-image-search-results__facet-label">Similar brands</span>
              <div className="rx-image-search-results__chips">
                {brands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    className={
                      brandFilter === brand
                        ? "rx-image-search-results__chip rx-image-search-results__chip--active"
                        : "rx-image-search-results__chip"
                    }
                    aria-pressed={brandFilter === brand}
                    onClick={() => setBrandFilter((current) => (current === brand ? null : brand))}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {priceRanges.length > 0 ? (
            <div className="rx-image-search-results__facet-row">
              <span className="rx-image-search-results__facet-label">Similar prices</span>
              <div className="rx-image-search-results__chips">
                {priceRanges.map((bucket) => (
                  <button
                    key={bucket}
                    type="button"
                    className={
                      priceFilter === bucket
                        ? "rx-image-search-results__chip rx-image-search-results__chip--active"
                        : "rx-image-search-results__chip"
                    }
                    aria-pressed={priceFilter === bucket}
                    onClick={() => setPriceFilter((current) => (current === bucket ? null : bucket))}
                  >
                    {bucket}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {phase === "results" ? (
        filtered.length > 0 ? (
          <>
            {exactMatches.length > 0 ? (
              <section className="rx-image-search-results__group" aria-label="Exact matches">
                <h2 className="rx-image-search-results__group-title">Exact matches</h2>
                <div className={css.feedGrid} data-hp-homepage="canonical">
                  {exactMatches.map(({ product }) => (
                    <ListingCard key={product.id} product={product} {...HP_CANONICAL_LISTING_PROPS} />
                  ))}
                </div>
              </section>
            ) : null}
            {similarMatches.length > 0 ? (
              <section className="rx-image-search-results__group" aria-label="Similar products">
                <h2 className="rx-image-search-results__group-title">Similar products</h2>
                <div className={css.feedGrid} data-hp-homepage="canonical">
                  {similarMatches.map(({ product }) => (
                    <ListingCard key={product.id} product={product} {...HP_CANONICAL_LISTING_PROPS} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <p className="rx-image-search-results__empty">No similar listings found. Try another photo.</p>
        )
      ) : null}
    </section>
  );
}
