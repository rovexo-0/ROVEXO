"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/ui/ListingCard";
import { ProductGridSkeleton } from "@/components/home/ProductSectionStates";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import { readImageSearchQuery } from "@/lib/image-search/storage";
import {
  getImageSearchResults,
  setImageSearchResults,
  type CameraSearchResultsPayload,
} from "@/lib/image-search/results-store";
import type { ImageSearchMatch } from "@/lib/image-search/search";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";
import { CAMERA_SEARCH_PERFORMANCE_V1 } from "@/lib/search/camera-search-performance-v1";
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

/**
 * Camera Search RESULTS PAGE — Master Freeze.
 * Displays ONE precomputed state from Confirm → AUTO SEARCH.
 * Forbidden: refresh · reload · second search · empty page.
 */
export function ImageSearchView() {
  const router = useRouter();
  const [payload, setPayload] = useState<CameraSearchResultsPayload | null>(() => {
    const existing = getImageSearchResults();
    return existing?.matches?.length ? existing : null;
  });
  const [hydrating, setHydrating] = useState(() => {
    const existing = getImageSearchResults();
    return !(existing?.matches?.length);
  });
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);

  useEffect(() => {
    if (payload?.matches?.length) return;

    // Fail-closed recovery only (direct URL / lost memory) — still ONE parallel search, never refresh.
    let cancelled = false;
    void (async () => {
      try {
        const { runCameraSearchMaster } = await import("@/lib/image-search/search");
        const query = readImageSearchQuery();
        const next = await runCameraSearchMaster(query);
        if (cancelled) return;
        setImageSearchResults(next);
        setPayload(next);
      } catch {
        if (!cancelled) {
          setPayload({
            queryDataUrl: readImageSearchQuery(),
            matches: [],
            categories: [],
            filters: { brands: [], priceRanges: [] },
            hasExactMatch: false,
            readyAt: Date.now(),
          });
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload?.matches?.length]);

  const matches = useMemo(
    (): ImageSearchMatch[] => payload?.matches ?? [],
    [payload?.matches],
  );
  const hasExactMatch = payload?.hasExactMatch ?? false;
  const queryDataUrl = payload?.queryDataUrl ?? null;
  const noExactCopy = CAMERA_SEARCH_V1.noExactMatchCopy;

  const brands = useMemo(() => {
    if (payload?.filters.brands?.length) return payload.filters.brands;
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
  }, [matches, payload]);

  const categories = useMemo(() => {
    if (payload?.categories?.length) return payload.categories;
    const counts = new Map<string, number>();
    for (const { product } of matches) {
      for (const crumb of product.categoryBreadcrumbs ?? []) {
        const name = crumb.name?.trim();
        if (!name) continue;
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category]) => category);
  }, [matches, payload]);

  const priceRanges = useMemo(() => {
    if (payload?.filters.priceRanges?.length) return payload.filters.priceRanges;
    const counts = new Map<string, number>();
    for (const { product } of matches) {
      const bucket = priceBucket(product.price);
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([bucket]) => bucket);
  }, [matches, payload]);

  const filtered = useMemo(() => {
    return matches.filter(({ product }) => {
      if (brandFilter && product.brand?.trim() !== brandFilter) return false;
      if (
        categoryFilter &&
        !(product.categoryBreadcrumbs ?? []).some((crumb) => crumb.name?.trim() === categoryFilter)
      ) {
        return false;
      }
      if (priceFilter && priceBucket(product.price) !== priceFilter) return false;
      return true;
    });
  }, [matches, brandFilter, categoryFilter, priceFilter]);

  const exactMatches = filtered.filter(
    ({ score, recommended }) => score >= EXACT_SCORE && !recommended,
  );
  const similarMatches = filtered.filter(
    ({ score, recommended }) => score < EXACT_SCORE && score >= 0.42 && !recommended,
  );
  const recommendedMatches = filtered.filter(
    ({ recommended, score }) => recommended || score < 0.42,
  );

  const primaryProducts = exactMatches.length > 0 ? exactMatches : similarMatches;
  const secondarySimilar =
    exactMatches.length > 0
      ? [...similarMatches, ...recommendedMatches]
      : recommendedMatches.filter(
          (entry) => !primaryProducts.some((primary) => primary.product.id === entry.product.id),
        );

  if (hydrating) {
    return (
      <section
        className="rx-image-search-results"
        data-image-search="hydrating"
        data-camera-search={CAMERA_SEARCH_V1.version}
      >
        <div className="rx-image-search-results__grid-slot" aria-busy="true">
          <ProductGridSkeleton count={8} />
        </div>
      </section>
    );
  }

  return (
    <section
      className="rx-image-search-results"
      data-image-search="results"
      data-camera-search={CAMERA_SEARCH_V1.version}
      data-camera-search-performance={CAMERA_SEARCH_PERFORMANCE_V1.version}
    >
      <header className="rx-image-search-results__header">
        <h1 className="rx-image-search-results__title">Image Search</h1>
        <p className="rx-image-search-results__subtitle">
          {hasExactMatch
            ? "Match found — products, similar items, categories and brands"
            : noExactCopy}
        </p>
      </header>

      {queryDataUrl ? (
        <div className="rx-image-search-results__query" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={queryDataUrl} alt="" className="rx-image-search-results__thumb" width={72} height={72} />
        </div>
      ) : null}

      {!hasExactMatch ? (
        <p className="rx-image-search-results__banner" role="status">
          {noExactCopy}
        </p>
      ) : null}

      <div className="rx-image-search-results__facets" role="group" aria-label="Relevant filters">
        {categories.length > 0 ? (
          <div className="rx-image-search-results__facet-row">
            <span className="rx-image-search-results__facet-label">Relevant categories</span>
            <div className="rx-image-search-results__chips">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={
                    categoryFilter === category
                      ? "rx-image-search-results__chip rx-image-search-results__chip--active"
                      : "rx-image-search-results__chip"
                  }
                  aria-pressed={categoryFilter === category}
                  onClick={() =>
                    setCategoryFilter((current) => (current === category ? null : category))
                  }
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {brands.length > 0 ? (
          <div className="rx-image-search-results__facet-row">
            <span className="rx-image-search-results__facet-label">Relevant brands</span>
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
            <span className="rx-image-search-results__facet-label">Relevant filters</span>
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

      {primaryProducts.length > 0 ? (
        <section
          className="rx-image-search-results__group"
          aria-label={hasExactMatch ? "Exact Products" : "Relevant Products"}
        >
          <h2 className="rx-image-search-results__group-title">
            {hasExactMatch ? "Exact Products" : "Relevant Products"}
          </h2>
          <div className={css.feedGrid} data-hp-homepage="canonical">
            {primaryProducts.map(({ product }) => (
              <ListingCard key={product.id} product={product} {...HP_CANONICAL_LISTING_PROPS} />
            ))}
          </div>
        </section>
      ) : null}

      {secondarySimilar.length > 0 ? (
        <section className="rx-image-search-results__group" aria-label="Similar products">
          <h2 className="rx-image-search-results__group-title">Similar Products</h2>
          <div className={css.feedGrid} data-hp-homepage="canonical">
            {secondarySimilar.map(({ product }) => (
              <ListingCard key={`sim-${product.id}`} product={product} {...HP_CANONICAL_LISTING_PROPS} />
            ))}
          </div>
        </section>
      ) : null}

      {primaryProducts.length === 0 && secondarySimilar.length === 0 && filtered.length > 0 ? (
        <section className="rx-image-search-results__group" aria-label="Recommended products">
          <h2 className="rx-image-search-results__group-title">Recommended Products</h2>
          <div className={css.feedGrid} data-hp-homepage="canonical">
            {filtered.map(({ product }) => (
              <ListingCard key={`rec-${product.id}`} product={product} {...HP_CANONICAL_LISTING_PROPS} />
            ))}
          </div>
        </section>
      ) : null}

      {filtered.length === 0 && matches.length > 0 ? (
        <section className="rx-image-search-results__group" aria-label="Recommended products">
          <h2 className="rx-image-search-results__group-title">Recommended Products</h2>
          <div className={css.feedGrid} data-hp-homepage="canonical">
            {matches.map(({ product }) => (
              <ListingCard key={`all-${product.id}`} product={product} {...HP_CANONICAL_LISTING_PROPS} />
            ))}
          </div>
        </section>
      ) : null}

      {matches.length === 0 ? (
        <div className="rx-image-search-results__recover">
          <p className="rx-image-search-results__banner" role="status">
            {noExactCopy}
          </p>
          <button
            type="button"
            className="rx-image-search-results__back"
            onClick={() => router.replace("/")}
          >
            Browse homepage
          </button>
        </div>
      ) : null}
    </section>
  );
}
