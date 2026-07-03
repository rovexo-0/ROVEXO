import Link from "next/link";
import { PremiumAccountIcon } from "@/components/icons/PremiumAccountIcon";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";
import type { AccountProfileView } from "@/lib/account-center/derive";

type AccountTrustAnalyticsProps = {
  view: AccountProfileView;
};

const GAUGE_RADIUS = 46;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

function TrendSparkline({ points }: { points: number[] }) {
  const width = 120;
  const height = 40;
  const pad = 4;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

  const coords = points.map((value, index) => {
    const x = pad + index * step;
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return { x, y };
  });

  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[coords.length - 1]!.x.toFixed(1)},${height} L${coords[0]!.x.toFixed(1)},${height} Z`;

  return (
    <svg
      className="ac2-trust__spark"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="ac2-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#ac2-spark-fill)" />
      <path
        d={line}
        fill="none"
        stroke="#16a34a"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={coords[coords.length - 1]!.x} cy={coords[coords.length - 1]!.y} r={3} fill="#16a34a" />
    </svg>
  );
}

export function AccountTrustAnalytics({ view }: AccountTrustAnalyticsProps) {
  const offset = GAUGE_CIRCUMFERENCE * (1 - view.score / 100);
  const trendUp = view.trendDelta >= 0;

  return (
    <Link
      href="/trust"
      className={cn("ac2-trust", focusRing)}
      aria-label={`Trust Analytics: score ${view.score} out of 100. View Trust Centre.`}
    >
      <div className="ac2-trust__head">
        <p className="ac2-trust__title">Trust Analytics</p>
        <PremiumAccountIcon icon="security" size={26} className="ac2-trust__shield" />
      </div>

      <div className="ac2-trust__gauge-wrap">
        <svg className="ac2-trust__gauge" viewBox="0 0 110 110" role="img" aria-hidden>
          <defs>
            <linearGradient id="ac2-gauge-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2563ff" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
          <circle cx="55" cy="55" r={GAUGE_RADIUS} fill="none" stroke="#eef4ff" strokeWidth="9" />
          <circle
            cx="55"
            cy="55"
            r={GAUGE_RADIUS}
            fill="none"
            stroke="url(#ac2-gauge-stroke)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={GAUGE_CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 55 55)"
            className="ac2-trust__gauge-arc"
          />
        </svg>
        <div className="ac2-trust__gauge-center">
          <span className="ac2-trust__score">{view.score}</span>
          <span className="ac2-trust__score-max">/ 100</span>
        </div>
      </div>

      <div className="ac2-trust__trend">
        <TrendSparkline points={view.trend} />
        <span className={cn("ac2-trust__delta", trendUp ? "is-up" : "is-down")}>
          <svg viewBox="0 0 12 12" width={12} height={12} aria-hidden>
            <path
              d={trendUp ? "M6 2 L10 8 L2 8 Z" : "M6 10 L10 4 L2 4 Z"}
              fill="currentColor"
            />
          </svg>
          {trendUp ? "+" : ""}
          {view.trendDelta} · 30d
        </span>
      </div>

      <ul className="ac2-trust__sentiment">
        <li>
          <span className="ac2-trust__dot ac2-trust__dot--pos" aria-hidden />
          <span className="ac2-trust__pct">{view.sentiment.positive}%</span>
          <span className="ac2-trust__pct-label">Positive</span>
        </li>
        <li>
          <span className="ac2-trust__dot ac2-trust__dot--neu" aria-hidden />
          <span className="ac2-trust__pct">{view.sentiment.neutral}%</span>
          <span className="ac2-trust__pct-label">Neutral</span>
        </li>
        <li>
          <span className="ac2-trust__dot ac2-trust__dot--neg" aria-hidden />
          <span className="ac2-trust__pct">{view.sentiment.negative}%</span>
          <span className="ac2-trust__pct-label">Negative</span>
        </li>
      </ul>
    </Link>
  );
}
