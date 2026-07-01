"use client";

import { useEffect, useState } from "react";

const COLUMN_QUERIES = [
  { query: "(min-width: 1440px)", columns: 5 },
  { query: "(min-width: 1024px)", columns: 4 },
  { query: "(min-width: 768px)", columns: 3 },
] as const;

export function useMarketplaceFeedColumns(): number {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const media = COLUMN_QUERIES.map(({ query, columns: cols }) => ({
      mql: window.matchMedia(query),
      columns: cols,
    }));

    const sync = () => {
      for (const entry of media) {
        if (entry.mql.matches) {
          setColumns(entry.columns);
          return;
        }
      }
      setColumns(2);
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
