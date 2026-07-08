"use client";

import { HomepageSearchField } from "@/components/home/HomepageSearchField";

export function HomepageV4Search() {
  return (
    <section aria-label="Search" className="rx4-search">
      <HomepageSearchField inputId="rx4-search" className="rx4-search__field" />
    </section>
  );
}
