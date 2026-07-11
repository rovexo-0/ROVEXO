"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/ui/ListingCard";
import { HP_CANONICAL_LISTING_PROPS } from "@/components/homepage/canonical/constants";
import { runImageSimilaritySearch } from "@/lib/image-search/search";
import { clearImageSearchQuery, readImageSearchQuery } from "@/lib/image-search/storage";
import css from "@/components/homepage/canonical/CanonicalHomepage.module.css";

export function ImageSearchView() {
  const router = useRouter();
  const queryDataUrl = useMemo(() => readImageSearchQuery(), []);
  const [phase, setPhase] = useState<"searching" | "results" | "missing">(
    queryDataUrl ? "searching" : "missing",
  );
  const [matches, setMatches] = useState<Awaited<ReturnType<typeof runImageSimilaritySearch>>>([]);

  useEffect(() => {
    if (!queryDataUrl) return;

    const controller = new AbortController();

    void runImageSimilaritySearch(queryDataUrl, controller.signal)
      .then((results) => {
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

  useEffect(() => {
    return () => {
      clearImageSearchQuery();
    };
  }, []);

  if (phase === "missing") {
    return (
      <section className="rx-image-search-results" data-image-search="missing">
        <header className="rx-image-search-results__header">
          <h1 className="rx-image-search-results__title">Image Search</h1>
          <p className="rx-image-search-results__subtitle">Results similar to your photo</p>
        </header>
        <p className="rx-image-search-results__empty">Choose a photo from the homepage search camera to begin.</p>
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
        <p className="rx-image-search-results__subtitle">Results similar to your photo</p>
      </header>

      {queryDataUrl ? (
        <div className="rx-image-search-results__query" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={queryDataUrl} alt="" className="rx-image-search-results__thumb" width={72} height={72} />
        </div>
      ) : null}

      {phase === "searching" ? (
        <p className="rx-image-search-results__status" role="status" aria-live="polite">
          Searching...
        </p>
      ) : null}

      {phase === "results" ? (
        matches.length > 0 ? (
          <div className={css.feedGrid} data-hp-homepage="canonical">
            {matches.map(({ product }) => (
              <ListingCard key={product.id} product={product} {...HP_CANONICAL_LISTING_PROPS} />
            ))}
          </div>
        ) : (
          <p className="rx-image-search-results__empty">No similar listings found. Try another photo.</p>
        )
      ) : null}
    </section>
  );
}
