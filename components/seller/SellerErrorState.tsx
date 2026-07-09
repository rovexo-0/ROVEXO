export function SellerErrorState({ message = "Unable to load selling tools." }: { message?: string }) {
  return (
    <div className="seller-empty" role="alert">
      <p className="seller-empty__title">Something went wrong</p>
      <p className="seller-empty__message">{message}</p>
    </div>
  );
}
