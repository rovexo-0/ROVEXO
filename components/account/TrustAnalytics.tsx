import Link from "next/link";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

export type TrustSentiment = {
  positive: number;
  neutral: number;
  negative: number;
};

type TrustAnalyticsProps = {
  score: number;
  sentiment: TrustSentiment;
};

const R = 52;
const C = 2 * Math.PI * R;

const SEGMENT_COLORS = {
  positive: "#22C55E",
  neutral: "#F59E0B",
  negative: "#EF4444",
} as const;

/**
 * Circular trust ring: the sentiment breakdown (positive / neutral / negative)
 * renders as proportional arc segments with the trust score in the centre, plus
 * a colour-coded legend. Links to the Trust Centre.
 */
export function TrustAnalytics({ score, sentiment }: TrustAnalyticsProps) {
  const total = sentiment.positive + sentiment.neutral + sentiment.negative || 1;
  const order: (keyof TrustSentiment)[] = ["positive", "neutral", "negative"];

  let cumulative = 0;
  const segments = order.map((key) => {
    const fraction = sentiment[key] / total;
    const seg = {
      key,
      color: SEGMENT_COLORS[key],
      dash: fraction * C,
      offset: -cumulative * C,
    };
    cumulative += fraction;
    return seg;
  });

  return (
    <Link
      href="/trust"
      className={cn("acx-trust", focusRing)}
      aria-label={`Trust Analytics: score ${score} out of 100. View Trust Centre.`}
    >
      <p className="acx-trust__title">Trust Analytics</p>

      <div className="acx-trust__ring-wrap">
        <svg className="acx-trust__ring" viewBox="0 0 120 120" role="img" aria-hidden>
          <circle cx="60" cy="60" r={R} fill="none" stroke="#eef1f6" strokeWidth="12" />
          {segments.map((seg) =>
            seg.dash > 0 ? (
              <circle
                key={seg.key}
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(seg.dash - 3, 0)} ${C}`}
                strokeDashoffset={seg.offset}
                transform="rotate(-90 60 60)"
              />
            ) : null,
          )}
        </svg>
        <div className="acx-trust__center">
          <span className="acx-trust__score">{score}</span>
          <span className="acx-trust__score-max">Trust Score</span>
        </div>
      </div>

      <ul className="acx-trust__legend">
        <li>
          <span className="acx-trust__dot" style={{ backgroundColor: SEGMENT_COLORS.positive }} aria-hidden />
          Positive <strong>{sentiment.positive}%</strong>
        </li>
        <li>
          <span className="acx-trust__dot" style={{ backgroundColor: SEGMENT_COLORS.neutral }} aria-hidden />
          Neutral <strong>{sentiment.neutral}%</strong>
        </li>
        <li>
          <span className="acx-trust__dot" style={{ backgroundColor: SEGMENT_COLORS.negative }} aria-hidden />
          Negative <strong>{sentiment.negative}%</strong>
        </li>
      </ul>
    </Link>
  );
}
