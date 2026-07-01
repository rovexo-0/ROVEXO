export function SellerEmptyState({
  title,
  message,
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="seller-empty">
      <p className="seller-empty__title">{title}</p>
      {message ? <p className="seller-empty__message">{message}</p> : null}
    </div>
  );
}
