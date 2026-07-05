import { EmptyState } from "@/components/ui/EmptyState";

type SearchResultsEmptyProps = {
  variant: "idle" | "no-results";
  query?: string;
  /** What was being searched, for per-scope messaging (e.g. "products", "sellers"). */
  entity?: string;
};

function SearchIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

export function SearchResultsEmpty({ variant, query, entity = "results" }: SearchResultsEmptyProps) {
  if (variant === "idle") {
    return (
      <EmptyState
        icon={<SearchIcon />}
        title="Search ROVEXO"
        description="Find products, sellers, stores, and categories. Try trending searches or browse popular categories below."
        actionLabel="Browse categories"
        actionHref="/categories"
        className="mx-ds-4 border-none bg-transparent shadow-none"
      />
    );
  }

  const label = entity === "results" ? "results" : entity;
  const title = `No ${label} found`;
  const description = query
    ? `We couldn't find any ${label} for “${query}”. Try another keyword — check the spelling or use fewer words.`
    : `Try another keyword — check the spelling or use fewer words.`;

  return (
    <EmptyState
      icon={<SearchIcon />}
      title={title}
      description={description}
      suggestions={["Try a different keyword", "Check your spelling", "Remove filters"]}
      actionLabel="Browse categories"
      actionHref="/categories"
      className="mx-ds-4 border-none bg-transparent shadow-none"
    />
  );
}
