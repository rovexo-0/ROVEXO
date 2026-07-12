/** Shared catalog item banks for enterprise taxonomy expansion. */

import type { ProductGroupDef } from "@/lib/categories/enterprise/builder";
import {
  BED_SHEET_FAMILIES,
  BLANKET_FAMILIES,
  DUVET_COVER_FAMILIES,
  DUVET_FAMILIES,
  MATTRESS_PROTECTOR_FAMILIES,
  PILLOWCASE_FAMILIES,
  PILLOW_FAMILIES,
  THROW_FAMILIES,
} from "@/lib/categories/enterprise/databases/product-families";

export const CAR_BODY_TYPES = [
  ["Saloon", "saloon"],
  ["Hatchback", "hatchback"],
  ["Estate", "estate"],
  ["SUV", "suv"],
  ["Coupe", "coupe"],
  ["Convertible", "convertible"],
  ["MPV", "mpv"],
  ["4x4", "4x4"],
  ["Classic", "classic"],
  ["Electric", "electric-cars"],
] as const;

export const CAR_MAKES = [
  "Audi", "BMW", "Citroen", "Fiat", "Ford", "Honda", "Hyundai", "Jaguar", "Kia",
  "Land Rover", "Mercedes-Benz", "Mini", "Nissan", "Peugeot", "Porsche", "Renault",
  "Seat", "Skoda", "Tesla", "Toyota", "Vauxhall", "Volkswagen", "Volvo",
] as const;

export const PHONE_BRANDS = [
  "Apple", "Samsung", "Google", "Huawei", "OnePlus", "Sony", "Nokia", "Motorola", "Oppo", "Xiaomi",
] as const;

export const COMPUTER_BRANDS = [
  "Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "Microsoft", "MSI", "Razer",
] as const;

export const TOOL_BRANDS = [
  "Bosch", "DeWalt", "Makita", "Milwaukee", "Ryobi", "Black and Decker", "Festool", "Einhell",
] as const;

export const FASHION_SIZES = [
  ["XS", "xs"], ["S", "s"], ["M", "m"], ["L", "l"], ["XL", "xl"], ["XXL", "xxl"],
] as const;

export const BEDDING_SIZES = [
  ["Single", "single"], ["Double", "double"], ["King", "king"], ["Super King", "super-king"],
] as const;

export const PROPERTY_TYPES = [
  ["Houses", "houses"], ["Flats", "flats"], ["Bungalows", "bungalows"],
  ["Land", "land"], ["Commercial", "commercial"], ["New Build", "new-build"],
] as const;

export const BOOK_GENRES = [
  ["Crime", "crime"], ["Romance", "romance"], ["Sci-Fi", "sci-fi"], ["Fantasy", "fantasy"],
  ["Thriller", "thriller"], ["Horror", "horror"], ["Biography", "biography"], ["History", "history"],
  ["Self Help", "self-help"], ["Cookery", "cookery"], ["Travel", "travel-books"], ["Children", "children"],
] as const;

export const SPORT_TYPES = [
  ["Football", "football"], ["Rugby", "rugby"], ["Cricket", "cricket"], ["Tennis", "tennis"],
  ["Golf", "golf"], ["Running", "running"], ["Cycling", "cycling-sport"], ["Swimming", "swimming"],
  ["Boxing", "boxing"], ["Martial Arts", "martial-arts"], ["Yoga", "yoga"], ["Gym", "gym"],
] as const;

export const PET_TYPES = [
  ["Dogs", "dogs"], ["Cats", "cats"], ["Birds", "birds"], ["Fish", "fish"],
  ["Reptiles", "reptiles"], ["Small Animals", "small-animals"], ["Horses", "horses"],
] as const;

export const GARDEN_ITEMS = [
  ["Plants", "plants"], ["Seeds", "seeds"], ["Pots", "pots"], ["Tools", "garden-tools"],
  ["Furniture", "garden-furniture"], ["BBQ", "bbq"], ["Sheds", "sheds"], ["Greenhouses", "greenhouses"],
  ["Lawn Care", "lawn-care"], ["Outdoor Lighting", "outdoor-lighting"],
] as const;

export const KITCHEN_ITEMS = [
  ["Appliances", "appliances"], ["Cookware", "cookware"], ["Tableware", "tableware"],
  ["Utensils", "utensils"], ["Storage", "kitchen-storage"], ["Kettles", "kettles"],
  ["Coffee Machines", "coffee-machines"], ["Blenders", "blenders"],
] as const;

export const BATHROOM_ITEMS = [
  ["Towels", "towels"], ["Accessories", "bathroom-accessories"], ["Showers", "showers"],
  ["Taps", "taps"], ["Mirrors", "mirrors"], ["Cabinets", "cabinets"], ["Baths", "baths"],
] as const;

export const FURNITURE_ITEMS = [
  ["Beds", "beds"], ["Mattresses", "mattresses"], ["Sofas", "sofas"], ["Chairs", "chairs"],
  ["Wardrobes", "wardrobes"], ["Drawers", "drawers"], ["Desks", "desks"],
  ["Bookcases", "bookcases"], ["TV Units", "tv-units"], ["Benches", "benches"],
] as const;

export const HOME_TEXTILES_ITEMS = [
  ["Blankets", "blankets"], ["Pillows", "textile-pillows"],
  ["Duvets", "textile-duvets"], ["Bed Sheets", "textile-bed-sheets"], ["Towels", "textile-towels"],
  ["Bath Mats", "bath-mats"], ["Cushions", "cushions"], ["Throws", "textile-throws"],
] as const;

export const CURTAIN_TYPES = [
  ["Blackout Curtains", "blackout-curtains"],
  ["Sheer Curtains", "sheer-curtains"],
  ["Thermal Curtains", "thermal-curtains"],
  ["Velvet Curtains", "velvet-curtains"],
  ["Net Curtains", "net-curtains"],
  ["Eyelet Curtains", "eyelet-curtains"],
  ["Pencil Pleat Curtains", "pencil-pleat-curtains"],
  ["Voile Curtains", "voile-curtains"],
] as const;

export const BLIND_TYPES = [
  ["Roman Blinds", "roman-blinds"],
  ["Roller Blinds", "roller-blinds"],
  ["Venetian Blinds", "venetian-blinds"],
  ["Vertical Blinds", "vertical-blinds"],
  ["Pleated Blinds", "pleated-blinds"],
  ["Blackout Blinds", "blackout-blinds"],
] as const;

export const TABLE_TYPES = [
  ["Dining Table", "dining-table"],
  ["Coffee Table", "coffee-table"],
  ["Office Desk", "office-desk-table"],
  ["Bedside Table", "bedside-table"],
  ["Outdoor Table", "outdoor-table"],
  ["Console Table", "console-table"],
] as const;

export const SMARTPHONE_ITEMS = [
  ["Apple iPhone", "apple-iphone"],
  ["Samsung Galaxy", "samsung-galaxy"],
  ["Google Pixel", "google-pixel"],
  ["Unlocked", "unlocked-phones"],
  ["Contract", "contract-phones"],
  ["Refurbished", "refurbished-phones"],
] as const;

export const FEATURE_PHONE_ITEMS = [
  ["Basic Phones", "basic-phones"],
  ["Senior Phones", "senior-phones"],
  ["Satellite Phones", "satellite-phones"],
] as const;

export const PHONE_ACCESSORY_ITEMS = [
  ["Chargers", "phone-chargers"],
  ["Cases", "phone-cases"],
  ["Screen Protectors", "screen-protectors"],
  ["Cables", "phone-cables"],
  ["Power Banks", "power-banks"],
  ["Earbuds", "phone-earbuds"],
] as const;

export const VEHICLE_EXTERIOR_ITEMS = [
  ["Bumpers", "exterior-bumpers"], ["Spoilers", "spoilers"], ["Roof Racks", "roof-racks"],
  ["Roof Boxes", "exterior-roof-boxes"], ["Wing Mirrors", "wing-mirrors"], ["Body Kits", "body-kits"],
  ["Grilles", "grilles"], ["Splitters", "splitters"], ["Mud Flaps", "mud-flaps"],
  ["Number Plates", "number-plates"], ["Badges", "badges"], ["Trim", "exterior-trim"],
] as const;

export const CONSTRUCTION_ITEMS = [
  ["Cement", "cement"], ["Concrete", "concrete"], ["Aggregates", "aggregates"],
  ["Scaffolding", "scaffolding"], ["Bricks", "bricks"], ["Blocks", "blocks"],
  ["Roofing", "roofing"], ["Guttering", "guttering"], ["Insulation Boards", "insulation-boards"],
] as const;

export const GYM_EQUIPMENT_ITEMS = [
  ["Dumbbells", "dumbbells"], ["Kettlebells", "kettlebells"], ["Barbells", "barbells"],
  ["Weight Plates", "weight-plates"], ["Power Racks", "power-racks"], ["Cross Trainers", "cross-trainers"],
  ["Rowing Machines", "rowing-machines"], ["Exercise Bikes", "gym-bikes"], ["Yoga Mats", "yoga-mats"],
] as const;

export const LUXURY_FASHION_ITEMS = [
  ["Designer Handbags", "designer-handbags"], ["Designer Shoes", "designer-shoes"],
  ["Designer Coats", "designer-coats"], ["Designer Dresses", "designer-dresses"],
  ["Designer Watches", "designer-watches"], ["Designer Jewellery", "designer-jewellery"],
] as const;

export const PHOTOGRAPHY_ITEMS = [
  ["DSLR Cameras", "dslr-cameras"], ["Mirrorless Cameras", "mirrorless-cameras"],
  ["Lenses", "camera-lenses"], ["Flashes", "camera-flashes"], ["Tripods", "tripods"],
  ["Camera Bags", "camera-bags"], ["Filters", "lens-filters"], ["Memory Cards", "memory-cards"],
] as const;

export const VEHICLE_INTERIOR_ITEMS = [
  ["Bench Seats", "bench-seats"], ["Seat Covers", "seat-covers"],
  ["Dashboard Covers", "dashboard-covers"], ["Dashboard", "vehicle-dashboard"],
  ["Floor Mats", "floor-mats"], ["Steering Wheels", "vehicle-steering-wheels"],
  ["Mirrors", "vehicle-mirrors"], ["Boot Liners", "boot-liners"], ["Roof Boxes", "roof-boxes"],
] as const;

export const TENT_ACCESSORY_ITEMS = [
  ["Tent Accessories", "tent-accessories"], ["Pegs", "tent-pegs"], ["Guy Ropes", "guy-ropes"],
  ["Groundsheets", "groundsheets"], ["Repair Kits", "tent-repair-kits"],
] as const;

/** 4-level bedding taxonomy: Category → Subcategory → Product Type → Product Family */
export const BEDDING_GROUPS: readonly ProductGroupDef[] = [
  { name: "Duvets", slug: "duvets", items: DUVET_FAMILIES },
  { name: "Pillows", slug: "pillows", items: PILLOW_FAMILIES },
  { name: "Pillowcases", slug: "pillowcases", items: PILLOWCASE_FAMILIES },
  { name: "Mattress Protectors", slug: "mattress-protectors", items: MATTRESS_PROTECTOR_FAMILIES },
  { name: "Throws", slug: "throws", items: THROW_FAMILIES },
  { name: "Blankets", slug: "blankets", items: BLANKET_FAMILIES },
  { name: "Bed Sheets", slug: "bed-sheets", items: BED_SHEET_FAMILIES },
  { name: "Duvet Covers", slug: "duvet-covers", items: DUVET_COVER_FAMILIES },
];

/** @deprecated Use BEDDING_GROUPS for 4-level paths. Kept for backward-compatible slug references. */
export const BEDDING_ITEMS = [
  ["Duvets", "duvets"], ["Pillows", "pillows"], ["Pillowcases", "pillowcases"],
  ["Mattress Protectors", "mattress-protectors"], ["Throws", "throws"], ["Blankets", "blankets"],
  ["Bed Sheets", "bed-sheets"], ["Duvet Covers", "duvet-covers"],
] as const;

export const DIY_ITEMS = [
  ["Paint", "paint"], ["Timber", "timber"], ["Plaster", "plaster"], ["Insulation", "insulation"],
  ["Flooring", "flooring"], ["Tiles", "tiles"], ["Adhesives", "adhesives"], ["Sealants", "sealants"],
] as const;

export const POWER_TOOL_ITEMS = [
  ["Drills", "drills"], ["Saws", "saws"], ["Sanders", "sanders"], ["Grinders", "grinders"],
  ["Routers", "routers"], ["Nail Guns", "nail-guns"], ["Multi Tools", "multi-tools"],
] as const;

export const COLLECTIBLE_TYPES = [
  ["Coins", "coins"], ["Stamps", "stamps"], ["Trading Cards", "trading-cards"],
  ["Comics", "comics"], ["Antiques", "antiques"], ["Memorabilia", "memorabilia"],
  ["Art", "art-collectibles"], ["Vintage Toys", "vintage-toys"],
] as const;

export const JOB_SECTORS = [
  ["Retail", "retail-jobs"], ["Office", "office-jobs"], ["Trades", "trades-jobs"],
  ["Healthcare", "healthcare-jobs"], ["Hospitality", "hospitality-jobs"], ["Remote", "remote-jobs"],
  ["IT", "it-jobs"], ["Driving", "driving-jobs"], ["Education", "education-jobs"],
] as const;

export const SERVICE_TYPES = [
  ["Cleaning", "cleaning"], ["Repairs", "repairs"], ["Gardening", "gardening-services"],
  ["Plumbing", "plumbing-services"], ["Electrical", "electrical-services"],
  ["Photography", "photography"], ["Tutoring", "tutoring"], ["Moving", "moving"],
] as const;

export function pairsFromNames(names: readonly string[]): readonly (readonly [string, string])[] {
  return names.map((name) => [name, name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")] as const);
}
