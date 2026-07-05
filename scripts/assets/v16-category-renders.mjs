/**
 * ROVEXO v1.6 — Brand-new Premium 3D category icon pack.
 * Raster masters only — consistent ROVEXO blue/white studio identity.
 */
import {
  CATEGORY_SIZE,
  categoryFrame,
  polishCategoryMaster,
  rasterTransparent,
  sharedCategoryDefs,
} from "./v16-render-utils.mjs";

/** Homepage rail — all 20 premium 3D category bodies */
const CATEGORY_BODIES = {
  vehicles: `
    <g filter="url(#ve-sh)">
      <ellipse cx="0" cy="195" rx="310" ry="28" fill="#0f172a" opacity="0.12"/>
      <path d="M-300 85 L300 85 L340 175 L-340 175 Z" fill="url(#ve-rx)"/>
      <path d="M-300 85 L300 85 L265 15 L-265 15 Z" fill="#1d4ed8"/>
      <path d="M-235 15 L235 15 L205 -95 L-205 -95 Z" fill="url(#ve-metal)"/>
      <rect x="-185" y="-75" width="370" height="82" rx="20" fill="url(#ve-spec)" opacity="0.38"/>
      <rect x="-145" y="25" width="290" height="28" rx="12" fill="url(#ve-spec)" opacity="0.45"/>
      <ellipse cx="-210" cy="175" rx="68" ry="68" fill="#0f172a"/>
      <ellipse cx="-210" cy="175" rx="42" ry="42" fill="url(#ve-metal)"/>
      <ellipse cx="210" cy="175" rx="68" ry="68" fill="#0f172a"/>
      <ellipse cx="210" cy="175" rx="42" ry="42" fill="url(#ve-metal)"/>
      <rect x="-95" y="-55" width="55" height="48" rx="10" fill="#bae6fd" opacity="0.75"/>
      <rect x="40" y="-55" width="55" height="48" rx="10" fill="#bae6fd" opacity="0.75"/>
    </g>`,
  property: `
    <g filter="url(#pr-sh)">
      <ellipse cx="0" cy="255" rx="250" ry="22" fill="#0f172a" opacity="0.1"/>
      <path d="M0 -245 L285 25 V285 H-285 V25 Z" fill="#f8fafc"/>
      <path d="M0 -245 L-285 25 H285 Z" fill="#e2e8f0"/>
      <rect x="-82" y="65" width="164" height="220" rx="14" fill="url(#pr-rx)"/>
      <rect x="-175" y="15" width="92" height="92" rx="10" fill="#bae6fd" opacity="0.9"/>
      <rect x="83" y="15" width="92" height="92" rx="10" fill="#bae6fd" opacity="0.9"/>
      <rect x="-60" y="-205" width="120" height="20" rx="6" fill="url(#pr-spec)" opacity="0.5"/>
      <circle cx="0" cy="175" r="18" fill="url(#pr-metal)" opacity="0.85"/>
    </g>`,
  phones: `
    <g filter="url(#ph-sh)">
      <ellipse cx="0" cy="265" rx="120" ry="18" fill="#0f172a" opacity="0.1"/>
      <rect x="-138" y="-260" width="276" height="520" rx="50" fill="url(#ph-metal)"/>
      <rect x="-115" y="-220" width="230" height="440" rx="30" fill="#0f172a"/>
      <rect x="-98" y="-200" width="196" height="370" rx="20" fill="url(#ph-rx)" opacity="0.15"/>
      <rect x="-58" y="-240" width="116" height="28" rx="14" fill="#020617"/>
      <circle cx="0" cy="220" r="22" fill="#334155"/>
      <rect x="-72" y="-175" width="144" height="28" rx="8" fill="url(#ph-spec)" opacity="0.35"/>
    </g>`,
  computers: `
    <g filter="url(#co-sh)">
      <ellipse cx="0" cy="195" rx="260" ry="22" fill="#0f172a" opacity="0.1"/>
      <rect x="-235" y="75" width="470" height="32" rx="14" fill="url(#co-metal)"/>
      <path d="M-215 58 L215 58 L182 -235 H-182 Z" fill="#e2e8f0"/>
      <rect x="-160" y="-195" width="320" height="205" rx="18" fill="#0f172a"/>
      <rect x="-135" y="-172" width="270" height="158" rx="12" fill="url(#co-rx)" opacity="0.2"/>
      <rect x="-48" y="107" width="96" height="52" rx="10" fill="#64748b"/>
      <rect x="-175" y="-155" width="110" height="8" rx="4" fill="url(#co-spec)" opacity="0.45"/>
    </g>`,
  electronics: `
    <g filter="url(#el-sh)">
      <ellipse cx="0" cy="175" rx="220" ry="20" fill="#0f172a" opacity="0.1"/>
      <path d="M-230 90 C-230 -58 -128 -162 0 -162 C128 -162 230 -58 230 90 V152 H-230 Z" fill="#111827"/>
      <ellipse cx="0" cy="88" rx="185" ry="118" fill="#1f2937"/>
      <rect x="182" y="-48" width="58" height="142" rx="26" fill="url(#el-metal)"/>
      <rect x="-240" y="-48" width="58" height="142" rx="26" fill="url(#el-metal)"/>
      <ellipse cx="-48" cy="-18" rx="98" ry="58" fill="url(#el-rx)" opacity="0.28"/>
      <rect x="-55" y="55" width="110" height="12" rx="6" fill="url(#el-spec)" opacity="0.35"/>
    </g>`,
  gaming: `
    <g filter="url(#ga-sh)">
      <ellipse cx="0" cy="195" rx="260" ry="22" fill="#0f172a" opacity="0.1"/>
      <rect x="-245" y="-5" width="490" height="268" rx="88" fill="url(#ga-rx)"/>
      <circle cx="-130" cy="125" r="44" fill="#1e293b"/>
      <circle cx="140" cy="58" r="30" fill="#ef4444"/>
      <circle cx="192" cy="125" r="30" fill="#22c55e"/>
      <circle cx="140" cy="192" r="30" fill="#60a5fa"/>
      <circle cx="88" cy="125" r="30" fill="#f59e0b"/>
      <rect x="-58" y="58" width="116" height="116" rx="26" fill="url(#ga-metal)" opacity="0.75"/>
    </g>`,
  "home-garden": `
    <g filter="url(#hg-sh)">
      <ellipse cx="0" cy="210" rx="130" ry="18" fill="#0f172a" opacity="0.1"/>
      <ellipse cx="0" cy="115" rx="108" ry="80" fill="#166534"/>
      <ellipse cx="-48" cy="72" rx="85" ry="64" fill="#15803d"/>
      <ellipse cx="58" cy="62" rx="92" ry="68" fill="#22c55e"/>
      <ellipse cx="0" cy="28" rx="75" ry="54" fill="#4ade80"/>
      <rect x="-62" y="180" width="124" height="110" rx="24" fill="url(#hg-rx)"/>
      <ellipse cx="0" cy="180" rx="62" ry="15" fill="url(#hg-spec)" opacity="0.4"/>
    </g>`,
  diy: `
    <g filter="url(#dy-sh)">
      <ellipse cx="0" cy="210" rx="95" ry="16" fill="#0f172a" opacity="0.1"/>
      <rect x="-32" y="-225" width="64" height="370" rx="30" fill="url(#dy-rx)"/>
      <ellipse cx="0" cy="-225" rx="98" ry="44" fill="url(#dy-metal)"/>
      <rect x="-100" y="-182" width="200" height="30" rx="12" fill="#1e40af"/>
      <rect x="-20" y="145" width="40" height="88" rx="10" fill="#1e3a8a"/>
      <rect x="-75" y="-120" width="150" height="18" rx="6" fill="url(#dy-spec)" opacity="0.4"/>
    </g>`,
  tools: `
    <g filter="url(#tl-sh)">
      <ellipse cx="0" cy="210" rx="160" ry="18" fill="#0f172a" opacity="0.1"/>
      <path d="M-38 -235 L38 -235 L58 125 L-58 125 Z" fill="url(#tl-metal)"/>
      <rect x="-145" y="135" width="290" height="110" rx="30" fill="#0f172a"/>
      <rect x="-120" y="160" width="240" height="52" rx="14" fill="url(#tl-rx)" opacity="0.45"/>
      <circle cx="0" cy="-155" r="52" fill="#64748b"/>
      <rect x="-18" y="-175" width="36" height="42" rx="8" fill="url(#tl-spec)" opacity="0.35"/>
    </g>`,
  "womens-fashion": `
    <g filter="url(#wf-sh)">
      <ellipse cx="0" cy="210" rx="140" ry="18" fill="#0f172a" opacity="0.1"/>
      <path d="M-95 -55 C-95 -145 -55 -195 0 -195 C55 -195 95 -145 95 -55 L125 215 H-125 Z" fill="url(#wf-rx)"/>
      <path d="M-55 -195 C-55 -235 -28 -255 0 -255 C28 -255 55 -235 55 -195" fill="#1d4ed8"/>
      <rect x="-72" y="25" width="144" height="18" rx="8" fill="url(#wf-metal)" opacity="0.7"/>
      <circle cx="0" cy="-115" r="28" fill="url(#wf-spec)" opacity="0.35"/>
    </g>`,
  "mens-fashion": `
    <g filter="url(#mf-sh)">
      <ellipse cx="0" cy="215" rx="150" ry="18" fill="#0f172a" opacity="0.1"/>
      <path d="M-145 -165 H145 L198 235 H-198 Z" fill="#1e293b"/>
      <path d="M-95 -165 L0 -218 L95 -165" fill="#334155"/>
      <path d="M-55 -95 L0 -35 L55 -95 L35 235 H-35 Z" fill="url(#mf-rx)" opacity="0.35"/>
      <rect x="-88" y="-55" width="176" height="14" rx="6" fill="url(#mf-spec)" opacity="0.4"/>
    </g>`,
  "kids-fashion": `
    <g filter="url(#kf-sh)">
      <ellipse cx="0" cy="210" rx="155" ry="18" fill="#0f172a" opacity="0.1"/>
      <circle cx="0" cy="-62" r="122" fill="#fcd34d"/>
      <ellipse cx="0" cy="148" rx="172" ry="192" fill="url(#kf-rx)"/>
      <circle cx="-60" cy="-82" r="16" fill="#0f172a"/>
      <circle cx="60" cy="-82" r="16" fill="#0f172a"/>
      <path d="M-40 -32 Q0 8 40 -32" stroke="#0f172a" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="0" cy="95" rx="48" ry="38" fill="#f8fafc" opacity="0.35"/>
    </g>`,
  shoes: `
    <g filter="url(#sh-sh)">
      <ellipse cx="25" cy="195" rx="200" ry="20" fill="#0f172a" opacity="0.1"/>
      <path d="M-195 95 C-195 25 -125 -45 15 -45 C155 -45 225 25 225 95 L225 145 C225 175 195 195 155 195 H-155 C-195 195 -225 175 -225 145 Z" fill="#f8fafc"/>
      <path d="M-175 95 C-175 45 -115 -15 15 -15 C145 -15 205 45 205 95 L205 135 C205 158 182 175 155 175 H-125 C-158 175 -185 158 -185 135 Z" fill="url(#sh-rx)" opacity="0.35"/>
      <path d="M-155 95 L-95 55 L55 55 L115 95" fill="none" stroke="#1e40af" stroke-width="14" stroke-linecap="round"/>
      <ellipse cx="-55" cy="125" rx="42" ry="28" fill="#e2e8f0"/>
      <rect x="55" y="75" width="85" height="42" rx="18" fill="url(#sh-metal)" opacity="0.85"/>
    </g>`,
  jewellery: `
    <g filter="url(#jw-sh)">
      <ellipse cx="0" cy="195" rx="180" ry="18" fill="#0f172a" opacity="0.1"/>
      <circle cx="0" cy="18" r="210" fill="url(#jw-metal)"/>
      <rect x="-42" y="-78" width="84" height="178" rx="10" fill="#1e293b"/>
      <circle cx="0" cy="18" r="30" fill="url(#jw-rx)"/>
      <path d="M-95 -55 L0 18 L95 -55" fill="none" stroke="#f59e0b" stroke-width="10" stroke-linecap="round"/>
      <circle cx="0" cy="-95" r="22" fill="#fbbf24"/>
    </g>`,
  beauty: `
    <g filter="url(#be-sh)">
      <ellipse cx="0" cy="210" rx="130" ry="18" fill="#0f172a" opacity="0.1"/>
      <rect x="-42" y="-130" width="84" height="218" rx="20" fill="url(#be-rx)"/>
      <ellipse cx="0" cy="-152" rx="62" ry="26" fill="#60a5fa"/>
      <rect x="-98" y="48" width="56" height="142" rx="16" fill="url(#be-metal)"/>
      <rect x="42" y="28" width="66" height="162" rx="20" fill="#dbeafe"/>
      <circle cx="75" cy="62" r="20" fill="#ffffff" opacity="0.6"/>
    </g>`,
  health: `
    <g filter="url(#he-sh)">
      <ellipse cx="0" cy="210" rx="150" ry="18" fill="#0f172a" opacity="0.1"/>
      <path d="M0 188 C-125 65 -125 -65 0 -125 C125 -65 125 65 0 188 Z" fill="url(#he-rx)"/>
      <rect x="-30" y="-85" width="60" height="168" rx="14" fill="#ffffff"/>
      <rect x="-85" y="-32" width="170" height="60" rx="14" fill="#ffffff"/>
    </g>`,
  pets: `
    <g filter="url(#pe-sh)">
      <ellipse cx="0" cy="210" rx="200" ry="20" fill="#0f172a" opacity="0.1"/>
      <ellipse cx="0" cy="98" rx="218" ry="172" fill="#d97706"/>
      <circle cx="0" cy="-88" r="132" fill="#fbbf24"/>
      <ellipse cx="-115" cy="-178" rx="50" ry="72" fill="#d97706"/>
      <ellipse cx="115" cy="-178" rx="50" ry="72" fill="#d97706"/>
      <circle cx="-60" cy="-102" r="15" fill="#0f172a"/>
      <circle cx="60" cy="-102" r="15" fill="#0f172a"/>
      <ellipse cx="0" cy="-62" rx="24" ry="18" fill="#0f172a"/>
    </g>`,
  sports: `
    <g filter="url(#sp-sh)">
      <ellipse cx="0" cy="195" rx="170" ry="18" fill="#0f172a" opacity="0.1"/>
      <circle cx="0" cy="18" r="192" fill="#f8fafc"/>
      <path d="M0 -148 C75 -88 75 118 0 178 C-75 118 -75 -88 0 -148 Z" fill="#0f172a" opacity="0.08"/>
      <path d="M-188 18 C-128 -48 -68 -48 0 18 C68 78 128 78 188 18" stroke="#0f172a" stroke-width="10" fill="none"/>
      <path d="M-188 18 C-128 78 -68 78 0 18 C68 -48 128 -48 188 18" stroke="#0f172a" stroke-width="10" fill="none"/>
      <path d="M0 -148 L0 178" stroke="url(#sp-rx)" stroke-width="6" opacity="0.35"/>
    </g>`,
  services: `
    <g filter="url(#se-sh)">
      <ellipse cx="0" cy="210" rx="140" ry="18" fill="#0f172a" opacity="0.1"/>
      <rect x="-165" y="-95" width="330" height="245" rx="22" fill="url(#se-rx)"/>
      <rect x="-135" y="-65" width="270" height="185" rx="14" fill="#f8fafc" opacity="0.92"/>
      <path d="M-85 -25 H85 M0 -85 V35" stroke="#2563eb" stroke-width="16" stroke-linecap="round"/>
      <rect x="-55" y="95" width="110" height="18" rx="8" fill="url(#se-metal)" opacity="0.65"/>
    </g>`,
  autoparts: `
    <g filter="url(#ap-sh)">
      <ellipse cx="0" cy="205" rx="195" ry="20" fill="#0f172a" opacity="0.1"/>
      <circle cx="0" cy="18" r="218" fill="url(#ap-metal)"/>
      <circle cx="0" cy="18" r="152" fill="#111827"/>
      <circle cx="0" cy="18" r="95" fill="#374151"/>
      <circle cx="0" cy="18" r="52" fill="url(#ap-rx)" opacity="0.45"/>
      <path d="M0 -178 L34 -38 L168 -38 L84 48 L118 168 L0 95 L-118 168 L-84 48 L-168 -38 L-34 -38 Z" fill="#cbd5e1" opacity="0.88"/>
    </g>`,
};

export const V16_HOME_CATEGORY_KEYS = Object.keys(CATEGORY_BODIES);

function buildCategorySvg(key) {
  const id = key.slice(0, 2).replace(/[^a-z]/g, "x");
  const defs = sharedCategoryDefs(id);
  const body = CATEGORY_BODIES[key];
  if (!body) throw new Error(`Missing v1.6 category body: ${key}`);
  return categoryFrame(defs, body);
}

/** @param {string} key */
export async function renderCategoryIcon(key) {
  const svg = buildCategorySvg(key);
  const raster = await rasterTransparent(svg, CATEGORY_SIZE, CATEGORY_SIZE);
  return polishCategoryMaster(raster);
}

export async function renderAllCategoryIcons(keys) {
  /** @type {Map<string, Buffer>} */
  const map = new Map();
  for (const key of keys) {
    map.set(key, await renderCategoryIcon(key));
  }
  return map;
}
