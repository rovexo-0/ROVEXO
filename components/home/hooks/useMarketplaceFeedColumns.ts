"use client";

import { useEffect, useState } from "react";
import {
  HP_FEED_COLUMN_QUERIES,
  HP_FEED_DEFAULT_COLUMNS,
  matchFeedColumnsFromMedia,
} from "@/lib/homepage/canonical-responsive";

export function useMarketplaceFeedColumns(): number {
  const [columns, setColumns] = useState(HP_FEED_DEFAULT_COLUMNS);

  useEffect(() => {
    const media = HP_FEED_COLUMN_QUERIES.map(({ query, columns: cols }) => ({
      mql: window.matchMedia(query),
      columns: cols,
    }));

    const sync = () => {
      setColumns(matchFeedColumnsFromMedia());
    };

    sync();
    for (const entry of media) {
      entry.mql.addEventListener("change", sync);
    }

    return () => {
      for (const entry of media) {
        entry.mql.removeEventListener("change", sync);
      }
    };
  }, []);

  return columns;
}
