import type { CSSProperties, ReactNode } from "react";
import {
  resolveBadgeVisual,
  type BadgeVisualKey,
  type BadgeVisualState,
} from "@/lib/badge/badge-visual-system-v2";
import styles from "@/components/badge/CanonicalBadgeArtwork.module.css";
import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

type CanonicalBadgeArtworkProps = {
  badgeKey: string;
  state?: BadgeVisualState;
  size?: number;
  showStateMark?: boolean;
  className?: string;
  title?: string;
};

function Plate({
  plate,
  plateHi,
  gradientId,
  children,
}: {
  plate: string;
  plateHi: string;
  gradientId: string;
  children: ReactNode;
}) {
  return (
    <>
      <defs>
        <radialGradient id={gradientId} cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor={plateHi} />
          <stop offset="72%" stopColor={plate} />
          <stop offset="100%" stopColor={plate} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="29" fill={`url(#${gradientId})`} />
      <circle cx="32" cy="32" r="29" fill="none" stroke="rgb(255 255 255 / 0.28)" strokeWidth="1.4" />
      <path
        d="M14 18c6-8 30-10 36 2"
        fill="none"
        stroke="rgb(255 255 255 / 0.38)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {children}
    </>
  );
}

function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const points = Array.from({ length: 5 }, (_, i) => {
    const angle = (-90 + i * 72) * (Math.PI / 180);
    const outer = `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
    const innerAngle = angle + Math.PI / 5;
    const inner = `${cx + Math.cos(innerAngle) * (r * 0.42)},${cy + Math.sin(innerAngle) * (r * 0.42)}`;
    return `${outer} ${inner}`;
  }).join(" ");
  return <polygon points={points} fill={fill} />;
}

function Glyph({ glyph, accent }: { glyph: BadgeVisualKey; accent: string }) {
  switch (glyph) {
    case "first_sale":
      return (
        <g data-badge-glyph="first_sale">
          <path
            d="M22 26h20l-1.4 18.2A3 3 0 0 1 37.6 47H26.4a3 3 0 0 1-3-2.8L22 26Z"
            fill={accent}
          />
          <path d="M24 26c0-5 3.4-8 8-8s8 3 8 8" fill="none" stroke={accent} strokeWidth="2.4" />
          <Star cx={44} cy={20} r={5.2} fill="#FDE68A" />
        </g>
      );
    case "orders_10":
      return (
        <g data-badge-glyph="orders_10">
          <text x="32" y="38" textAnchor="middle" fill={accent} fontSize="18" fontWeight="800">
            10
          </text>
          <Star cx={18} cy={20} r={4.2} fill={accent} />
          <Star cx={46} cy={20} r={4.2} fill={accent} />
        </g>
      );
    case "orders_50":
      return (
        <g data-badge-glyph="orders_50">
          <text x="32" y="38" textAnchor="middle" fill={accent} fontSize="18" fontWeight="800">
            50
          </text>
          <Star cx={16} cy={22} r={3.6} fill={accent} />
          <Star cx={32} cy={16} r={3.6} fill={accent} />
          <Star cx={48} cy={22} r={3.6} fill={accent} />
        </g>
      );
    case "orders_100":
      return (
        <g data-badge-glyph="orders_100">
          <rect x="20" y="24" width="24" height="18" rx="3" fill={accent} />
          <path d="M20 28h24" stroke="#6D28D9" strokeWidth="2" />
          <path d="M32 24v18" stroke="#6D28D9" strokeWidth="2" />
          <Star cx={44} cy={20} r={4.4} fill="#FDE68A" />
        </g>
      );
    case "orders_500":
      return (
        <g data-badge-glyph="orders_500">
          <rect x="18" y="26" width="20" height="15" rx="2.4" fill={accent} />
          <path d="M18 29.5h20M28 26v15" stroke="#5B21B6" strokeWidth="1.6" />
          <text x="40" y="28" fill={accent} fontSize="11" fontWeight="800">
            500
          </text>
        </g>
      );
    case "orders_1000":
      return (
        <g data-badge-glyph="orders_1000">
          <rect x="16" y="27" width="18" height="14" rx="2.2" fill={accent} />
          <path d="M16 30.4h18M25 27v14" stroke="#4C1D95" strokeWidth="1.5" />
          <text x="36" y="29" fill={accent} fontSize="10" fontWeight="800">
            1000
          </text>
        </g>
      );
    case "fast_responder":
      return (
        <g data-badge-glyph="fast_responder">
          <path
            d="M18 22h22a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H28l-7 6v-6h-3a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4Z"
            fill={accent}
          />
          <path d="M34 20 27 33h6l-3 11 11-16h-6l5-8Z" fill="#7C3AED" />
        </g>
      );
    case "excellent_response_time":
      return (
        <g data-badge-glyph="excellent_response_time">
          <circle cx="32" cy="32" r="13" fill={accent} />
          <circle cx="32" cy="32" r="13" fill="none" stroke="#0369A1" strokeWidth="2" />
          <path d="M32 23v10l7 4" fill="none" stroke="#0369A1" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M44 42 40 46l8 1-1-8Z" fill="#16A34A" />
        </g>
      );
    case "fast_dispatch":
      return (
        <g data-badge-glyph="fast_dispatch">
          <path d="M14 30h22v12H14Z" fill={accent} />
          <path d="M36 33h10l5 6v3H36Z" fill={accent} />
          <circle cx="22" cy="44" r="3.4" fill="#064E3B" />
          <circle cx="42" cy="44" r="3.4" fill="#064E3B" />
          <path d="M16 27h10" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case "fast_shipper":
      return (
        <g data-badge-glyph="fast_shipper">
          <path d="M18 40c6-2 10-8 12-14l16-8-6 18c-4 2-12 4-18 5l-8 5 4-6Z" fill={accent} />
          <rect x="24" y="28" width="10" height="8" rx="1.4" fill="#7C2D12" />
          <path d="M16 46c8-1 16-4 22-9" stroke={accent} strokeWidth="1.8" />
        </g>
      );
    case "top_rated":
      return (
        <g data-badge-glyph="top_rated">
          <Star cx={32} cy={32} r={14} fill={accent} />
          <Star cx={32} cy={32} r={7.5} fill="#FFFFFF" />
        </g>
      );
    case "reviews_100_positive":
      return (
        <g data-badge-glyph="reviews_100_positive">
          <path
            d="M32 44s-14-8.6-14-17.2C18 21 22.2 18 26.4 18 29 18 31 19.4 32 21.4 33 19.4 35 18 37.6 18 41.8 18 46 21 46 26.8 46 35.4 32 44 32 44Z"
            fill={accent}
          />
        </g>
      );
    case "verified_seller":
      return (
        <g data-badge-glyph="verified_seller">
          <path
            d="M32 16 44 20.4v11.2c0 8.4-5.2 14.8-12 16.8-6.8-2-12-8.4-12-16.8V20.4L32 16Z"
            fill={accent}
          />
          <path d="m25.5 32.2 4.4 4.4 9-9" fill="none" stroke="#166534" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "verified_business":
      return (
        <g data-badge-glyph="verified_business">
          <path d="M20 44V26l12-8 12 8v18H20Z" fill={accent} />
          <path d="M28 44v-8h8v8" fill="#1D4ED8" />
          <path d="M26 30h4v3h-4Zm8 0h4v3h-4Z" fill="#1D4ED8" />
          <circle cx="44" cy="22" r="7" fill="#16A34A" />
          <path d="m41 22 2 2 4-4" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );
    case "trending_seller":
      return (
        <g data-badge-glyph="trending_seller">
          <path
            d="M34 16c2 8-6 10-4 18 8-4 12-10 10-18 8 6 10 16 4 24-4 6-12 10-16 10-10 0-16-8-14-16 4 2 8 2 10-2 2-6-2-12 10-16Z"
            fill={accent}
          />
          <path d="M22 40c6-4 12-6 20-4" fill="none" stroke="#FEE2E2" strokeWidth="2" />
        </g>
      );
    case "trusted_seller":
      return (
        <g data-badge-glyph="trusted_seller">
          <path
            d="M18 34c0-4 3-7 7-7h4l3 4 3-4h4c4 0 7 3 7 7v3c0 4-3 7-7 7H25c-4 0-7-3-7-7v-3Z"
            fill={accent}
          />
          <path d="M29 31h6v5c0 2-1.4 3.4-3 3.4S29 38 29 36v-5Z" fill="#115E59" />
          <path d="M20 28c3-5 8-6 12-3 4-3 9-2 12 3" fill="none" stroke={accent} strokeWidth="2" />
        </g>
      );
    case "top_seller":
      return (
        <g data-badge-glyph="top_seller">
          <path d="M16 28 24 22l8 8 8-8 8 6-4 16H20L16 28Z" fill={accent} />
          <rect x="21" y="44" width="22" height="4" rx="1.4" fill={accent} />
          <circle cx="32" cy="30" r="3" fill="#92400E" />
        </g>
      );
    case "premium_seller":
      return (
        <g data-badge-glyph="premium_seller">
          <path d="M32 16 46 32 32 48 18 32Z" fill={accent} />
          <path d="M32 22 40 32 32 42 24 32Z" fill="#FFFFFF" opacity="0.35" />
        </g>
      );
    case "elite_seller":
      return (
        <g data-badge-glyph="elite_seller">
          <path d="M22 24h20l-2 8H24l-2-8Z" fill={accent} />
          <path d="M24 32h16l-2 8H26l-2-8Z" fill={accent} />
          <rect x="27" y="40" width="10" height="6" rx="1.2" fill={accent} />
          <path d="M20 22h8l4 6 4-6h8" fill="none" stroke={accent} strokeWidth="2.2" />
        </g>
      );
    case "reliable_buyer":
      return (
        <g data-badge-glyph="reliable_buyer">
          <circle cx="32" cy="32" r="12" fill={accent} />
          <path d="m26 32 4 4 8-9" fill="none" stroke="#365314" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "trusted_buyer":
      return (
        <g data-badge-glyph="trusted_buyer">
          <circle cx="32" cy="26" r="7" fill={accent} />
          <path d="M18 44c2-8 8-12 14-12s12 4 14 12" fill={accent} />
        </g>
      );
    case "community_contributor":
      return (
        <g data-badge-glyph="community_contributor">
          <circle cx="24" cy="26" r="6" fill={accent} />
          <circle cx="40" cy="26" r="6" fill={accent} />
          <path d="M16 42c1-7 6-10 12-10h8c6 0 11 3 12 10" fill={accent} />
        </g>
      );
    default:
      return (
        <g data-badge-glyph="unknown">
          <circle cx="32" cy="32" r="10" fill={accent} />
        </g>
      );
  }
}

function CheckMark() {
  return (
    <span className={`${styles.mark} ${styles.check}`} aria-hidden>
      {PLATFORM_EMOJI.check}
    </span>
  );
}

function LockMark() {
  return (
    <span className={`${styles.mark} ${styles.lock}`} aria-hidden>
      {PLATFORM_EMOJI.lock}
    </span>
  );
}

export function CanonicalBadgeArtwork({
  badgeKey,
  state = "earned",
  size = 40,
  showStateMark = true,
  className,
  title,
}: CanonicalBadgeArtworkProps) {
  const visual = resolveBadgeVisual(badgeKey);
  const key = visual?.key ?? "unknown";
  const glyph = visual?.glyph ?? "unknown";
  const plate = visual?.plate ?? "#94A3B8";
  const plateHi = visual?.plateHi ?? "#CBD5E1";
  const accent = visual?.accent ?? "#F8FAFC";

  return (
    <span
      className={`${styles.root}${className ? ` ${className}` : ""}`}
      style={{ ["--badge-art-size" as string]: `${size}px` } as CSSProperties}
      data-badge-visual="v2"
      data-badge-visual-key={key}
      data-badge-glyph={glyph}
      data-badge-state={state}
      title={title}
    >
      <svg className={styles.canvas} viewBox="0 0 64 64" aria-hidden>
        <g className={styles.art} data-badge-state={state}>
          <Plate plate={plate} plateHi={plateHi} gradientId={`rvx-badge-${key}`}>
            <Glyph glyph={(visual?.glyph ?? "community_contributor") as BadgeVisualKey} accent={accent} />
          </Plate>
        </g>
      </svg>
      {showStateMark && state === "earned" ? <CheckMark /> : null}
      {showStateMark && state === "locked" ? <LockMark /> : null}
    </span>
  );
}
