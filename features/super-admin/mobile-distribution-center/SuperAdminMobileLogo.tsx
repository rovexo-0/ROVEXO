import { cn } from "@/lib/cn";

type SuperAdminMobileLogoProps = {
  className?: string;
  uid?: string;
};

/** Premium black & gold Super Admin mobile app mark — gold R inside ROVEXO hexagon */
export function SuperAdminMobileLogo({ className, uid = "sam" }: SuperAdminMobileLogoProps) {
  const gold = `${uid}-gold`;
  const goldShine = `${uid}-gold-shine`;
  const bg = `${uid}-bg`;
  const hexStroke = `${uid}-hex`;

  return (
    <div className={cn("mdc-logo-card", className)}>
      <svg viewBox="0 0 120 120" className="mdc-logo-card__icon" aria-hidden fill="none">
        <defs>
          <linearGradient id={bg} x1="10" y1="8" x2="110" y2="112" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0A0A0A" />
            <stop offset="0.5" stopColor="#141414" />
            <stop offset="1" stopColor="#050505" />
          </linearGradient>
          <linearGradient id={gold} x1="36" y1="28" x2="84" y2="88" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F5E6B8" />
            <stop offset="0.35" stopColor="#D4AF37" />
            <stop offset="0.7" stopColor="#B8860B" />
            <stop offset="1" stopColor="#8B6914" />
          </linearGradient>
          <linearGradient id={goldShine} x1="40" y1="30" x2="70" y2="55" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={hexStroke} x1="20" y1="16" x2="100" y2="104" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E8D5A3" stopOpacity="0.6" />
            <stop offset="1" stopColor="#8B6914" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="112" height="112" rx="28" fill={`url(#${bg})`} stroke={`url(#${hexStroke})`} strokeWidth="1.5" />
        <path
          d="M60 18 L96 38 V82 L60 102 L24 82 V38 Z"
          fill="none"
          stroke={`url(#${gold})`}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          fill={`url(#${gold})`}
          d="M44 82V38h16c12.2 0 19.6 6.5 19.6 16.2 0 7.1-3.6 12-9.8 14.2L82 82h-8.2l-9.8-20.4H52.2V82H44Zm8.2-28.8h12.5c5.8 0 9-2.7 9-7.6 0-4.8-3.2-7.6-9-7.6h-12.5v15.2Z"
        />
        <ellipse cx="52" cy="42" rx="22" ry="10" fill={`url(#${goldShine})`} />
      </svg>
      <p className="mdc-logo-card__label">SUPER ADMIN</p>
    </div>
  );
}
