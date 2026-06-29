/**
 * ROVEXO v1.5 — Brand-new premium category icon masters (Prompt 015)
 * Raster-only pipeline — NOT imported from premium-visual-svgs.mjs
 */
import {
  CATEGORY_SIZE,
  categoryFrame,
  rasterTransparent,
  sharedCategoryDefs,
} from "./v15-render-utils.mjs";

const g = (x, y, w, h, r, fill, op = 1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" opacity="${op}"/>`;

/** @type {Record<string, string>} */
const CATEGORY_BODIES = {
  vehicles: `
    <g filter="url(#veh-sh)">
      <path d="M-290 95 L290 95 L330 175 L-330 175 Z" fill="#1e3a8a"/>
      <path d="M-290 95 L290 95 L250 35 L-250 35 Z" fill="#2563eb"/>
      <path d="M-220 35 L220 35 L190 -55 L-190 -55 Z" fill="url(#veh-metal)"/>
      <rect x="-175" y="-45" width="350" height="72" rx="18" fill="url(#veh-spec)" opacity="0.35"/>
      <ellipse cx="-195" cy="175" rx="62" ry="62" fill="#0f172a"/>
      <ellipse cx="-195" cy="175" rx="38" ry="38" fill="url(#veh-metal)"/>
      <ellipse cx="195" cy="175" rx="62" ry="62" fill="#0f172a"/>
      <ellipse cx="195" cy="175" rx="38" ry="38" fill="url(#veh-metal)"/>
      <rect x="-130" y="10" width="260" height="22" rx="11" fill="url(#veh-spec)" opacity="0.5"/>
    </g>`,
  autoparts: `
    <g filter="url(#ap-sh)">
      <circle cx="0" cy="15" r="215" fill="url(#ap-metal)"/>
      <circle cx="0" cy="15" r="150" fill="#111827"/>
      <circle cx="0" cy="15" r="92" fill="#374151"/>
      <circle cx="0" cy="15" r="48" fill="url(#ap-spec)" opacity="0.4"/>
      <path d="M0 -175 L32 -35 L165 -35 L82 45 L115 165 L0 92 L-115 165 L-82 45 L-165 -35 L-32 -35 Z" fill="#cbd5e1" opacity="0.85"/>
    </g>`,
  property: `
    <g filter="url(#pr-sh)">
      <path d="M0 -235 L275 15 V275 H-275 V15 Z" fill="#f8fafc"/>
      <path d="M0 -235 L-275 15 H275 Z" fill="#e2e8f0"/>
      <rect x="-75" y="55" width="150" height="220" rx="12" fill="#1e293b"/>
      <rect x="-160" y="5" width="85" height="85" rx="8" fill="#bae6fd" opacity="0.85"/>
      <rect x="75" y="5" width="85" height="85" rx="8" fill="#bae6fd" opacity="0.85"/>
      <rect x="-55" y="-195" width="110" height="18" rx="6" fill="url(#pr-spec)" opacity="0.45"/>
    </g>`,
  phones: `
    <g filter="url(#ph-sh)">
      <rect x="-135" y="-255" width="270" height="510" rx="48" fill="url(#ph-metal)"/>
      <rect x="-112" y="-215" width="224" height="430" rx="28" fill="#0f172a"/>
      <rect x="-95" y="-195" width="190" height="360" rx="18" fill="url(#ph-spec)" opacity="0.12"/>
      <rect x="-55" y="-235" width="110" height="26" rx="13" fill="#020617"/>
      <circle cx="0" cy="215" rx="20" ry="20" fill="#334155"/>
    </g>`,
  computers: `
    <g filter="url(#co-sh)">
      <rect x="-230" y="70" width="460" height="30" rx="12" fill="url(#co-metal)"/>
      <path d="M-210 55 L210 55 L178 -225 H-178 Z" fill="#cbd5e1"/>
      <rect x="-155" y="-185" width="310" height="195" rx="16" fill="#0f172a"/>
      <rect x="-130" y="-165" width="260" height="150" rx="10" fill="url(#co-spec)" opacity="0.18"/>
      <rect x="-45" y="100" width="90" height="48" rx="8" fill="#64748b"/>
    </g>`,
  electronics: `
    <g filter="url(#el-sh)">
      <path d="M-225 85 C-225 -55 -125 -155 0 -155 C125 -155 225 -55 225 85 V145 H-225 Z" fill="#111827"/>
      <ellipse cx="0" cy="85" rx="180" ry="115" fill="#1f2937"/>
      <rect x="175" y="-45" width="55" height="135" rx="24" fill="url(#el-metal)"/>
      <rect x="-230" y="-45" width="55" height="135" rx="24" fill="url(#el-metal)"/>
      <ellipse cx="-45" cy="-15" rx="95" ry="55" fill="url(#el-spec)" opacity="0.22"/>
    </g>`,
  gaming: `
    <g filter="url(#ga-sh)">
      <rect x="-240" y="-10" width="480" height="260" rx="82" fill="#1e293b"/>
      <circle cx="-125" cy="120" r="42" fill="#334155"/>
      <circle cx="135" cy="55" r="28" fill="#ef4444"/>
      <circle cx="185" cy="120" r="28" fill="#22c55e"/>
      <circle cx="135" cy="185" r="28" fill="#3b82f6"/>
      <circle cx="85" cy="120" r="28" fill="#f59e0b"/>
      <rect x="-55" y="55" width="110" height="110" rx="24" fill="url(#ga-metal)" opacity="0.7"/>
    </g>`,
  "home-garden": `
    <g filter="url(#hg-sh)">
      <ellipse cx="0" cy="110" rx="105" ry="78" fill="#166534"/>
      <ellipse cx="-45" cy="70" rx="82" ry="62" fill="#15803d"/>
      <ellipse cx="55" cy="60" rx="88" ry="65" fill="#22c55e"/>
      <ellipse cx="0" cy="25" rx="72" ry="52" fill="#4ade80"/>
      <rect x="-58" y="175" width="116" height="105" rx="22" fill="#92400e"/>
      <ellipse cx="0" cy="175" rx="58" ry="14" fill="url(#hg-spec)" opacity="0.35"/>
    </g>`,
  diy: `
    <g filter="url(#dy-sh)">
      <rect x="-28" y="-220" width="56" height="360" rx="28" fill="#dc2626"/>
      <ellipse cx="0" cy="-220" rx="95" ry="42" fill="url(#dy-metal)"/>
      <rect x="-95" y="-178" width="190" height="28" rx="10" fill="#991b1b"/>
      <rect x="-18" y="140" width="36" height="85" rx="8" fill="#7f1d1d"/>
    </g>`,
  tools: `
    <g filter="url(#tl-sh)">
      <path d="M-35 -230 L35 -230 L55 120 L-55 120 Z" fill="url(#tl-metal)"/>
      <rect x="-140" y="130" width="280" height="105" rx="28" fill="#0f172a"/>
      <rect x="-115" y="155" width="230" height="48" rx="12" fill="url(#tl-spec)" opacity="0.35"/>
      <circle cx="0" cy="-150" r="48" fill="#64748b"/>
    </g>`,
  fashion: `
    <g filter="url(#fa-sh)">
      <path d="M-155 -35 L-65 -185 L65 -185 L155 -35 L125 225 L-125 225 Z" fill="#2563eb"/>
      <path d="M-65 -185 L0 -125 L65 -185" fill="#1d4ed8"/>
      <path d="M-95 25 L0 95 L95 25 L75 225 L-75 225 Z" fill="url(#fa-spec)" opacity="0.28"/>
      <path d="M-35 -155 L0 -115 L35 -155" stroke="#ffffff" stroke-width="12" fill="none" stroke-linecap="round"/>
    </g>`,
  kids: `
    <g filter="url(#ki-sh)">
      <circle cx="0" cy="-55" r="118" fill="#fcd34d"/>
      <ellipse cx="0" cy="145" rx="168" ry="188" fill="#f59e0b"/>
      <circle cx="-58" cy="-75" r="15" fill="#0f172a"/>
      <circle cx="58" cy="-75" r="15" fill="#0f172a"/>
      <path d="M-38 -28 Q0 12 38 -28" stroke="#0f172a" stroke-width="8" fill="none" stroke-linecap="round"/>
    </g>`,
  sports: `
    <g filter="url(#sp-sh)">
      <circle cx="0" cy="15" r="188" fill="#f8fafc"/>
      <path d="M0 -145 C72 -85 72 115 0 175 C-72 115 -72 -85 0 -145 Z" fill="#0f172a" opacity="0.08"/>
      <path d="M-185 15 C-125 -45 -65 -45 0 15 C65 75 125 75 185 15" stroke="#0f172a" stroke-width="10" fill="none"/>
      <path d="M-185 15 C-125 75 -65 75 0 15 C65 -45 125 -45 185 15" stroke="#0f172a" stroke-width="10" fill="none"/>
    </g>`,
  pets: `
    <g filter="url(#pe-sh)">
      <ellipse cx="0" cy="95" rx="215" ry="168" fill="#d97706"/>
      <circle cx="0" cy="-85" r="128" fill="#fbbf24"/>
      <ellipse cx="-112" cy="-175" rx="48" ry="70" fill="#d97706"/>
      <ellipse cx="112" cy="-175" rx="48" ry="70" fill="#d97706"/>
      <circle cx="-58" cy="-98" r="14" fill="#0f172a"/>
      <circle cx="58" cy="-98" r="14" fill="#0f172a"/>
      <ellipse cx="0" cy="-58" rx="22" ry="16" fill="#0f172a"/>
    </g>`,
  business: `
    <g filter="url(#bu-sh)">
      <rect x="-205" y="-85" width="410" height="310" rx="24" fill="#78350f"/>
      <rect x="-175" y="-55" width="350" height="240" rx="12" fill="#92400e"/>
      <rect x="-38" y="-145" width="76" height="82" rx="12" fill="url(#bu-metal)"/>
      <circle cx="0" cy="85" r="36" fill="#f59e0b"/>
    </g>`,
  services: `
    <g filter="url(#se-sh)">
      <path d="M-85 -205 C-85 -125 -25 -85 35 -45 C95 -5 155 35 155 115 C155 195 95 235 15 235 C-65 235 -125 175 -125 95 C-125 15 -45 -25 15 -65 C75 -105 115 -145 75 -205 Z" fill="none" stroke="url(#se-metal)" stroke-width="44" stroke-linecap="round"/>
      <ellipse cx="75" cy="-205" rx="30" ry="30" fill="#cbd5e1"/>
    </g>`,
  luxury: `
    <g filter="url(#lu-sh)">
      <circle cx="0" cy="15" r="208" fill="url(#lu-metal)"/>
      <rect x="-40" y="-75" width="80" height="175" rx="10" fill="#1e293b"/>
      <circle cx="0" cy="15" r="28" fill="#f59e0b"/>
      <rect x="-72" y="-5" width="144" height="26" rx="8" fill="#cbd5e1"/>
    </g>`,
  collectibles: `
    <g filter="url(#cl-sh)">
      <rect x="-185" y="-105" width="370" height="320" rx="20" fill="url(#cl-metal)"/>
      <rect x="-155" y="-75" width="310" height="260" rx="12" fill="#fef3c7" opacity="0.35"/>
      <circle cx="0" cy="55" r="88" fill="#f59e0b"/>
      <path d="M0 -15 L42 55 L0 125 L-42 55 Z" fill="#b45309"/>
    </g>`,
  handmade: `
    <g filter="url(#hm-sh)">
      <path d="M-125 245 C-125 85 -65 -15 0 -15 C65 -15 125 85 125 245 Z" fill="#a16207"/>
      <ellipse cx="0" cy="-15" rx="118" ry="36" fill="#ca8a04"/>
      <path d="M-75 65 Q0 125 75 65" stroke="#fde68a" stroke-width="16" fill="none"/>
    </g>`,
  furniture: `
    <g filter="url(#fu-sh)">
      <rect x="-225" y="65" width="450" height="150" rx="36" fill="#64748b"/>
      <rect x="-195" y="-25" width="390" height="130" rx="28" fill="#94a3b8"/>
      ${g(-150, 5, 110, 45, 12, "#ffffff", 0.35)}
      <rect x="-235" y="215" width="34" height="88" rx="8" fill="#475569"/>
      <rect x="201" y="215" width="34" height="88" rx="8" fill="#475569"/>
    </g>`,
  "womens-fashion": `
    <g filter="url(#wf-sh)">
      <path d="M-130 -180 H130 L180 220 H-180 Z" fill="#db2777"/>
      <path d="M-80 -180 C-80 -220 -40 -250 0 -250 C40 -250 80 -220 80 -180 H-80 Z" fill="#be185d"/>
    </g>`,
  "mens-fashion": `
    <g filter="url(#mf-sh)">
      <path d="M-140 -160 H140 L190 230 H-190 Z" fill="#1e293b"/>
      <path d="M-90 -160 L0 -210 L90 -160" fill="#334155"/>
    </g>`,
  beauty: `
    <g filter="url(#be-sh)">
      <rect x="-38" y="-125" width="76" height="210" rx="18" fill="#ec4899"/>
      <ellipse cx="0" cy="-145" rx="58" ry="24" fill="#f472b6"/>
      <rect x="-92" y="45" width="52" height="135" rx="14" fill="url(#be-metal)"/>
      <rect x="40" y="25" width="62" height="155" rx="18" fill="#f9a8d4"/>
      <circle cx="71" cy="58" r="18" fill="#ffffff" opacity="0.55"/>
    </g>`,
  health: `
    <g filter="url(#he-sh)">
      <path d="M0 180 C-120 60 -120 -60 0 -120 C120 -60 120 60 0 180 Z" fill="#ef4444"/>
      <rect x="-28" y="-80" width="56" height="160" rx="12" fill="#ffffff"/>
      <rect x="-80" y="-28" width="160" height="56" rx="12" fill="#ffffff"/>
    </g>`,
  books: `
    <g filter="url(#bo-sh)">
      ${g(-135, -165, 92, 330, 8, "#2563eb")}
      ${g(-35, -145, 92, 310, 8, "#7c3aed")}
      ${g(65, -155, 92, 320, 8, "#0f172a")}
    </g>`,
  jewellery: `
    <g filter="url(#jw-sh)">
      <circle cx="0" cy="15" r="205" fill="url(#jw-metal)"/>
      <rect x="-38" y="-70" width="76" height="170" rx="8" fill="#1e293b"/>
      <circle cx="0" cy="15" r="26" fill="#f59e0b"/>
    </g>`,
  more: `
    <g filter="url(#mo-sh)">
      <circle cx="-72" cy="0" r="50" fill="#2563eb"/>
      <circle cx="0" cy="0" r="50" fill="#4338ca"/>
      <circle cx="72" cy="0" r="50" fill="#7c3aed"/>
    </g>`,
  export: `
    <g filter="url(#ex-sh)">
      <rect x="-185" y="-65" width="370" height="225" rx="20" fill="#2563eb"/>
      <path d="M-65 -20 L35 40 L-65 100 Z" fill="#ffffff"/>
      <path d="M35 40 H115 L175 100 H35 Z" fill="#93c5fd"/>
    </g>`,
};

/** Extended keys for library completeness */
export const V15_EXTENDED_KEYS = [
  "womens-fashion",
  "mens-fashion",
  "beauty",
  "health",
  "books",
  "jewellery",
  "more",
  "export",
];

export const V15_ALL_KEYS = [
  ...Object.keys(CATEGORY_BODIES).filter((k) => !V15_EXTENDED_KEYS.includes(k)),
  ...V15_EXTENDED_KEYS,
];

function buildCategorySvg(key) {
  const id = key.slice(0, 2).replace(/[^a-z]/g, "x");
  const defs = sharedCategoryDefs(id);
  const body = CATEGORY_BODIES[key];
  if (!body) throw new Error(`Missing v1.5 category body: ${key}`);
  return categoryFrame(defs, body);
}

/** @param {string} key */
export async function renderCategoryIcon(key) {
  const svg = buildCategorySvg(key);
  return rasterTransparent(svg, CATEGORY_SIZE, CATEGORY_SIZE);
}

export async function renderAllCategoryIcons(keys) {
  /** @type {Map<string, Buffer>} */
  const map = new Map();
  for (const key of keys) {
    map.set(key, await renderCategoryIcon(key));
  }
  return map;
}
