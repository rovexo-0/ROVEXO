"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/ui/ListingCard";
import { ProductGridSkeleton } from "@/components/home/ProductSectionStates";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import { readImageSearchQuery } from "@/lib/image-search/storage";
import type { ImageSearchMatch } from "@/lib/image-search/search";
import { CAMERA_SEARCH_V1 } from "@/lib/search/camera-search-v1-freeze";
import { CAMERA_SEARCH_PERFORMANCE_V1 } from "@/lib/search/camera-search-performance-v1";
import type { ImageSearchProgressStep } from "@/lib/image-search/search";
import css from "@/components/homepage/canonical/CanonicalHomepage.module.css";
import "@/styles/rovexo/image-search.css";

const EXACT_SCORE = 0.85;
/** Brief polish only — never pad to 2–30s; results as soon as matching finishes. */
const MIN_UX_MS = CAMERA_SEARCH_PERFORMANCE_V1.targetsMs.preparingResults;
const ABSOLUTE_MAX_MS = CAMERA_SEARCH_PERFORMANCE_V1.targetsMs.absoluteMaximum;

const CHECKLIST: { step: ImageSearchProgressStep; label: string }[] = [
  { step: "searching", label: CAMERA_SEARCH_PERFORMANCE_V1.loadingChecklist[0] },
  { step: "products", label: CAMERA_SEARCH_PERFORMANCE_V1.loadingChecklist[1] },
  { step: "categories", label: CAMERA_SEARCH_PERFORMANCE_V1.loadingChecklist[2] },
  { step: "listings", label: CAMERA_SEARCH_PERFORMANCE_V1.loadingChecklist[3] },
  { step: "similar", label: CAMERA_SEARCH_PERFORMANCE_V1.loadingChecklist[4] },
  { step: "recommendations", label: CAMERA_SEARCH_PERFORMANCE_V1.loadingChecklist[5] },
  { step: "preparing", label: CAMERA_SEARCH_PERFORMANCE_V1.loadingChecklist[6] },
];

function priceBucket(price: number): string {
  if (price < 25) return "Under £25";
  if (price < 50) return "£25–£50";
  if (price < 100) return "£50–£100";
  if (price < 250) return "£100–£250";
  return "£250+";
}

/**
 * Camera Search results — Performance Master Freeze.
 * Parallel matching · ONE corpus API · zero dead ends · no refresh/reload/second search.
 */
export function ImageSearchView() {
  const router = useRouter();
  const queryDataUrl = useMemo(() => readImageSearchQuery(), []);
  const [phase, setPhase] = useState<"searching" | "results">("searching");
  const [doneSteps, setDoneSteps] = useState<Set<string>>(() => new Set(["searching"]));
  const [matches, setMatches] = useState<ImageSearchMatch[]>([]);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<string | null>(null);
  const [hasExactMatch, setHasExactMatch] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const startedAt = Date.now();
    const hardCap = window.setTimeout(() => {
      if (!controller.signal.aborted) setPhase("results");
    }, ABSOLUTE_MAX_MS);

    function mark(step: ImageSearchProgressStep) {
      setDoneSteps((current) => {
        const next = new Set(current);
        next.add(step);
        if (step === "products") next.add("searching");
        return next;
      });
    }

    async function run() {
      try {
        const { runImageSimilaritySearch } = await import("@/lib/image-search/search");
        const { fetchActiveListingCorpus } = await import("@/lib/image-search/corpus");

        let results: ImageSearchMatch[] = [];
        if (queryDataUrl) {
          results = await runImageSimilaritySearch(queryDataUrl, controller.signal, mark);
        }
        if (!controller.signal.aborted && results.length === 0) {
          mark("products");
          mark("categories");
          mark("listings");
          mark("similar");
          mark("recommendations");
          const corpus = await fetchActiveListingCorpus(controller.signal);
          results = corpus.slice(0, 24).map((product) => ({
            product,
            score: 0.4,
            recommended: true,
          }));
          mark("preparing");
        }

        if (controller.signal.aborted) return;

        const exact = results.some((entry) => entry.score >= EXACT_SCORE && !entry.recommended);
        setHasExactMatch(exact);
        setMatches(results);

        // Performance Freeze: results ASAP (soft UX floor only). Forbidden: 10–30s waits / refresh.
        const elapsed = Date.now() - startedAt;
        const wait = Math.max(0, Math.min(MIN_UX_MS, ABSOLUTE_MAX_MS) - elapsed);
        window.setTimeout(() => {
          if (!controller.signal.aborted) setPhase("results");
        }, wait);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        try {
          const { fetchActiveListingCorpus } = await import("@/lib/image-search/corpus");
          const corpus = await fetchActiveListingCorpus();
          setHasExactMatch(false);
          setMatches(
            corpus.slice(0, 24).map((product) => ({
              product,
              score: 0.4,
              recommended: true,
            })),
          );
        } catch {
          setMatches([]);
        }
        setPhase("results");
      }
    }

    void run();
    return () => {
      controller.abort();
      window.clearTimeout(hardCap);
    };
  }, [queryDataUrl]);

  const noExactCopy = CAMERA_SEARCH_PERFORMANCE_V1.noExactMatchCopy;
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

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { product } of matches) {
      const crumbs = product.categoryBreadcrumbs ?? [];
      for (const crumb of crumbs) {
        const name = crumb.name?.trim();
        if (!name) continue;
        counts.set(name, (counts.get(name) ?? 0) + 1);
      }
      const leaf = crumbs.at(-1)?.name?.trim();
      if (leaf) counts.set(leaf, (counts.get(leaf) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category]) => category);
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

  return (
    <section
      className="rx-image-search-results"
      data-image-search={phase}
      data-camera-search={CAMERA_SEARCH_V1.version}
      data-camera-search-performance={CAMERA_SEARCH_PERFORMANCE_V1.version}
    >
      <header className="rx-image-search-results__header">
        <h1 className="rx-image-search-results__title">Image Search</h1>
        <p className="rx-image-search-results__subtitle">
          {phase === "searching"
            ? "Searching....."
            : hasExactMatch
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

      {phase === "searching" ? (
        <>
          <ol className="rx-image-search-results__checklist" role="status" aria-live="polite">
            {CHECKLIST.map(({ step, label }) => {
              const done = doneSteps.has(step);
              return (
                <li
                  key={step}
                  className={
                    done
                      ? "rx-image-search-results__check rx-image-search-results__check--done"
                      : "rx-image-search-results__check"
                  }
                >
                  <span aria-hidden>{done ? "✓" : "·"}</span>
                  <span>{label}</span>
                </li>
              );
            })}
          </ol>
          <div className="rx-image-search-results__grid-slot" aria-busy="true">
            <ProductGridSkeleton count={8} />
          </div>
        </>
      ) : null}

      {phase === "results" ? (
        <>
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

          {/* Absolute fail-safe shelf — never leave an empty results page */}
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
                onClick={() => router.push("/")}
              >
                Browse homepage
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
