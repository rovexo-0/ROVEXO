export function BuyerSkeleton() {
  return (
    <div className="buyer-page" aria-busy="true" aria-label="Loading buying tools">
      <div className="buyer-skeleton" style={{ height: 64 }} />
      <div className="buyer-skeleton" style={{ height: 180, borderRadius: 28 }} />
      <div className="buyer-quick-grid">
        <div className="buyer-skeleton" style={{ height: 104, borderRadius: 22 }} />
        <div className="buyer-skeleton" style={{ height: 104, borderRadius: 22 }} />
        <div className="buyer-skeleton" style={{ height: 104, borderRadius: 22 }} />
        <div className="buyer-skeleton" style={{ height: 104, borderRadius: 22 }} />
      </div>
      <div className="buyer-skeleton" style={{ height: 220, borderRadius: 24 }} />
    </div>
  );
}
