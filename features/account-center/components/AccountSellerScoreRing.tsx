import { cn } from "@/lib/cn";

const SCORE_RING_GRADIENT_ID = "ac-seller-score-ring-gradient";

type AccountSellerScoreRingProps = {
  score: number;
  className?: string;
};

export function AccountSellerScoreRing({ score, className }: AccountSellerScoreRingProps) {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div
      className={cn("ac-canonical__seller-score-ring", className)}
      role="img"
      aria-label={`Seller score ${normalized} out of 100`}
    >
      <svg viewBox="0 0 64 64" className="ac-canonical__seller-score-ring-svg" aria-hidden>
        <defs>
          <linearGradient id={SCORE_RING_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <circle
          className="ac-canonical__seller-score-ring-track"
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="5"
        />
        <circle
          className="ac-canonical__seller-score-ring-progress"
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          stroke={`url(#${SCORE_RING_GRADIENT_ID})`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div className="ac-canonical__seller-score-ring-copy">
        <span className="ac-canonical__seller-score-ring-value">{normalized}</span>
        <span className="ac-canonical__seller-score-ring-max">/100</span>
      </div>
    </div>
  );
}
