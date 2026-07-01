type BuyerEmptyStateProps = {
  title: string;
  message?: string;
};

export function BuyerEmptyState({ title, message }: BuyerEmptyStateProps) {
  return (
    <div className="buyer-empty" role="status">
      <p className="buyer-empty__title">{title}</p>
      {message ? <p className="buyer-empty__message">{message}</p> : null}
    </div>
  );
}
