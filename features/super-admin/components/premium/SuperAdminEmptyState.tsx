type SuperAdminEmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
};

export function SuperAdminEmptyState({ icon = "📭", title, description }: SuperAdminEmptyStateProps) {
  return (
    <div className="sa-premium-empty" role="status">
      <span className="sa-premium-empty__icon" aria-hidden>{icon}</span>
      <strong>{title}</strong>
      {description ? <p className="text-sm">{description}</p> : null}
    </div>
  );
}

export function SuperAdminLoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-ds-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="sa-premium-skeleton" style={{ height: "3rem" }} />
      ))}
    </div>
  );
}
