"use client";

import { HomepageSearchField } from "@/components/home/HomepageSearchField";

export function HomepageV3Search() {
  return (
    <section aria-label="Search" className="hp3-search">
      <HomepageSearchField inputId="hp3-search" className="hp3-search__field" />
    </section>
  );
}
