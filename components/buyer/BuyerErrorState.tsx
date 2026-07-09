export function BuyerErrorState({ message = "Unable to load buying tools." }: { message?: string }) {
  return (
    <div className="buyer-empty" role="alert">
      <p className="buyer-empty__title">Something went wrong</p>
      <p className="buyer-empty__message">{message}</p>
    </div>
  );
}
