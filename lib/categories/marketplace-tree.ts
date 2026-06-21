import type { CategoryNode } from "@/lib/categories/types";

function leaf(id: string, name: string, slug: string): CategoryNode {
  return { id, name, slug };
}

function branch(
  id: string,
  name: string,
  slug: string,
  children: CategoryNode[],
): CategoryNode {
  return { id, name, slug, children };
}

function leaves(prefix: string, items: readonly (readonly [string, string])[]): CategoryNode[] {
  return items.map(([name, slug]) => leaf(`${prefix}-${slug}`, name, slug));
}

function standardCategory(
  id: string,
  name: string,
  slug: string,
  subcategories: readonly (readonly [string, string, readonly (readonly [string, string])[]])[],
): CategoryNode {
  return branch(
    id,
    name,
    slug,
    subcategories.map(([subName, subSlug, childItems]) =>
      branch(
        `${id}-${subSlug}`,
        subName,
        subSlug,
        leaves(`${id}-${subSlug}`, childItems),
      ),
    ),
  );
}

const homeGardenTree = branch("cat-home-garden", "Home & Garden", "home-garden", [
  branch("cat-home-furniture", "Furniture", "furniture", [
    ...leaves("cat-home-furniture", [
      ["Beds", "beds"],
      ["Mattresses", "mattresses"],
      ["Bed Frames", "bed-frames"],
      ["Bedside Tables", "bedside-tables"],
      ["Wardrobes", "wardrobes"],
      ["Drawers", "drawers"],
      ["Sofas", "sofas"],
      ["Chairs", "chairs"],
      ["Dining Tables", "dining-tables"],
      ["Coffee Tables", "coffee-tables"],
      ["TV Units", "tv-units"],
      ["Office Furniture", "office-furniture"],
    ]),
  ]),
  branch("cat-home-bedding", "Bedding", "bedding", [
    ...leaves("cat-home-bedding", [
      ["Bed Sheets", "bed-sheets"],
      ["Duvet Covers", "duvet-covers"],
      ["Pillows", "pillows"],
      ["Pillow Cases", "pillow-cases"],
      ["Duvets", "duvets"],
      ["Mattress Protectors", "mattress-protectors"],
      ["Blankets", "blankets"],
      ["Throws", "throws"],
    ]),
  ]),
  leaf("cat-home-kitchen", "Kitchen", "kitchen"),
  leaf("cat-home-bathroom", "Bathroom", "bathroom"),
  leaf("cat-home-garden-outdoor", "Garden", "garden"),
  leaf("cat-home-lighting", "Lighting", "lighting"),
  leaf("cat-home-decor", "Decor", "decor"),
  leaf("cat-home-storage", "Storage", "storage"),
  leaf("cat-home-cleaning", "Cleaning", "cleaning"),
]);

export const categoryTree: CategoryNode[] = [
  standardCategory("cat-vehicles", "Vehicles", "vehicles", [
    ["Cars", "cars", [["Parts", "parts"], ["Accessories", "accessories"], ["Electrics", "electrics"]]],
    ["Motorbikes", "motorbikes", [["Parts", "parts"], ["Gear", "gear"], ["Accessories", "accessories"]]],
    ["Vans & Trucks", "vans-trucks", [["Commercial", "commercial"], ["Parts", "parts"], ["Accessories", "accessories"]]],
  ]),
  standardCategory("cat-property", "Property", "property", [
    ["For Sale", "for-sale", [["Houses", "houses"], ["Apartments", "apartments"], ["Land", "land"]]],
    ["To Rent", "to-rent", [["Houses", "houses"], ["Apartments", "apartments"], ["Rooms", "rooms"]]],
    ["Commercial", "commercial", [["Offices", "offices"], ["Retail", "retail"], ["Industrial", "industrial"]]],
  ]),
  standardCategory("cat-electronics", "Electronics", "electronics", [
    ["Phones & Tablets", "phones-tablets", [["Smartphones", "smartphones"], ["Tablets", "tablets"], ["Wearables", "wearables"]]],
    ["Computing", "computing", [["Laptops", "laptops"], ["Desktops", "desktops"], ["Accessories", "accessories"]]],
    ["Audio", "audio", [["Headphones", "headphones"], ["Speakers", "speakers"], ["Earbuds", "earbuds"]]],
    ["TV & Video", "tv-video", [["Televisions", "televisions"], ["Projectors", "projectors"], ["Streaming", "streaming"]]],
  ]),
  standardCategory("cat-fashion", "Fashion", "fashion", [
    ["Women", "women", [["Dresses", "dresses"], ["Tops", "tops"], ["Shoes", "shoes"]]],
    ["Men", "men", [["Shirts", "shirts"], ["Jeans", "jeans"], ["Shoes", "shoes"]]],
    ["Accessories", "accessories", [["Bags", "bags"], ["Watches", "watches"], ["Jewellery", "jewellery"]]],
  ]),
  homeGardenTree,
  standardCategory("cat-diy", "DIY", "diy", [
    ["Building", "building", [["Timber", "timber"], ["Plaster", "plaster"], ["Insulation", "insulation"]]],
    ["Painting", "painting", [["Paint", "paint"], ["Brushes", "brushes"], ["Wallpaper", "wallpaper"]]],
    ["Plumbing", "plumbing", [["Fittings", "fittings"], ["Tools", "tools"], ["Fixtures", "fixtures"]]],
  ]),
  standardCategory("cat-tools", "Tools", "tools", [
    ["Power Tools", "power-tools", [["Drills", "drills"], ["Saws", "saws"], ["Sanders", "sanders"]]],
    ["Hand Tools", "hand-tools", [["Wrenches", "wrenches"], ["Screwdrivers", "screwdrivers"], ["Hammers", "hammers"]]],
    ["Workshop", "workshop", [["Benches", "benches"], ["Storage", "storage"], ["Safety", "safety"]]],
  ]),
  standardCategory("cat-sports", "Sports", "sports", [
    ["Footwear", "footwear", [["Running", "running"], ["Football", "football"], ["Training", "training"]]],
    ["Equipment", "equipment", [["Fitness", "fitness"], ["Outdoor", "outdoor"], ["Cycling", "cycling"]]],
    ["Team Sports", "team-sports", [["Football", "football"], ["Rugby", "rugby"], ["Cricket", "cricket"]]],
  ]),
  standardCategory("cat-health", "Health", "health", [
    ["Wellness", "wellness", [["Supplements", "supplements"], ["Vitamins", "vitamins"], ["Fitness", "fitness"]]],
    ["Medical", "medical", [["Mobility", "mobility"], ["Monitoring", "monitoring"], ["First Aid", "first-aid"]]],
    ["Personal Care", "personal-care", [["Oral Care", "oral-care"], ["Shaving", "shaving"], ["Hygiene", "hygiene"]]],
  ]),
  standardCategory("cat-beauty", "Beauty", "beauty", [
    ["Skincare", "skincare", [["Moisturisers", "moisturisers"], ["Serums", "serums"], ["Cleansers", "cleansers"]]],
    ["Makeup", "makeup", [["Face", "face"], ["Lips", "lips"], ["Eyes", "eyes"]]],
    ["Hair", "hair", [["Styling", "styling"], ["Colour", "colour"], ["Tools", "tools"]]],
  ]),
  standardCategory("cat-pets", "Pets", "pets", [
    ["Dogs", "dogs", [["Food", "food"], ["Accessories", "accessories"], ["Beds", "beds"]]],
    ["Cats", "cats", [["Food", "food"], ["Accessories", "accessories"], ["Toys", "toys"]]],
    ["Other Pets", "other-pets", [["Birds", "birds"], ["Fish", "fish"], ["Small Animals", "small-animals"]]],
  ]),
  standardCategory("cat-baby-kids", "Baby & Kids", "baby-kids", [
    ["Baby", "baby", [["Clothing", "clothing"], ["Gear", "gear"], ["Nursery", "nursery"]]],
    ["Kids Clothing", "kids-clothing", [["Boys", "boys"], ["Girls", "girls"], ["Unisex", "unisex"]]],
    ["School", "school", [["Uniforms", "uniforms"], ["Bags", "bags"], ["Stationery", "stationery"]]],
  ]),
  standardCategory("cat-toys", "Toys", "toys", [
    ["Building & Blocks", "building-blocks", [["LEGO", "lego"], ["Bricks", "bricks"], ["Sets", "sets"]]],
    ["Games", "games", [["Board Games", "board-games"], ["Puzzles", "puzzles"], ["Card Games", "card-games"]]],
    ["Outdoor Toys", "outdoor-toys", [["Scooters", "scooters"], ["Sports", "sports"], ["Playhouses", "playhouses"]]],
  ]),
  standardCategory("cat-books", "Books", "books", [
    ["Fiction", "fiction", [["Crime", "crime"], ["Romance", "romance"], ["Sci-Fi", "sci-fi"]]],
    ["Non-Fiction", "non-fiction", [["Biography", "biography"], ["History", "history"], ["Self Help", "self-help"]]],
    ["Children", "children", [["Picture Books", "picture-books"], ["Young Adult", "young-adult"], ["Educational", "educational"]]],
  ]),
  standardCategory("cat-music", "Music", "music", [
    ["Instruments", "instruments", [["Guitars", "guitars"], ["Keyboards", "keyboards"], ["Drums", "drums"]]],
    ["Vinyl & CDs", "vinyl-cds", [["Vinyl", "vinyl"], ["CDs", "cds"], ["Cassettes", "cassettes"]]],
    ["DJ & Studio", "dj-studio", [["Controllers", "controllers"], ["Microphones", "microphones"], ["Mixers", "mixers"]]],
  ]),
  standardCategory("cat-movies", "Movies", "movies", [
    ["Blu-ray", "blu-ray", [["Action", "action"], ["Drama", "drama"], ["Comedy", "comedy"]]],
    ["DVD", "dvd", [["Box Sets", "box-sets"], ["Kids", "kids"], ["Documentary", "documentary"]]],
    ["Collectibles", "movie-collectibles", [["Posters", "posters"], ["Merchandise", "merchandise"], ["Limited Editions", "limited-editions"]]],
  ]),
  standardCategory("cat-gaming", "Gaming", "gaming", [
    ["Consoles", "consoles", [["PlayStation", "playstation"], ["Xbox", "xbox"], ["Nintendo", "nintendo"]]],
    ["Games", "video-games", [["Action", "action"], ["Sports", "sports"], ["RPG", "rpg"]]],
    ["Accessories", "gaming-accessories", [["Controllers", "controllers"], ["Headsets", "headsets"], ["Chairs", "chairs"]]],
  ]),
  standardCategory("cat-collectibles", "Collectibles", "collectibles", [
    ["Trading Cards", "trading-cards", [["Sports Cards", "sports-cards"], ["Pokemon", "pokemon"], ["Magic", "magic"]]],
    ["Vintage", "vintage", [["Cameras", "cameras"], ["Coins", "coins"], ["Memorabilia", "memorabilia"]]],
    ["Art", "art", [["Prints", "prints"], ["Sculptures", "sculptures"], ["Originals", "originals"]]],
  ]),
  standardCategory("cat-business", "Business", "business", [
    ["Equipment", "business-equipment", [["Office", "office"], ["Retail", "retail"], ["Catering", "catering"]]],
    ["Inventory", "inventory", [["Stock", "stock"], ["Wholesale", "wholesale"], ["Clearance", "clearance"]]],
    ["Franchise", "franchise", [["Opportunities", "opportunities"], ["Licences", "licences"], ["Partnerships", "partnerships"]]],
  ]),
  standardCategory("cat-jobs", "Jobs", "jobs", [
    ["Full Time", "full-time", [["Retail", "retail"], ["Office", "office"], ["Trades", "trades"]]],
    ["Part Time", "part-time", [["Hospitality", "hospitality"], ["Remote", "remote"], ["Seasonal", "seasonal"]]],
    ["Freelance", "freelance", [["Design", "design"], ["Development", "development"], ["Marketing", "marketing"]]],
  ]),
  standardCategory("cat-services", "Services", "services", [
    ["Home", "home-services", [["Cleaning", "cleaning"], ["Repairs", "repairs"], ["Gardening", "gardening"]]],
    ["Professional", "professional-services", [["Legal", "legal"], ["Accounting", "accounting"], ["Consulting", "consulting"]]],
    ["Creative", "creative-services", [["Photography", "photography"], ["Design", "design"], ["Writing", "writing"]]],
  ]),
  standardCategory("cat-tickets", "Tickets", "tickets", [
    ["Concerts", "concerts", [["Pop", "pop"], ["Rock", "rock"], ["Classical", "classical"]]],
    ["Sports Events", "sports-events", [["Football", "football"], ["Rugby", "rugby"], ["Motorsport", "motorsport"]]],
    ["Theatre", "theatre", [["Musicals", "musicals"], ["Comedy", "comedy"], ["Drama", "drama"]]],
  ]),
  standardCategory("cat-food", "Food", "food", [
    ["Groceries", "groceries", [["Pantry", "pantry"], ["Fresh", "fresh"], ["Frozen", "frozen"]]],
    ["Speciality", "speciality", [["Organic", "organic"], ["International", "international"], ["Artisan", "artisan"]]],
    ["Beverages", "beverages", [["Coffee", "coffee"], ["Tea", "tea"], ["Soft Drinks", "soft-drinks"]]],
  ]),
  standardCategory("cat-office", "Office", "office", [
    ["Furniture", "office-furniture", [["Desks", "desks"], ["Chairs", "chairs"], ["Storage", "storage"]]],
    ["Supplies", "supplies", [["Stationery", "stationery"], ["Paper", "paper"], ["Ink", "ink"]]],
    ["Technology", "office-technology", [["Printers", "printers"], ["Monitors", "monitors"], ["Phones", "phones"]]],
  ]),
  standardCategory("cat-industrial", "Industrial", "industrial", [
    ["Machinery", "machinery", [["Manufacturing", "manufacturing"], ["Packaging", "packaging"], ["Processing", "processing"]]],
    ["Safety", "safety", [["PPE", "ppe"], ["Signage", "signage"], ["Equipment", "equipment"]]],
    ["Materials", "materials", [["Metals", "metals"], ["Plastics", "plastics"], ["Chemicals", "chemicals"]]],
  ]),
  standardCategory("cat-agriculture", "Agriculture", "agriculture", [
    ["Farm Equipment", "farm-equipment", [["Tractors", "tractors"], ["Implements", "implements"], ["Trailers", "trailers"]]],
    ["Livestock", "livestock", [["Feed", "feed"], ["Supplies", "supplies"], ["Fencing", "fencing"]]],
    ["Produce", "produce", [["Seeds", "seeds"], ["Plants", "plants"], ["Harvest", "harvest"]]],
  ]),
];

export const homeCategories = categoryTree.map(({ name, slug }) => ({ name, slug }));
