/**
 * ROVEXO v1.4 — Final production premium visual masters (Prompt 014)
 * Transparent object-only category icons · marketplace lifestyle hero photography
 */

const B = "#2563EB";
const I = "#4338CA";
const V = "#7C3AED";
const C = "#06B6D4";
const W = "#F8FAFC";
const K = "#0F172A";

function categoryDefs(id) {
  return `
  <defs>
    <linearGradient id="${id}-rx" x1="18%" y1="8%" x2="82%" y2="92%">
      <stop offset="0%" stop-color="${C}"/>
      <stop offset="48%" stop-color="${B}"/>
      <stop offset="100%" stop-color="${I}"/>
    </linearGradient>
    <linearGradient id="${id}-rx2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${B}"/>
      <stop offset="100%" stop-color="${V}"/>
    </linearGradient>
    <linearGradient id="${id}-metal" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="38%" stop-color="#E2E8F0"/>
      <stop offset="72%" stop-color="#94A3B8"/>
      <stop offset="100%" stop-color="#475569"/>
    </linearGradient>
    <linearGradient id="${id}-spec" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}-floor" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${K}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${K}" stop-opacity="0"/>
    </radialGradient>
    <filter id="${id}-shadow" x="-40%" y="-40%" width="180%" height="200%">
      <feDropShadow dx="0" dy="32" stdDeviation="28" flood-color="${K}" flood-opacity="0.26"/>
    </filter>
    <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="22" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

function wrapCategory(id, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
${categoryDefs(id)}
<g transform="translate(512 470) scale(0.88)" filter="url(#${id}-shadow)">
${body}
</g>
</svg>`;
}

const g = (id, x, y, w, h, r, fill, op = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" opacity="${op}"/>`;

/** @type {Record<string, string>} */
export const CATEGORY_PREMIUM_SVGS = {
  vehicles: wrapCategory("veh", `
    <path d="M-280 90 L280 90 L320 170 L-320 170 Z" fill="url(#veh-rx)"/>
    <path d="M-240 50 L240 50 L280 90 L-280 90 Z" fill="url(#veh-rx2)"/>
    ${g("veh", -180, -20, 360, 95, 26, "url(#veh-metal)", 1)}
    <ellipse cx="-190" cy="180" rx="58" ry="58" fill="${K}"/><ellipse cx="-190" cy="180" rx="34" ry="34" fill="url(#veh-metal)"/>
    <ellipse cx="190" cy="180" rx="58" ry="58" fill="${K}"/><ellipse cx="190" cy="180" rx="34" ry="34" fill="url(#veh-metal)"/>
    <rect x="-120" y="5" width="240" height="18" rx="9" fill="url(#veh-spec)" opacity="0.55"/>
  `),
  autoparts: wrapCategory("ap", `
    <circle cx="0" cy="20" r="210" fill="url(#ap-metal)"/>
    <circle cx="0" cy="20" r="145" fill="${K}"/>
    <circle cx="0" cy="20" r="88" fill="url(#ap-rx)"/>
    <path d="M0 -180 L36 -40 L176 -40 L88 40 L124 160 L0 88 L-124 160 L-88 40 L-176 -40 L-36 -40 Z" fill="url(#ap-rx2)" opacity="0.82"/>
    <ellipse cx="-60" cy="-60" rx="80" ry="40" fill="url(#ap-spec)" opacity="0.35"/>
  `),
  property: wrapCategory("pr", `
    <path d="M0 -220 L260 0 V260 H-260 V0 Z" fill="url(#pr-metal)"/>
    <path d="M0 -220 L-260 0 H260 Z" fill="url(#pr-rx)"/>
    <rect x="-70" y="40" width="140" height="220" rx="10" fill="url(#pr-rx2)"/>
    <rect x="-150" y="-10" width="80" height="80" rx="8" fill="${W}" opacity="0.85"/>
    <rect x="70" y="-10" width="80" height="80" rx="8" fill="${W}" opacity="0.85"/>
  `),
  phones: wrapCategory("ph", `
    <rect x="-130" y="-250" width="260" height="500" rx="44" fill="url(#ph-metal)"/>
    <rect x="-108" y="-210" width="216" height="420" rx="22" fill="url(#ph-rx)"/>
    <rect x="-70" y="-190" width="140" height="24" rx="12" fill="${K}" opacity="0.35"/>
    <ellipse cx="0" cy="210" rx="18" ry="18" fill="#CBD5E1"/>
    <rect x="-90" y="-170" width="180" height="120" rx="12" fill="url(#ph-spec)" opacity="0.22"/>
  `),
  computers: wrapCategory("co", `
    <rect x="-220" y="60" width="440" height="28" rx="10" fill="url(#co-metal)"/>
    <path d="M-200 40 L200 40 L170 -210 H-170 Z" fill="url(#co-rx)"/>
    <rect x="-150" y="-170" width="300" height="180" rx="14" fill="url(#co-rx2)" opacity="0.88"/>
    <rect x="-40" y="88" width="80" height="44" rx="8" fill="#64748B"/>
    <rect x="-120" y="-150" width="240" height="60" rx="8" fill="url(#co-spec)" opacity="0.28"/>
  `),
  electronics: wrapCategory("el", `
    <path d="M-220 80 C-220 -60 -120 -160 0 -160 C120 -160 220 -60 220 80 V140 H-220 Z" fill="url(#el-rx)"/>
    <ellipse cx="0" cy="80" rx="175" ry="110" fill="url(#el-rx2)"/>
    <rect x="170" y="-50" width="52" height="130" rx="22" fill="url(#el-metal)"/>
    <rect x="-222" y="-50" width="52" height="130" rx="22" fill="url(#el-metal)"/>
    <ellipse cx="-40" cy="-20" rx="90" ry="50" fill="url(#el-spec)" opacity="0.25"/>
  `),
  gaming: wrapCategory("ga", `
    <rect x="-230" y="-20" width="460" height="250" rx="76" fill="url(#ga-rx)"/>
    <circle cx="-120" cy="105" r="40" fill="url(#ga-rx2)"/>
    <circle cx="130" cy="50" r="26" fill="#EF4444"/>
    <circle cx="180" cy="105" r="26" fill="#22C55E"/>
    <circle cx="130" cy="160" r="26" fill="#F59E0B"/>
    <circle cx="80" cy="105" r="26" fill="#3B82F6"/>
    <rect x="-50" y="45" width="100" height="100" rx="22" fill="url(#ga-metal)" opacity="0.75"/>
  `),
  "home-garden": wrapCategory("hg", `
    <ellipse cx="0" cy="120" rx="95" ry="70" fill="#166534"/>
    <ellipse cx="-40" cy="80" rx="75" ry="55" fill="#15803D"/>
    <ellipse cx="50" cy="70" rx="80" ry="58" fill="#22C55E"/>
    <ellipse cx="0" cy="40" rx="65" ry="48" fill="#4ADE80"/>
    <rect x="-55" y="180" width="110" height="95" rx="18" fill="url(#hg-rx)"/>
    <rect x="-45" y="190" width="90" height="75" rx="12" fill="url(#hg-rx2)" opacity="0.55"/>
    <path d="M-30 180 Q0 150 30 180" stroke="url(#hg-metal)" stroke-width="8" fill="none"/>
  `),
  diy: wrapCategory("dy", `
    <rect x="-200" y="-80" width="400" height="280" rx="26" fill="#DC2626"/>
    <rect x="-170" y="-50" width="340" height="210" rx="14" fill="url(#dy-metal)"/>
    <rect x="-35" y="-20" width="70" height="150" rx="8" fill="url(#dy-rx)"/>
    <rect x="-200" y="200" width="400" height="24" rx="8" fill="#991B1B"/>
  `),
  tools: wrapCategory("tl", `
    <rect x="-35" y="-220" width="70" height="400" rx="22" fill="url(#tl-rx)"/>
    <rect x="-130" y="140" width="260" height="100" rx="26" fill="${K}"/>
    <rect x="-105" y="165" width="210" height="44" rx="12" fill="url(#tl-metal)"/>
    <circle cx="0" cy="-140" r="46" fill="url(#tl-rx2)"/>
  `),
  fashion: wrapCategory("fa", `
    <path d="M-150 -40 L-60 -180 L60 -180 L150 -40 L120 220 L-120 220 Z" fill="url(#fa-rx)"/>
    <path d="M-60 -180 L0 -120 L60 -180" fill="url(#fa-rx2)" opacity="0.75"/>
    <path d="M-90 20 L0 80 L90 20 L70 220 L-70 220 Z" fill="url(#fa-metal)" opacity="0.38"/>
    <path d="M-35 -150 L0 -110 L35 -150" stroke="${W}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <rect x="-120" y="40" width="240" height="18" rx="9" fill="url(#fa-spec)" opacity="0.35"/>
  `),
  kids: wrapCategory("ki", `
    <circle cx="0" cy="-50" r="115" fill="url(#ki-rx)"/>
    <ellipse cx="0" cy="140" rx="165" ry="185" fill="url(#ki-rx2)"/>
    <circle cx="-55" cy="-70" r="14" fill="${K}"/><circle cx="55" cy="-70" r="14" fill="${K}"/>
    <path d="M-35 -25 Q0 15 35 -25" stroke="${K}" stroke-width="7" fill="none" stroke-linecap="round"/>
    <ellipse cx="-75" cy="-120" rx="34" ry="46" fill="url(#ki-rx)"/>
    <ellipse cx="75" cy="-120" rx="34" ry="46" fill="url(#ki-rx)"/>
  `),
  sports: wrapCategory("sp", `
    <circle cx="0" cy="20" r="185" fill="url(#sp-rx)"/>
    <path d="M0 -150 C70 -90 70 130 0 190 C-70 130 -70 -90 0 -150 Z" fill="url(#sp-rx2)" opacity="0.55"/>
    <path d="M-180 20 C-120 -40 -60 -40 0 20 C60 80 120 80 180 20" stroke="${W}" stroke-width="9" fill="none"/>
    <path d="M-180 20 C-120 80 -60 80 0 20 C60 -40 120 -40 180 20" stroke="${W}" stroke-width="9" fill="none"/>
  `),
  pets: wrapCategory("pe", `
    <ellipse cx="0" cy="90" rx="210" ry="165" fill="url(#pe-rx)"/>
    <circle cx="0" cy="-80" r="125" fill="url(#pe-rx2)"/>
    <ellipse cx="-110" cy="-170" rx="46" ry="68" fill="url(#pe-rx)"/>
    <ellipse cx="110" cy="-170" rx="46" ry="68" fill="url(#pe-rx)"/>
    <circle cx="-55" cy="-95" r="13" fill="${K}"/><circle cx="55" cy="-95" r="13" fill="${K}"/>
    <ellipse cx="0" cy="-55" rx="20" ry="14" fill="${K}"/>
  `),
  business: wrapCategory("bu", `
    <rect x="-200" y="-80" width="400" height="300" rx="22" fill="url(#bu-rx)"/>
    <rect x="-170" y="-50" width="340" height="230" rx="10" fill="url(#bu-rx2)" opacity="0.42"/>
    <rect x="-35" y="-140" width="70" height="75" rx="10" fill="url(#bu-metal)"/>
    <circle cx="0" cy="80" r="34" fill="#F59E0B"/>
  `),
  services: wrapCategory("se", `
    <path d="M-80 -200 C-80 -120 -20 -80 40 -40 C100 0 160 40 160 120 C160 200 100 240 20 240 C-60 240 -120 180 -120 100 C-120 20 -40 -20 20 -60 C80 -100 120 -140 80 -200 Z" fill="none" stroke="url(#se-rx)" stroke-width="42" stroke-linecap="round"/>
    <path d="M80 -200 C120 -140 80 -100 20 -60" fill="none" stroke="url(#se-rx2)" stroke-width="42" stroke-linecap="round"/>
    <ellipse cx="80" cy="-200" rx="28" ry="28" fill="url(#se-metal)"/>
    <ellipse cx="-40" cy="-120" rx="22" ry="22" fill="url(#se-rx)" opacity="0.65"/>
  `),
  luxury: wrapCategory("lu", `
    <circle cx="0" cy="20" r="205" fill="url(#lu-metal)"/>
    <circle cx="0" cy="20" r="165" fill="url(#lu-rx)" opacity="0.28"/>
    <rect x="-38" y="-70" width="76" height="170" rx="8" fill="url(#lu-rx2)"/>
    <circle cx="0" cy="20" r="26" fill="#F59E0B"/>
    <rect x="-70" y="0" width="140" height="24" rx="8" fill="url(#lu-metal)"/>
  `),
  collectibles: wrapCategory("cl", `
    <rect x="-180" y="-100" width="360" height="310" rx="18" fill="url(#cl-metal)"/>
    <rect x="-150" y="-70" width="300" height="250" rx="10" fill="url(#cl-rx)" opacity="0.35"/>
    <circle cx="0" cy="55" r="85" fill="url(#cl-rx2)"/>
    <path d="M0 -15 L45 55 L0 125 L-45 55 Z" fill="#F59E0B"/>
  `),
  handmade: wrapCategory("hm", `
    <path d="M-120 240 C-120 80 -60 -20 0 -20 C60 -20 120 80 120 240 Z" fill="url(#hm-rx)"/>
    <ellipse cx="0" cy="-20" rx="115" ry="34" fill="url(#hm-rx2)"/>
    <path d="M-70 60 Q0 120 70 60" stroke="url(#hm-metal)" stroke-width="14" fill="none"/>
    <path d="M-50 140 Q0 200 50 140" stroke="url(#hm-metal)" stroke-width="11" fill="none"/>
  `),
  furniture: wrapCategory("fu", `
    <rect x="-220" y="60" width="440" height="145" rx="34" fill="url(#fu-rx)"/>
    <rect x="-190" y="-30" width="380" height="125" rx="26" fill="url(#fu-rx2)"/>
    <rect x="-230" y="205" width="32" height="85" rx="8" fill="url(#fu-metal)"/>
    <rect x="198" y="205" width="32" height="85" rx="8" fill="url(#fu-metal)"/>
    <rect x="-150" y="10" width="110" height="45" rx="12" fill="${W}" opacity="0.42"/>
  `),
};

/** Extended library assets (not on rail — generated for /public/categories/) */
export const EXTENDED_CATEGORY_SVGS = {
  "womens-fashion": wrapCategory("wf", `
    <path d="M-130 -180 H130 L180 220 H-180 Z" fill="url(#wf-rx)"/>
    <path d="M-80 -180 C-80 -220 -40 -250 0 -250 C40 -250 80 -220 80 -180 H-80 Z" fill="url(#wf-rx2)"/>
    <path d="M-60 -20 H60 L80 220 H-80 Z" fill="url(#wf-metal)" opacity="0.32"/>
    <rect x="-35" y="-150" width="70" height="16" rx="8" fill="${W}" opacity="0.7"/>
  `),
  "mens-fashion": wrapCategory("mf", `
    <path d="M-140 -160 H140 L190 230 H-190 Z" fill="url(#mf-rx)"/>
    <path d="M-90 -160 L0 -210 L90 -160" fill="url(#mf-rx2)"/>
    <rect x="-100" y="-40" width="200" height="18" rx="9" fill="${W}" opacity="0.65"/>
    <rect x="-70" y="20" width="140" height="160" rx="8" fill="url(#mf-metal)" opacity="0.35"/>
  `),
  beauty: wrapCategory("be", `
    <rect x="-35" y="-120" width="70" height="200" rx="16" fill="url(#be-rx)"/>
    <ellipse cx="0" cy="-140" rx="55" ry="22" fill="url(#be-rx2)"/>
    <rect x="-90" y="40" width="55" height="140" rx="14" fill="url(#be-metal)"/>
    <rect x="35" y="20" width="65" height="160" rx="18" fill="url(#be-rx2)" opacity="0.88"/>
    <circle cx="67" cy="55" r="18" fill="${W}" opacity="0.55"/>
    <ellipse cx="0" cy="160" rx="48" ry="48" fill="url(#be-rx)" opacity="0.75"/>
  `),
  health: wrapCategory("he", `
    <rect x="-120" y="-120" width="240" height="240" rx="36" fill="url(#he-rx)"/>
    <rect x="-28" y="-80" width="56" height="160" rx="12" fill="${W}"/>
    <rect x="-80" y="-28" width="160" height="56" rx="12" fill="${W}"/>
  `),
  books: wrapCategory("bo", `
    <rect x="-130" y="-160" width="90" height="320" rx="8" fill="url(#bo-rx)"/>
    <rect x="-30" y="-140" width="90" height="300" rx="8" fill="url(#bo-rx2)"/>
    <rect x="70" y="-150" width="90" height="310" rx="8" fill="url(#bo-metal)"/>
  `),
  jewellery: wrapCategory("jw", `
    <circle cx="0" cy="20" r="205" fill="url(#jw-metal)"/>
    <circle cx="0" cy="20" r="165" fill="url(#jw-rx)" opacity="0.28"/>
    <rect x="-38" y="-70" width="76" height="170" rx="8" fill="url(#jw-rx2)"/>
    <circle cx="0" cy="20" r="26" fill="#F59E0B"/>
    <rect x="-70" y="0" width="140" height="24" rx="8" fill="url(#jw-metal)"/>
  `),
  more: wrapCategory("mo", `
    <circle cx="-70" cy="0" r="48" fill="url(#mo-rx)"/>
    <circle cx="0" cy="0" r="48" fill="url(#mo-rx2)"/>
    <circle cx="70" cy="0" r="48" fill="url(#mo-metal)"/>
  `),
  export: wrapCategory("ex", `
    <rect x="-180" y="-60" width="360" height="220" rx="18" fill="url(#ex-rx)"/>
    <path d="M-60 -20 L40 40 L-60 100 Z" fill="${W}"/>
    <path d="M40 40 H120 L180 100 H40 Z" fill="url(#ex-rx2)"/>
    <rect x="-150" y="180" width="300" height="24" rx="8" fill="url(#ex-metal)"/>
  `),
};

function heroMaster(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="hBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B1220"/>
      <stop offset="35%" stop-color="#1E3A8A"/>
      <stop offset="68%" stop-color="#4338CA"/>
      <stop offset="100%" stop-color="#6D28D9"/>
    </linearGradient>
    <linearGradient id="hLight" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.55"/>
      <stop offset="42%" stop-color="#000000" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="hSpot" cx="78%" cy="32%" r="45%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
    <filter id="hSh"><feDropShadow dx="0" dy="28" stdDeviation="32" flood-opacity="0.42"/></filter>
  </defs>
  <rect width="1920" height="1080" fill="url(#hBg)"/>
  <rect width="1920" height="1080" fill="url(#hSpot)"/>
  <rect width="1920" height="1080" fill="url(#hLight)"/>
  <g filter="url(#hSh)">${body}</g>
</svg>`;
}

/** @type {Record<string, string>} */
export const HERO_CAMPAIGN_SVGS = {
  "move-store": heroMaster(`
    <rect x="860" y="200" width="340" height="340" rx="28" fill="${W}" opacity="0.97"/>
    <text x="910" y="275" fill="${B}" font-family="Segoe UI,Arial,sans-serif" font-size="44" font-weight="800">ROVEXO</text>
    <rect x="1240" y="240" width="130" height="200" rx="28" fill="${W}" opacity="0.94"/>
    <rect x="1400" y="220" width="220" height="145" rx="28" fill="${W}" opacity="0.92"/>
    <rect x="1380" y="400" width="180" height="120" rx="28" fill="${W}" opacity="0.9"/>
    <rect x="1180" y="480" width="150" height="95" rx="28" fill="${W}" opacity="0.88"/>
    <rect x="1560" y="460" width="200" height="130" rx="28" fill="${W}" opacity="0.86"/>
    <rect x="1040" y="520" width="110" height="75" rx="28" fill="${W}" opacity="0.85"/>
    <rect x="920" y="580" width="280" height="180" rx="28" fill="${W}" opacity="0.84"/>
    <circle cx="1100" cy="780" r="44" fill="${W}" opacity="0.8"/>
    <circle cx="1540" cy="190" r="22" fill="#BFDBFE" opacity="0.9"/>
    <circle cx="1660" cy="360" r="16" fill="#C4B5FD" opacity="0.85"/>
  `),
  "zero-fees": heroMaster(`
    <path d="M1020 200 H1580 L1660 660 H940 Z" fill="#F59E0B"/>
    <circle cx="1300" cy="390" r="140" fill="${W}" opacity="0.18"/>
    <text x="1210" y="445" fill="${W}" font-family="Segoe UI,Arial,sans-serif" font-size="100" font-weight="800">£0</text>
    <rect x="1140" y="700" width="320" height="110" rx="28" fill="${W}" opacity="0.94"/>
    <circle cx="1210" cy="755" r="22" fill="${B}"/>
    <circle cx="1290" cy="755" r="22" fill="${B}"/>
    <circle cx="1370" cy="755" r="22" fill="${B}"/>
    <rect x="1460" y="240" width="130" height="130" rx="28" fill="${W}" opacity="0.9"/>
    <rect x="1520" y="520" width="160" height="110" rx="28" fill="${W}" opacity="0.86"/>
  `),
  "verified-businesses": heroMaster(`
    <rect x="900" y="260" width="420" height="320" rx="28" fill="${W}" opacity="0.94"/>
    <rect x="940" y="300" width="340" height="200" rx="28" fill="#E0E7FF"/>
    <rect x="1360" y="280" width="280" height="260" rx="28" fill="${W}" opacity="0.91"/>
    <circle cx="1500" cy="410" r="56" fill="#22C55E"/>
    <path d="M1472 410 L1490 428 L1530 378" stroke="${W}" stroke-width="12" fill="none" stroke-linecap="round"/>
    <rect x="960" y="640" width="240" height="90" rx="28" fill="${W}" opacity="0.86"/>
    <rect x="1240" y="620" width="180" height="110" rx="28" fill="${W}" opacity="0.84"/>
  `),
  "buy-securely": heroMaster(`
    <path d="M1300 200 L1560 300 V590 C1560 740 1300 840 1300 840 C1300 840 1040 740 1040 590 V300 Z" fill="${W}" opacity="0.95"/>
    <path d="M1300 290 L1480 370 V560 C1480 680 1300 760 1300 760 C1300 760 1120 680 1120 560 V370 Z" fill="${B}"/>
    <rect x="960" y="660" width="220" height="150" rx="28" fill="${W}" opacity="0.92"/>
    <circle cx="1070" cy="735" r="40" fill="#22C55E"/>
    <path d="M1048 735 L1065 752 L1098 708" stroke="${W}" stroke-width="9" fill="none" stroke-linecap="round"/>
    <rect x="1480" y="640" width="180" height="130" rx="28" fill="${W}" opacity="0.88"/>
    <rect x="1180" y="280" width="160" height="110" rx="28" fill="${W}" opacity="0.82"/>
  `),
  "fast-delivery": heroMaster(`
    <rect x="880" y="540" width="520" height="160" rx="28" fill="${W}" opacity="0.94"/>
    <rect x="960" y="580" width="360" height="80" rx="28" fill="${B}" opacity="0.9"/>
    <path d="M1440 560 H1600 L1680 720 H1420 Z" fill="${W}" opacity="0.92"/>
    <circle cx="1540" cy="750" r="42" fill="${K}"/>
    <circle cx="1540" cy="750" r="24" fill="#CBD5E1"/>
    <rect x="1000" y="300" width="320" height="150" rx="28" fill="${W}" opacity="0.89"/>
    <rect x="1360" y="320" width="200" height="110" rx="28" fill="${W}" opacity="0.85"/>
    <rect x="1180" y="720" width="140" height="100" rx="28" fill="${W}" opacity="0.83"/>
  `),
  "electronics-deals": heroMaster(`
    <rect x="900" y="260" width="180" height="360" rx="28" fill="${W}" opacity="0.95"/>
    <rect x="920" y="290" width="140" height="280" rx="22" fill="url(#hBg)" opacity="0.4"/>
    <rect x="1120" y="300" width="340" height="220" rx="28" fill="${W}" opacity="0.93"/>
    <rect x="1160" y="340" width="260" height="140" rx="22" fill="#E0E7FF"/>
    <rect x="1500" y="280" width="200" height="200" rx="28" fill="${W}" opacity="0.91"/>
    <circle cx="1600" cy="380" r="70" fill="url(#hBg)" opacity="0.35"/>
    <rect x="1100" y="560" width="260" height="140" rx="28" fill="${W}" opacity="0.89"/>
    <rect x="1400" y="540" width="180" height="100" rx="28" fill="${W}" opacity="0.87"/>
    <rect x="1580" y="520" width="120" height="160" rx="28" fill="${W}" opacity="0.85"/>
    <circle cx="980" cy="680" r="36" fill="${W}" opacity="0.82"/>
  `),
  "home-garden": heroMaster(`
    <rect x="920" y="560" width="380" height="140" rx="28" fill="${W}" opacity="0.93"/>
    <rect x="960" y="280" width="300" height="200" rx="28" fill="${W}" opacity="0.92"/>
    <ellipse cx="1110" cy="380" rx="90" ry="60" fill="#22C55E" opacity="0.55"/>
    <rect x="1300" y="300" width="280" height="160" rx="28" fill="${W}" opacity="0.9"/>
    <path d="M1420 460 C1460 420 1520 420 1560 460 L1580 520 H1400 Z" fill="#166534" opacity="0.65"/>
    <rect x="1480" y="580" width="200" height="120" rx="28" fill="${W}" opacity="0.88"/>
    <rect x="1020" y="720" width="160" height="90" rx="28" fill="${W}" opacity="0.86"/>
    <circle cx="1240" cy="720" r="50" fill="#15803D" opacity="0.7"/>
  `),
  "premium-auctions": heroMaster(`
    <rect x="920" y="280" width="300" height="300" rx="28" fill="${W}" opacity="0.94"/>
    <circle cx="1070" cy="430" r="90" fill="url(#hBg)" opacity="0.35"/>
    <rect x="1260" y="260" width="240" height="180" rx="28" fill="${W}" opacity="0.92"/>
    <rect x="1300" y="300" width="160" height="100" rx="22" fill="#F59E0B" opacity="0.75"/>
    <path d="M1520 520 L1620 420 L1680 520 H1520 Z" fill="url(#hBg)" opacity="0.55"/>
    <rect x="980" y="620" width="200" height="120" rx="28" fill="${W}" opacity="0.9"/>
    <rect x="1220" y="600" width="280" height="140" rx="28" fill="${W}" opacity="0.88"/>
    <text x="1340" y="690" fill="${B}" font-family="Segoe UI,Arial,sans-serif" font-size="52" font-weight="800">BID</text>
    <circle cx="1600" cy="680" r="48" fill="#F59E0B" opacity="0.85"/>
  `),
};

export const HERO_CAMPAIGN_IDS = Object.keys(HERO_CAMPAIGN_SVGS);

export const ALL_CATEGORY_SVGS = { ...CATEGORY_PREMIUM_SVGS, ...EXTENDED_CATEGORY_SVGS };

export const EXTENDED_CATEGORY_KEYS = Object.keys(EXTENDED_CATEGORY_SVGS);
