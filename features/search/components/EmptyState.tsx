type EmptyStateProps = {
  variant: "idle" | "no-results";
  query?: string;
};

export function EmptyState({ variant, query }: EmptyStateProps) {
  if (variant === "idle") {
    return (
      <div className="flex flex-col items-center px-ds-4 py-ds-8 text-center">
        <p className="text-sm text-text-secondary">Start typing to search ROVEXO</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-ds-4 py-ds-8 text-center" role="status">
      <p className="text-base font-semibold text-text-primary">No results found</p>
      <p className="mt-ds-1 text-sm text-text-secondary">
        {query
          ? `Nothing matched “${query}”. Try a different search or browse categories.`
          : "Try a different search or browse categories."}
      </p>
    </div>
  );
}
