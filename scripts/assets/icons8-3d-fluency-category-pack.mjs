/**
 * Icons8 3D Fluency — homepage category icon mapping (single collection).
 * CDN: https://img.icons8.com/3d-fluency/{size}/{name}.png
 * License: self-hosted per Icons8 terms — https://icons8.com/license
 */
export const ICONS8_3D_FLUENCY_COLLECTION = "icons8-3d-fluency";

/** @type {Record<string, readonly string[]>} */
export const CATEGORY_ICON_CANDIDATES = {
  vehicles: ["car", "sports-car", "jeep"],
  property: ["home", "real-estate", "city"],
  phones: ["smartphone", "iphone", "android"],
  computers: ["laptop", "macbook", "computer"],
  electronics: ["headset", "headphones", "airpods"],
  gaming: ["game-controller", "joystick", "playstation"],
  "home-garden": ["armchair", "sofa", "flower-pot"],
  diy: ["drill", "paint-brush", "hammer"],
  tools: ["toolbox", "tools", "wrench"],
  "womens-fashion": ["dress", "blouse", "skirt", "woman", "female", "clothes"],
  "mens-fashion": ["leather", "blazer", "suit", "man", "male", "coat"],
  "kids-fashion": ["teddy-bear", "toy", "puzzle", "lego", "rubber-duck"],
  shoes: ["flip-flops", "slippers", "sneakers"],
  jewellery: ["diamond-ring", "ring", "necklace"],
  beauty: ["lipstick", "perfume", "cosmetics"],
  health: ["stethoscope", "hospital", "heart-with-pulse"],
  pets: ["dog", "cat", "paw"],
  sports: ["football", "basketball", "dumbbell"],
  services: ["briefcase", "customer-support", "handshake"],
  autoparts: ["tire", "wheel", "steering-wheel"],
};

export function icons8FluencyUrl(name, size = 512) {
  return `https://img.icons8.com/3d-fluency/${size}/${encodeURIComponent(name)}.png`;
}
