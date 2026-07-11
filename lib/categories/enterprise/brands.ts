/**
 * Enterprise marketplace brand database — SSOT for Sell attributes, filters and taxonomy.
 */

export const VEHICLE_BRANDS = [
  "Audi", "BMW", "Citroen", "Fiat", "Ford", "Honda", "Hyundai", "Jaguar", "Kia",
  "Land Rover", "Lexus", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan",
  "Peugeot", "Porsche", "Renault", "Seat", "Skoda", "Subaru", "Suzuki", "Tesla",
  "Toyota", "Vauxhall", "Volkswagen", "Volvo", "Alfa Romeo", "Bentley", "Chevrolet",
  "Dacia", "Dodge", "Jeep", "Lamborghini", "Maserati", "McLaren", "Rolls-Royce",
] as const;

export const ELECTRONICS_BRANDS = [
  "Apple", "Samsung", "Sony", "LG", "Panasonic", "Philips", "Bosch", "Siemens",
  "Google", "Huawei", "OnePlus", "Xiaomi", "Oppo", "Motorola", "Nokia", "Asus",
  "Acer", "Dell", "HP", "Lenovo", "Microsoft", "MSI", "Razer", "Canon", "Nikon",
  "Fujifilm", "GoPro", "DJI", "Bose", "JBL", "Sennheiser", "Dyson", "KitchenAid",
  "DeLonghi", "Nintendo", "PlayStation", "Xbox", "Garmin", "Fitbit", "Amazon",
  "Ring", "Nest", "TP-Link", "Netgear", "Logitech", "Anker", "Belkin",
] as const;

export const FASHION_BRANDS = [
  "Nike", "Adidas", "Puma", "Reebok", "New Balance", "Under Armour", "Converse", "Vans",
  "Zara", "H&M", "Uniqlo", "Mango", "Primark", "Next", "ASOS", "Topshop", "River Island",
  "Boohoo", "PrettyLittleThing", "Missguided", "Levi's", "Tommy Hilfiger", "Calvin Klein",
  "Ralph Lauren", "Lacoste", "Boss", "Hollister", "Jack Wills", "Superdry", "The North Face",
  "Patagonia", "Columbia", "Barbour", "Burberry", "Gucci", "Prada", "Versace", "Balenciaga",
  "Louis Vuitton", "Chanel", "Dior", "Michael Kors", "Coach", "Ted Baker", "Radley",
  "Mulberry", "Clarks", "Dr Martens", "Timberland", "Ugg", "Skechers", "Crocs",
  "Moncler", "Stone Island", "CP Company", "Armani", "Hugo Boss", "Fendi", "Givenchy",
] as const;

export const HOME_BRANDS = [
  "IKEA", "Habitat", "John Lewis", "Dunelm", "Laura Ashley", "M&S", "The White Company",
  "Cath Kidston", "Joseph Joseph", "Le Creuset", "Smeg", "Russell Hobbs", "Morphy Richards",
  "Tefal", "Dualit", "KitchenAid", "Ninja", "Shark", "Henry", "Vax", "Bissell",
  "Silentnight", "Tempur", "Emma", "Simba", "Dyson", "Miele", "AEG", "Hotpoint",
  "Beko", "Indesit", "Zanussi", "Bosch", "Siemens", "NEFF", "Grohe", "Hansgrohe",
] as const;

export const PILLOW_BRANDS = [
  "Derila", "Elviros", "BCOZZY", "Cabeau", "Mulisoft", "Tempur", "Silentnight", "Emma",
  "Dunelm", "IKEA", "Simba", "Panda", "Eve", "Casper", "Dormeo", "Hypnos", "Sealy",
  "Dreams", "John Lewis", "M&S", "The White Company", "Kally Sleep", "Nanu", "Levitex",
  "Putnams", "Mediflow", "Coop Home Goods", "Beckham Hotel Collection", "Utopia Bedding",
  "viewstar", "Cosy House", "Pharmedoc", "EPABO", "Weekender", "Bluewave", "Snuggle-Pedic",
] as const;

export const TOOL_BRANDS = [
  "Bosch", "DeWalt", "Makita", "Milwaukee", "Ryobi", "Black and Decker", "Festool",
  "Einhell", "Stanley", "Bahco", "Snap-on", "Metabo", "Hilti", "Worx", "Karcher",
] as const;

export const SPORTS_BRANDS = [
  "Nike", "Adidas", "Puma", "Under Armour", "Reebok", "New Balance", "Asics", "Brooks",
  "Saucony", "Wilson", "Head", "Babolat", "Yonex", "Callaway", "TaylorMade", "Ping",
  "Specialized", "Trek", "Cannondale", "Giant", "Shimano", "SRAM", "Garmin", "Wahoo",
] as const;

export const BABY_BRANDS = [
  "Bugaboo", "Silver Cross", "iCandy", "Cybex", "Maxi-Cosi", "Joie", "Chicco", "Graco",
  "Mamas and Papas", "Stokke", "Ergobaby", "Tommee Tippee", "Avent", "Philips Avent",
] as const;

export const POPULAR_BRAND_IDS = [
  "Nike", "Adidas", "Apple", "Samsung", "Sony", "Zara", "H&M", "BMW", "Ford", "Levi's",
] as const;

function dedupeSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

/** Flat deduplicated brand list for marketplace attribute pickers. */
export const MARKETPLACE_BRANDS = dedupeSorted([
  ...VEHICLE_BRANDS,
  ...ELECTRONICS_BRANDS,
  ...FASHION_BRANDS,
  ...HOME_BRANDS,
  ...PILLOW_BRANDS,
  ...TOOL_BRANDS,
  ...SPORTS_BRANDS,
  ...BABY_BRANDS,
]);

export const MARKETPLACE_BRANDS_BY_VERTICAL = {
  vehicles: VEHICLE_BRANDS,
  electronics: ELECTRONICS_BRANDS,
  fashion: FASHION_BRANDS,
  home: HOME_BRANDS,
  tools: TOOL_BRANDS,
  sports: SPORTS_BRANDS,
  baby: BABY_BRANDS,
} as const;
