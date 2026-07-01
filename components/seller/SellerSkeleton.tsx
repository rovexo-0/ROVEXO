export function SellerSkeleton() {
  return (
    <div className="seller-page" aria-busy="true" aria-label="Loading seller dashboard">
      <div className="seller-skeleton" style={{ height: 64 }} />
      <div className="seller-skeleton" style={{ height: 180, borderRadius: 28 }} />
      <div className="seller-quick-grid">
        <div className="seller-skeleton" style={{ height: 104, borderRadius: 22 }} />
        <div className="seller-skeleton" style={{ height: 104, borderRadius: 22 }} />
        <div className="seller-skeleton" style={{ height: 104, borderRadius: 22 }} />
        <div className="seller-skeleton" style={{ height: 104, borderRadius: 22 }} />
      </div>
      <div className="seller-skeleton" style={{ height: 220, borderRadius: 24 }} />
    </div>
  );
}
