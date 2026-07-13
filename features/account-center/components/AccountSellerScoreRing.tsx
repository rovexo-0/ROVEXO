import { cn } from "@/lib/cn";

type AccountSellerScoreRingProps = {
  score: number;
  className?: string;
};

export function AccountSellerScoreRing({ score, className }: AccountSellerScoreRingProps) {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div
      className={cn("ac-canonical__seller-score-ring", className)}
      role="img"
      aria-label={`Seller score ${normalized} out of 100`}
    >
      <svg viewBox="0 0 80 80" className="ac-canonical__seller-score-ring-svg" aria-hidden>
        <circle
          className="ac-canonical__seller-score-ring-track"
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="6"
        />
        <circle
          className="ac-canonical__seller-score-ring-progress"
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <span className="ac-canonical__seller-score-ring-value">{normalized}</span>
    </div>
  );
}
