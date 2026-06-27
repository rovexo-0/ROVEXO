"use client";

import { useId, type ReactElement, type ReactNode } from "react";
import type { HomeCategoryIconType } from "@/lib/home/constants";
import { cn } from "@/lib/cn";

type HomeCategoryIcon3DProps = {
  type: HomeCategoryIconType;
  className?: string;
  size?: number;
};

function IconDefs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bfdbfe" />
        <stop offset="45%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id={`${uid}-indigo`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c7d2fe" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#4338ca" />
      </linearGradient>
      <linearGradient id={`${uid}-violet`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ddd6fe" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
      <linearGradient id={`${uid}-green`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bbf7d0" />
        <stop offset="50%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
      <linearGradient id={`${uid}-amber`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id={`${uid}-rose`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fecdd3" />
        <stop offset="50%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#be123c" />
      </linearGradient>
      <linearGradient id={`${uid}-cyan`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a5f3fc" />
        <stop offset="50%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#0e7490" />
      </linearGradient>
      <linearGradient id={`${uid}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <filter id={`${uid}-shadow`} x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.4" floodColor="#0f172a" floodOpacity="0.22" />
        <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#3b82f6" floodOpacity="0.18" />
      </filter>
    </defs>
  );
}

function Plate({ uid }: { uid: string }) {
  return (
    <>
      <circle cx="12" cy="12.5" r="9" fill={`url(#${uid}-blue)`} opacity="0.1" />
      <ellipse cx="10" cy="9" rx="4.5" ry="2.8" fill="#ffffff" opacity="0.35" />
    </>
  );
}

function Glyph({ uid, children }: { uid: string; children: ReactNode }) {
  return (
    <g filter={`url(#${uid}-shadow)`}>
      <Plate uid={uid} />
      {children}
      <rect x="5" y="6" width="14" height="12" rx="3" fill={`url(#${uid}-shine)`} opacity="0.22" pointerEvents="none" />
    </g>
  );
}

function CarIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <rect x="4.5" y="10.5" width="15" height="5.5" rx="2" fill={`url(#${uid}-blue)`} />
      <rect x="7" y="8.5" width="10" height="3.5" rx="1.2" fill={`url(#${uid}-indigo)`} />
      <circle cx="8" cy="16.2" r="1.4" fill="#1e293b" />
      <circle cx="16" cy="16.2" r="1.4" fill="#1e293b" />
    </Glyph>
  );
}

function HouseIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M12 5.5 5.5 10v7.5h13V10L12 5.5Z" fill={`url(#${uid}-blue)`} />
      <rect x="10" y="12.5" width="4" height="5" rx="0.5" fill={`url(#${uid}-indigo)`} />
    </Glyph>
  );
}

function PhoneIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <rect x="8" y="5" width="8" height="14" rx="2" fill={`url(#${uid}-indigo)`} />
      <rect x="10" y="7" width="4" height="8" rx="0.5" fill="#ffffff" opacity="0.45" />
    </Glyph>
  );
}

function LaptopIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <rect x="6" y="7" width="12" height="8" rx="1.2" fill={`url(#${uid}-blue)`} />
      <path d="M5 16.5h14l-1.2 1.5H6.2L5 16.5Z" fill={`url(#${uid}-indigo)`} />
    </Glyph>
  );
}

function ShirtIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M12 6.5 9 9.5v9h6v-9l-3-3Z" fill={`url(#${uid}-violet)`} />
      <path d="M9 9.5h6" stroke="#ffffff" strokeOpacity="0.5" />
    </Glyph>
  );
}

function ChipIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <rect x="7.5" y="7.5" width="9" height="9" rx="1.5" fill={`url(#${uid}-blue)`} />
      <rect x="9.5" y="9.5" width="5" height="5" rx="0.8" fill={`url(#${uid}-cyan)`} />
    </Glyph>
  );
}

function SofaIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <rect x="5" y="11" width="14" height="4.5" rx="1.5" fill={`url(#${uid}-amber)`} />
      <rect x="6" y="8.5" width="12" height="3.5" rx="1.2" fill={`url(#${uid}-blue)`} />
    </Glyph>
  );
}

function LeafIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M12 6c-3.5 2-5 5.5-4.5 9.5 2.5-1 4.5-3.5 4.5-9.5Z" fill={`url(#${uid}-green)`} />
      <path d="M12 6v9.5" stroke="#ffffff" strokeOpacity="0.45" />
    </Glyph>
  );
}

function BallIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <circle cx="12" cy="12" r="5.5" fill={`url(#${uid}-green)`} />
      <path d="M8 10.5c2.5 1 5.5 1 8 0" stroke="#ffffff" strokeOpacity="0.45" fill="none" />
    </Glyph>
  );
}

function PawIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <ellipse cx="9" cy="10" rx="1.6" ry="2" fill={`url(#${uid}-amber)`} />
      <ellipse cx="15" cy="10" rx="1.6" ry="2" fill={`url(#${uid}-amber)`} />
      <ellipse cx="12" cy="14.5" rx="3.2" ry="2.6" fill={`url(#${uid}-blue)`} />
    </Glyph>
  );
}

function BriefcaseIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <rect x="6" y="9" width="12" height="7.5" rx="1.5" fill={`url(#${uid}-indigo)`} />
      <path d="M9.5 9V7.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V9" stroke={`url(#${uid}-blue)`} strokeWidth="1.2" fill="none" />
    </Glyph>
  );
}

function WrenchIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M7 16.5 14.5 9a2.8 2.8 0 1 0-4-4L5 12.5" fill="none" stroke={`url(#${uid}-blue)`} strokeWidth="2.2" strokeLinecap="round" />
    </Glyph>
  );
}

function WheelIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <circle cx="12" cy="12" r="5.5" fill="none" stroke={`url(#${uid}-blue)`} strokeWidth="2.2" />
      <circle cx="12" cy="12" r="1.5" fill={`url(#${uid}-indigo)`} />
    </Glyph>
  );
}

function StackIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <rect x="6" y="12" width="12" height="3" rx="0.8" fill={`url(#${uid}-amber)`} />
      <rect x="7" y="9" width="10" height="3" rx="0.8" fill={`url(#${uid}-blue)`} />
      <rect x="8" y="6" width="8" height="3" rx="0.8" fill={`url(#${uid}-indigo)`} />
    </Glyph>
  );
}

function StarIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M12 6.2l1.4 3.1 3.4.4-2.5 2.2.75 3.3L12 13.5l-3.1 1.7.75-3.3-2.5-2.2 3.4-.4L12 6.2Z" fill={`url(#${uid}-violet)`} />
    </Glyph>
  );
}

function GridIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={7 + col * 3.2}
            y={7 + row * 3.2}
            width="2.4"
            height="2.4"
            rx="0.5"
            fill={`url(#${uid}-blue)`}
          />
        )),
      )}
    </Glyph>
  );
}

function SparkleIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M12 5.5v4M12 14.5v4M5.5 12h4M14.5 12h4M7.8 7.8l2.8 2.8M13.4 13.4l2.8 2.8M16.2 7.8l-2.8 2.8M10.6 13.4l-2.8 2.8" stroke={`url(#${uid}-rose)`} strokeWidth="1.6" strokeLinecap="round" />
    </Glyph>
  );
}

function HeartIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M12 17.5s-5.5-3.4-5.5-7.2c0-2 1.6-3.2 3.4-3.2 1.2 0 2.2.6 2.8 1.5.6-.9 1.6-1.5 2.8-1.5 1.8 0 3.4 1.2 3.4 3.2 0 3.8-5.5 7.2-5.5 7.2Z" fill={`url(#${uid}-rose)`} />
    </Glyph>
  );
}

function BabyIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <circle cx="12" cy="10" r="3" fill={`url(#${uid}-cyan)`} />
      <path d="M7.5 16.5c1-2.5 9-2.5 9 0" fill={`url(#${uid}-blue)`} />
    </Glyph>
  );
}

function DiamondIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M12 6 7 11l5 7 5-7-5-5Z" fill={`url(#${uid}-violet)`} />
    </Glyph>
  );
}

function HammerIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <rect x="6" y="11" width="8" height="3" rx="1" fill={`url(#${uid}-amber)`} />
      <rect x="13" y="7" width="3" height="10" rx="1" fill={`url(#${uid}-blue)`} />
    </Glyph>
  );
}

function BikeIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <circle cx="8.5" cy="14.5" r="2.2" fill="none" stroke={`url(#${uid}-green)`} strokeWidth="1.6" />
      <circle cx="15.5" cy="14.5" r="2.2" fill="none" stroke={`url(#${uid}-green)`} strokeWidth="1.6" />
      <path d="M10.5 14.5 12 9.5h2l1.5 5" fill="none" stroke={`url(#${uid}-blue)`} strokeWidth="1.4" />
    </Glyph>
  );
}

function KidsFashionIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M12 7 9.5 9.5v7.5h5V9.5L12 7Z" fill={`url(#${uid}-cyan)`} />
      <path d="M12 10.5l-.8 1.2.8 1 .8-1-.8-1.2Z" fill="#ffffff" opacity="0.7" />
    </Glyph>
  );
}

function WomensFashionIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M12 5.5 9 8v10h6V8l-3-2.5Z" fill={`url(#${uid}-rose)`} />
      <path d="M10 8h4" stroke="#ffffff" strokeOpacity="0.45" />
      <path d="M10.5 13.5h3" stroke="#ffffff" strokeOpacity="0.35" />
    </Glyph>
  );
}

function MensFashionIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M12 6 9.5 8.5v9h5v-9L12 6Z" fill={`url(#${uid}-indigo)`} />
      <path d="M12 8.5v7" stroke={`url(#${uid}-blue)`} strokeWidth="1.4" />
      <path d="M11 10.5h2" stroke="#ffffff" strokeOpacity="0.5" />
    </Glyph>
  );
}

function ToolsIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <rect x="6.5" y="6.5" width="3" height="11" rx="0.8" fill={`url(#${uid}-amber)`} transform="rotate(-35 8 12)" />
      <path d="M14 7.5 16.5 10a2.2 2.2 0 1 1-3.1 3.1L10 9.5" fill="none" stroke={`url(#${uid}-blue)`} strokeWidth="1.8" strokeLinecap="round" />
    </Glyph>
  );
}

function GamingIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <rect x="6" y="9.5" width="12" height="7" rx="2.2" fill={`url(#${uid}-indigo)`} />
      <circle cx="9" cy="13" r="1.1" fill={`url(#${uid}-violet)`} />
      <rect x="13.5" y="11.5" width="2.5" height="2.5" rx="0.5" fill={`url(#${uid}-blue)`} />
      <rect x="13.5" y="14.5" width="2.5" height="2.5" rx="0.5" fill={`url(#${uid}-cyan)`} />
    </Glyph>
  );
}

function ShoesIcon({ uid }: { uid: string }) {
  return (
    <Glyph uid={uid}>
      <path d="M6.5 14.5c1.5-2 4-2.5 6.5-1.5 2 .8 3.5.8 5.5-.2 1.2-.6 2.2-.8 3.5-.8v2.5H6.5v0Z" fill={`url(#${uid}-blue)`} />
      <path d="M9 12.5c1.2-.8 2.8-1 4.2-.4" stroke="#ffffff" strokeOpacity="0.45" fill="none" />
    </Glyph>
  );
}

const RENDERERS: Record<HomeCategoryIconType, (uid: string) => ReactElement> = {
  vehicles: (uid) => <CarIcon uid={uid} />,
  property: (uid) => <HouseIcon uid={uid} />,
  phones: (uid) => <PhoneIcon uid={uid} />,
  computers: (uid) => <LaptopIcon uid={uid} />,
  fashion: (uid) => <ShirtIcon uid={uid} />,
  electronics: (uid) => <ChipIcon uid={uid} />,
  gaming: (uid) => <GamingIcon uid={uid} />,
  furniture: (uid) => <SofaIcon uid={uid} />,
  "home-garden": (uid) => <LeafIcon uid={uid} />,
  sports: (uid) => <BallIcon uid={uid} />,
  pets: (uid) => <PawIcon uid={uid} />,
  jobs: (uid) => <BriefcaseIcon uid={uid} />,
  services: (uid) => <WrenchIcon uid={uid} />,
  autoparts: (uid) => <WheelIcon uid={uid} />,
  wholesale: (uid) => <StackIcon uid={uid} />,
  auctions: (uid) => <StarIcon uid={uid} />,
  more: (uid) => <GridIcon uid={uid} />,
  beauty: (uid) => <SparkleIcon uid={uid} />,
  health: (uid) => <HeartIcon uid={uid} />,
  baby: (uid) => <BabyIcon uid={uid} />,
  jewellery: (uid) => <DiamondIcon uid={uid} />,
  diy: (uid) => <HammerIcon uid={uid} />,
  tools: (uid) => <ToolsIcon uid={uid} />,
  "kids-fashion": (uid) => <KidsFashionIcon uid={uid} />,
  "womens-fashion": (uid) => <WomensFashionIcon uid={uid} />,
  "mens-fashion": (uid) => <MensFashionIcon uid={uid} />,
  shoes: (uid) => <ShoesIcon uid={uid} />,
  cycling: (uid) => <BikeIcon uid={uid} />,
};

export function HomeCategoryIcon3D({ type, className, size = 40 }: HomeCategoryIcon3DProps) {
  const uid = useId().replace(/:/g, "");
  const render = RENDERERS[type] ?? RENDERERS.more;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("rx-category-icon-3d shrink-0", className)}
      aria-hidden
    >
      <IconDefs uid={uid} />
      {render(uid)}
    </svg>
  );
}
