type PromotionButtonProps = {
  label: string;
  recommended?: boolean;
  disabled?: boolean;
  testId?: string;
  onClick?: () => void;
};

export function PromotionButton({
  label,
  recommended = false,
  disabled = false,
  testId,
  onClick,
}: PromotionButtonProps) {
  return (
    <button
      type="button"
      className={recommended ? "promo-v1-btn promo-v1-btn--solid" : "promo-v1-btn"}
      disabled={disabled}
      data-testid={testId}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
