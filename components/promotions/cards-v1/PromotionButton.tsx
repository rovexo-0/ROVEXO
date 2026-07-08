type PromotionButtonProps = {
  label: string;
  recommended?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export function PromotionButton({
  label,
  recommended = false,
  disabled = false,
  onClick,
}: PromotionButtonProps) {
  return (
    <button
      type="button"
      className={recommended ? "promo-v1-btn promo-v1-btn--solid" : "promo-v1-btn"}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
