const CATEGORY_IMAGES: Record<string, string> = {
  vehicles:
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600&fit=crop",
  property:
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
  electronics:
    "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=600&fit=crop",
  fashion:
    "https://images.unsplash.com/photo-1483985988355-763728e3685b?w=800&h=600&fit=crop",
  "home-garden":
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
  diy: "https://images.unsplash.com/photo-1581244277943-fe4c9ad3c672?w=800&h=600&fit=crop",
  tools:
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=600&fit=crop",
  sports:
    "https://images.unsplash.com/photo-1461896836934-ffe607ba7951?w=800&h=600&fit=crop",
  health:
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop",
  beauty:
    "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop",
  pets: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop",
  "baby-kids":
    "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=600&fit=crop",
  toys: "https://images.unsplash.com/photo-1558068315-48d05f7a7923?w=800&h=600&fit=crop",
  books:
    "https://images.unsplash.com/photo-1512820790801-8453a7400576?w=800&h=600&fit=crop",
  music:
    "https://images.unsplash.com/photo-1511379938546-c1f69419868d?w=800&h=600&fit=crop",
  movies:
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop",
  gaming:
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop",
  collectibles:
    "https://images.unsplash.com/photo-1618336753974-dae1488c173a?w=800&h=600&fit=crop",
  business:
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop",
  jobs: "https://images.unsplash.com/photo-1521737711867-e3b97375f597?w=800&h=600&fit=crop",
  services:
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=600&fit=crop",
  tickets:
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop",
  food: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop",
  office:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop",
  industrial:
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop",
  agriculture:
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&h=600&fit=crop",
  travel:
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop",
  events:
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop",
  "free-stuff":
    "https://images.unsplash.com/photo-1513885535751-05f0b0195c95?w=800&h=600&fit=crop",
  "everything-else":
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop";

export function getCategoryImageUrl(slug: string): string {
  return CATEGORY_IMAGES[slug] ?? DEFAULT_IMAGE;
}

export function getCategoryIcon(slug: string): string {
  const icons: Record<string, string> = {
    vehicles: "🚗",
    property: "🏠",
    electronics: "📱",
    fashion: "👗",
    "home-garden": "🌿",
    diy: "🔨",
    tools: "🛠️",
    sports: "⚽",
    health: "💊",
    beauty: "💄",
    pets: "🐾",
    "baby-kids": "👶",
    toys: "🧸",
    books: "📚",
    music: "🎵",
    movies: "🎬",
    gaming: "🎮",
    collectibles: "🏆",
    business: "💼",
    jobs: "💼",
    services: "🤝",
    tickets: "🎫",
    food: "🍽️",
    office: "🖇️",
    industrial: "🏭",
    agriculture: "🌾",
    travel: "✈️",
    events: "🎉",
    "free-stuff": "🎁",
    "everything-else": "📦",
  };
  return icons[slug] ?? "🏷️";
}
