/** Shared catalog item banks for enterprise taxonomy expansion. */

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
  ["Tables", "tables"], ["Wardrobes", "wardrobes"], ["Drawers", "drawers"], ["Desks", "desks"],
  ["Bookcases", "bookcases"], ["TV Units", "tv-units"],
] as const;

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
