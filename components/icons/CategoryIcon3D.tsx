import type { ReactElement } from "react";
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

function IconDefs() {
  return (
    <defs>
      <linearGradient id="ci-top" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
      <linearGradient id="ci-front" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="ci-side" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1e40af" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
      <linearGradient id="ci-accent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#93c5fd" />
        <stop offset="100%" stopColor="#3b82f6" />
      </linearGradient>
      <filter id="ci-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#0f172a" floodOpacity="0.22" />
      </filter>
    </defs>
  );
}

function VehiclesIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <path d="M6 20h22l-1.5-6.5H7.5L6 20Z" fill="url(#ci-front)" />
      <path d="M7.5 13.5 9 9h16l1.5 4.5H7.5Z" fill="url(#ci-top)" />
      <circle cx="11" cy="20" r="2.2" fill="#0f172a" opacity="0.85" />
      <circle cx="23" cy="20" r="2.2" fill="#0f172a" opacity="0.85" />
      <circle cx="11" cy="20" r="1" fill="#e2e8f0" />
      <circle cx="23" cy="20" r="1" fill="#e2e8f0" />
    </g>
  );
}

function PropertyIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <path d="M17 7 6 16.5V26h22V16.5L17 7Z" fill="url(#ci-front)" />
      <path d="M17 7 6 16.5 17 14.5 28 16.5 17 7Z" fill="url(#ci-top)" />
      <path d="M14 26V18.5h6V26" fill="url(#ci-accent)" />
    </g>
  );
}

function PhonesIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <rect x="11" y="6" width="12" height="22" rx="2.5" fill="url(#ci-front)" />
      <rect x="12" y="8" width="10" height="16" rx="1.5" fill="url(#ci-accent)" opacity="0.9" />
      <circle cx="17" cy="25.5" r="1.2" fill="#e2e8f0" />
    </g>
  );
}

function ComputersIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <path d="M7 9h20l-1.5 12H8.5L7 9Z" fill="url(#ci-front)" />
      <path d="M7 9h20l-1-3H8l-1 3Z" fill="url(#ci-top)" />
      <rect x="6" y="21" width="22" height="2.5" rx="1" fill="url(#ci-side)" />
      <rect x="14" y="23.5" width="6" height="2" rx="0.75" fill="url(#ci-side)" />
    </g>
  );
}

function FashionIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <path d="M17 7c-2 0-3.5 1.2-3.5 3 0 1.2.8 2 2 2.4L11 26h12l-4.5-13.6c1.2-.4 2-1.2 2-2.4 0-1.8-1.5-3-3.5-3Z" fill="url(#ci-front)" />
      <path d="M13.5 10c0-1.2 1.5-2 3.5-2s3.5.8 3.5 2" fill="none" stroke="url(#ci-accent)" strokeWidth="1.5" />
      <ellipse cx="17" cy="14" rx="4" ry="1.2" fill="url(#ci-top)" opacity="0.7" />
    </g>
  );
}

function ElectronicsIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <rect x="8" y="10" width="18" height="14" rx="2" fill="url(#ci-front)" />
      <rect x="10" y="12" width="14" height="9" rx="1" fill="url(#ci-accent)" opacity="0.85" />
      <path d="M14 24h6v2h-6z" fill="url(#ci-side)" />
      <circle cx="17" cy="16.5" r="2" fill="#dbeafe" opacity="0.9" />
    </g>
  );
}

function FurnitureIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <rect x="7" y="14" width="20" height="5" rx="1.5" fill="url(#ci-top)" />
      <rect x="8" y="19" width="3" height="7" rx="0.75" fill="url(#ci-side)" />
      <rect x="23" y="19" width="3" height="7" rx="0.75" fill="url(#ci-side)" />
      <rect x="9" y="10" width="16" height="4" rx="1" fill="url(#ci-front)" />
    </g>
  );
}

function GardenIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <path d="M17 26V14c0-4-2.5-7-5-8.5C9.5 7 7 10 7 14v12h10Z" fill="url(#ci-front)" />
      <path d="M17 14c0-4 2.5-7 5-8.5 2.5 1.5 5 4.5 5 8.5v12H17V14Z" fill="url(#ci-top)" />
      <rect x="6" y="24" width="22" height="3" rx="1" fill="url(#ci-side)" />
      <circle cx="12" cy="12" r="2" fill="url(#ci-accent)" />
      <circle cx="22" cy="11" r="2.5" fill="url(#ci-accent)" opacity="0.85" />
    </g>
  );
}

function SportsIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <circle cx="17" cy="17" r="9" fill="url(#ci-front)" />
      <path d="M8.5 12.5c3 2 9 2 12 0M8.5 21.5c3-2 9-2 12 0M17 8v18" stroke="url(#ci-accent)" strokeWidth="1.25" fill="none" />
      <ellipse cx="13" cy="13" rx="2.5" ry="1.5" fill="#ffffff" opacity="0.35" />
    </g>
  );
}

function PetsIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <ellipse cx="17" cy="19" rx="6" ry="5" fill="url(#ci-front)" />
      <circle cx="10" cy="12" r="3" fill="url(#ci-top)" />
      <circle cx="24" cy="12" r="3" fill="url(#ci-top)" />
      <circle cx="12" cy="22" r="2.5" fill="url(#ci-side)" />
      <circle cx="22" cy="22" r="2.5" fill="url(#ci-side)" />
      <circle cx="15" cy="18" r="1" fill="#0f172a" opacity="0.7" />
      <circle cx="19" cy="18" r="1" fill="#0f172a" opacity="0.7" />
    </g>
  );
}

function AutoPartsIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <circle cx="17" cy="17" r="9" fill="none" stroke="url(#ci-top)" strokeWidth="2.5" />
      <circle cx="17" cy="17" r="3.5" fill="url(#ci-accent)" />
      <rect x="16" y="5" width="2" height="5" rx="0.75" fill="url(#ci-side)" />
      <rect x="16" y="24" width="2" height="5" rx="0.75" fill="url(#ci-side)" />
      <rect x="5" y="16" width="5" height="2" rx="0.75" fill="url(#ci-side)" />
      <rect x="24" y="16" width="5" height="2" rx="0.75" fill="url(#ci-side)" />
    </g>
  );
}

function GamingIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <path d="M8 14.5c0-3.5 2.8-6.5 9-6.5s9 3 9 6.5-2.8 8.5-9 8.5-9-5-9-8.5Z" fill="url(#ci-front)" />
      <path d="M8 14.5c0-3.5 2.8-6.5 9-6.5s9 3 9 6.5" fill="url(#ci-top)" opacity="0.55" />
      <rect x="14.5" y="13" width="5" height="5" rx="1" fill="url(#ci-accent)" />
      <circle cx="23.5" cy="14.5" r="1.5" fill="#dbeafe" />
      <circle cx="26" cy="17" r="1.5" fill="#dbeafe" />
    </g>
  );
}

function JobsIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <rect x="8" y="12" width="18" height="14" rx="2" fill="url(#ci-front)" />
      <path d="M8 16h18" stroke="url(#ci-top)" strokeWidth="1.5" />
      <rect x="13" y="8" width="8" height="5" rx="1.5" fill="url(#ci-top)" />
      <rect x="12" y="19" width="10" height="2" rx="0.75" fill="url(#ci-accent)" opacity="0.85" />
    </g>
  );
}

function ServicesIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <circle cx="17" cy="17" r="9" fill="url(#ci-front)" />
      <circle cx="17" cy="17" r="9" fill="url(#ci-top)" opacity="0.35" />
      <path d="M17 11v6l4 2.5" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
      <circle cx="17" cy="17" r="1.5" fill="#e2e8f0" />
    </g>
  );
}

function WholesaleIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <path d="M7 12h8v14H7V12Z" fill="url(#ci-side)" />
      <path d="M15 9h8v17h-8V9Z" fill="url(#ci-front)" />
      <path d="M23 14h4v12h-4V14Z" fill="url(#ci-top)" />
      <rect x="8" y="14" width="6" height="2" rx="0.5" fill="url(#ci-accent)" opacity="0.7" />
      <rect x="16" y="12" width="6" height="2" rx="0.5" fill="url(#ci-accent)" opacity="0.7" />
    </g>
  );
}

function AuctionsIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <path d="M12 24 8 20l10-10 4 4-10 10Z" fill="url(#ci-front)" />
      <path d="m18 14 4-4 2 2-4 4-2-2Z" fill="url(#ci-top)" />
      <rect x="7" y="23" width="14" height="2.5" rx="1" fill="url(#ci-side)" transform="rotate(-12 14 24)" />
      <circle cx="24" cy="10" r="2.5" fill="url(#ci-accent)" />
    </g>
  );
}

function MoreIcon() {
  return (
    <g filter="url(#ci-shadow)">
      <rect x="7" y="7" width="8" height="8" rx="2" fill="url(#ci-top)" />
      <rect x="19" y="7" width="8" height="8" rx="2" fill="url(#ci-front)" />
      <rect x="7" y="19" width="8" height="8" rx="2" fill="url(#ci-front)" />
      <rect x="19" y="19" width="8" height="8" rx="2" fill="url(#ci-side)" />
    </g>
  );
}

const ICONS: Record<CategoryIconType, () => ReactElement> = {
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
  const Icon = ICONS[type] ?? ICONS.more;

  return (
    <svg
      viewBox="0 0 34 34"
      className={cn("category-icon-3d", className)}
      aria-hidden
    >
      <IconDefs />
      <Icon />
    </svg>
  );
}
