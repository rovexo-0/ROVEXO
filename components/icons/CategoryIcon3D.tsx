"use client";

import { useId, type ReactElement } from "react";
import { cn } from "@/lib/cn";

export type CategoryIconType =
  | "vehicles"
  | "property"
  | "phones"
  | "computers"
  | "fashion"
  | "electronics"
  | "furniture"
  | "garden"
  | "sports"
  | "pets"
  | "gaming"
  | "jobs"
  | "services"
  | "autoparts"
  | "wholesale"
  | "auctions"
  | "more";

type CategoryIcon3DProps = {
  type: CategoryIconType;
  className?: string;
};

type IconPaint = {
  p: string;
};

function IconDefs({ p }: IconPaint) {
  return (
    <defs>
      <linearGradient id={`${p}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="100%" stopColor="var(--ds-color-primary)" />
      </linearGradient>
      <linearGradient id={`${p}-front`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="var(--ds-color-accent)" />
      </linearGradient>
      <linearGradient id={`${p}-side`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="var(--ds-color-primary-deep)" />
        <stop offset="100%" stopColor="#3b0764" />
      </linearGradient>
      <linearGradient id={`${p}-accent`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#dbeafe" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
      <linearGradient id={`${p}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <filter id={`${p}-shadow`} x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="1.75" stdDeviation="1.35" floodColor="#0f172a" floodOpacity="0.28" />
        <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#a855f7" floodOpacity="0.22" />
      </filter>
    </defs>
  );
}

function Gloss({ p }: IconPaint) {
  return <ellipse cx="13" cy="11" rx="7" ry="4" fill={`url(#${p}-shine)`} opacity="0.55" />;
}

function VehiclesIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <path d="M6 20h22l-1.5-6.5H7.5L6 20Z" fill={`url(#${p}-front)`} />
      <path d="M7.5 13.5 9 9h16l1.5 4.5H7.5Z" fill={`url(#${p}-top)`} />
      <circle cx="11" cy="20" r="2.2" fill="#0f172a" opacity="0.85" />
      <circle cx="23" cy="20" r="2.2" fill="#0f172a" opacity="0.85" />
      <Gloss p={p} />
    </g>
  );
}

function PropertyIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <path d="M17 7 6 16.5V26h22V16.5L17 7Z" fill={`url(#${p}-front)`} />
      <path d="M17 7 6 16.5 17 14.5 28 16.5 17 7Z" fill={`url(#${p}-top)`} />
      <path d="M14 26V18.5h6V26" fill={`url(#${p}-accent)`} />
      <Gloss p={p} />
    </g>
  );
}

function PhonesIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <rect x="11" y="6" width="12" height="22" rx="2.5" fill={`url(#${p}-front)`} />
      <rect x="12" y="8" width="10" height="16" rx="1.5" fill={`url(#${p}-accent)`} opacity="0.9" />
      <circle cx="17" cy="25.5" r="1.2" fill="#e2e8f0" />
      <Gloss p={p} />
    </g>
  );
}

function ComputersIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <path d="M7 9h20l-1.5 12H8.5L7 9Z" fill={`url(#${p}-front)`} />
      <path d="M7 9h20l-1-3H8l-1 3Z" fill={`url(#${p}-top)`} />
      <rect x="6" y="21" width="22" height="2.5" rx="1" fill={`url(#${p}-side)`} />
      <Gloss p={p} />
    </g>
  );
}

function FashionIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <path d="M17 7c-2 0-3.5 1.2-3.5 3 0 1.2.8 2 2 2.4L11 26h12l-4.5-13.6c1.2-.4 2-1.2 2-2.4 0-1.8-1.5-3-3.5-3Z" fill={`url(#${p}-front)`} />
      <ellipse cx="17" cy="14" rx="4" ry="1.2" fill={`url(#${p}-top)`} opacity="0.7" />
      <Gloss p={p} />
    </g>
  );
}

function ElectronicsIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <rect x="8" y="10" width="18" height="14" rx="2" fill={`url(#${p}-front)`} />
      <rect x="10" y="12" width="14" height="9" rx="1" fill={`url(#${p}-accent)`} opacity="0.85" />
      <Gloss p={p} />
    </g>
  );
}

function FurnitureIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <rect x="7" y="14" width="20" height="5" rx="1.5" fill={`url(#${p}-top)`} />
      <rect x="8" y="19" width="3" height="7" rx="0.75" fill={`url(#${p}-side)`} />
      <rect x="23" y="19" width="3" height="7" rx="0.75" fill={`url(#${p}-side)`} />
      <rect x="9" y="10" width="16" height="4" rx="1" fill={`url(#${p}-front)`} />
      <Gloss p={p} />
    </g>
  );
}

function GardenIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <path d="M17 26V14c0-4-2.5-7-5-8.5C9.5 7 7 10 7 14v12h10Z" fill={`url(#${p}-front)`} />
      <path d="M17 14c0-4 2.5-7 5-8.5 2.5 1.5 5 4.5 5 8.5v12H17V14Z" fill={`url(#${p}-top)`} />
      <circle cx="12" cy="12" r="2" fill={`url(#${p}-accent)`} />
      <Gloss p={p} />
    </g>
  );
}

function SportsIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <circle cx="17" cy="17" r="9" fill={`url(#${p}-front)`} />
      <path d="M8.5 12.5c3 2 9 2 12 0M8.5 21.5c3-2 9-2 12 0M17 8v18" stroke={`url(#${p}-accent)`} strokeWidth="1.25" fill="none" />
      <Gloss p={p} />
    </g>
  );
}

function PetsIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <ellipse cx="17" cy="19" rx="6" ry="5" fill={`url(#${p}-front)`} />
      <circle cx="10" cy="12" r="3" fill={`url(#${p}-top)`} />
      <circle cx="24" cy="12" r="3" fill={`url(#${p}-top)`} />
      <Gloss p={p} />
    </g>
  );
}

function AutoPartsIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <circle cx="17" cy="17" r="9" fill="none" stroke={`url(#${p}-top)`} strokeWidth="2.5" />
      <circle cx="17" cy="17" r="3.5" fill={`url(#${p}-accent)`} />
      <Gloss p={p} />
    </g>
  );
}

function GamingIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <path d="M8 14.5c0-3.5 2.8-6.5 9-6.5s9 3 9 6.5-2.8 8.5-9 8.5-9-5-9-8.5Z" fill={`url(#${p}-front)`} />
      <rect x="14.5" y="13" width="5" height="5" rx="1" fill={`url(#${p}-accent)`} />
      <Gloss p={p} />
    </g>
  );
}

function JobsIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <rect x="8" y="12" width="18" height="14" rx="2" fill={`url(#${p}-front)`} />
      <rect x="13" y="8" width="8" height="5" rx="1.5" fill={`url(#${p}-top)`} />
      <Gloss p={p} />
    </g>
  );
}

function ServicesIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <circle cx="17" cy="17" r="9" fill={`url(#${p}-front)`} />
      <path d="M17 11v6l4 2.5" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
      <Gloss p={p} />
    </g>
  );
}

function WholesaleIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <path d="M7 12h8v14H7V12Z" fill={`url(#${p}-side)`} />
      <path d="M15 9h8v17h-8V9Z" fill={`url(#${p}-front)`} />
      <path d="M23 14h4v12h-4V14Z" fill={`url(#${p}-top)`} />
      <Gloss p={p} />
    </g>
  );
}

function AuctionsIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <path d="M12 24 8 20l10-10 4 4-10 10Z" fill={`url(#${p}-front)`} />
      <path d="m18 14 4-4 2 2-4 4-2-2Z" fill={`url(#${p}-top)`} />
      <Gloss p={p} />
    </g>
  );
}

function MoreIcon({ p }: IconPaint) {
  return (
    <g filter={`url(#${p}-shadow)`}>
      <rect x="7" y="7" width="8" height="8" rx="2" fill={`url(#${p}-top)`} />
      <rect x="19" y="7" width="8" height="8" rx="2" fill={`url(#${p}-front)`} />
      <rect x="7" y="19" width="8" height="8" rx="2" fill={`url(#${p}-front)`} />
      <rect x="19" y="19" width="8" height="8" rx="2" fill={`url(#${p}-side)`} />
      <Gloss p={p} />
    </g>
  );
}

const ICONS: Record<CategoryIconType, (paint: IconPaint) => ReactElement> = {
  vehicles: VehiclesIcon,
  property: PropertyIcon,
  phones: PhonesIcon,
  computers: ComputersIcon,
  fashion: FashionIcon,
  electronics: ElectronicsIcon,
  furniture: FurnitureIcon,
  garden: GardenIcon,
  sports: SportsIcon,
  pets: PetsIcon,
  gaming: GamingIcon,
  jobs: JobsIcon,
  services: ServicesIcon,
  autoparts: AutoPartsIcon,
  wholesale: WholesaleIcon,
  auctions: AuctionsIcon,
  more: MoreIcon,
};

export function CategoryIcon3D({ type, className }: CategoryIcon3DProps) {
  const uid = useId().replace(/:/g, "");
  const Icon = ICONS[type] ?? ICONS.more;

  return (
    <svg viewBox="0 0 34 34" className={cn("category-icon-3d", className)} aria-hidden>
      <IconDefs p={uid} />
      <Icon p={uid} />
    </svg>
  );
}
