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

function scoreStrokeColor(score: number): string {
  if (score >= 80) return SEGMENT_COLORS.positive;
  if (score >= 60) return SEGMENT_COLORS.neutral;
  return SEGMENT_COLORS.negative;
}

/**
 * Circular trust ring with a single score arc (no overlapping segment circles).
 * Sentiment breakdown lives in the legend only — stacked SVG stroke arcs with
 * rotate transforms cause Android Chrome repaint ghosts during scroll.
 */
export function TrustAnalytics({ score, sentiment }: TrustAnalyticsProps) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const scoreArc = (clampedScore / 100) * C;

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
          {scoreArc > 0 ? (
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={scoreStrokeColor(clampedScore)}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${scoreArc} ${C}`}
              strokeDashoffset={C / 4}
            />
          ) : null}
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
