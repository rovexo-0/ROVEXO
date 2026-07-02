import { slugify } from "@/lib/taxonomy/category-normalizer";

export type TaxonomyCategoryNode = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  children: TaxonomyCategoryNode[];
  aliases: string[];
  keywords: string[];
  brands: string[];
  models: string[];
  priority: number;
  isLeaf: boolean;
  searchWeight: number;
  seoSlug: string;
};

type RawCategoryNode = {
  name: string;
  slug?: string;
  aliases?: string[];
  keywords?: string[];
  brands?: string[];
  models?: string[];
  priority?: number;
  searchWeight?: number;
  children?: RawCategoryNode[];
};

type ModelSource = readonly string[] | ({ default?: readonly string[] } & Record<string, readonly string[]>);

const COMMON_VARIANTS = ["Standard", "Pro", "Max", "Lite", "Plus", "Refurbished"];

const PHONE_SUFFIXES = ["", "Plus", "Pro", "Ultra", "FE", "Lite", "SE", "Max", "Active", "Neo"];
const LAPTOP_SUFFIXES = ["", "Pro", "X", "Air", "Max", "Zen", "Plus", "Ultra", "Slim", "Studio"];
const TV_SUFFIXES = ["", "QLED", "OLED", "Nano", "Series", "Pro", "Ultra", "Max", "Elite", "X"];
const AUDIO_SUFFIXES = ["", "Pro", "Max", "Studio", "Elite", "Active", "Wireless", "Noise Cancelling", "Plus", "HD"];
const CAR_SUFFIXES = ["", "GT", "Sport", "RS", "S Line", "X", "Touring", "Elite", "Hybrid", "Range"];
const MOTORCYCLE_SUFFIXES = ["", "GT", "Sport", "Touring", "Cruiser", "Custom", "Adventure", "R", "S", "SE"];
const BIKE_SUFFIXES = ["", "Pro", "Elite", "SL", "Comp", "Team", "Race", "Carbon", "SE", "X"];
const TOOL_SUFFIXES = ["", "Pro", "Max", "XR", "XT", "HD", "Elite", "Lite", "Plus", "Compact"];
const APPLIANCE_SUFFIXES = ["", "Pro", "Max", "Elite", "Smart", "Eco", "Plus", "Compact", "Deluxe", "Premium"];
const WATCH_SUFFIXES = ["", "Classic", "Sport", "Elite", "Automatic", "Quartz", "Heritage", "Chrono", "Limited", "Edition"];

function buildModelNames(baseNames: readonly string[], suffixes: readonly string[], limit = 10): string[] {
  const result: string[] = [];

  for (const base of baseNames) {
    for (const suffix of suffixes) {
      const name = suffix ? `${base} ${suffix}` : base;
      if (!result.includes(name)) {
        result.push(name);
      }
      if (result.length >= limit) break;
    }
    if (result.length >= limit) break;
  }

  return result;
}

function isModelSourceRecord(source: ModelSource): source is ({ default?: readonly string[] } & Record<string, readonly string[]>) {
  return !Array.isArray(source);
}

function buildUniqueModelSet(source: ModelSource, brand: string): string[] {
  if (Array.isArray(source)) return Array.from(source);
  if (isModelSourceRecord(source)) {
    return Array.from(source[brand] ?? source.default ?? []);
  }
  return [];
}

function createLeaf(node: RawCategoryNode): RawCategoryNode {
  return { ...node, children: [] };
}

function createBranch(name: string, slug: string, children: RawCategoryNode[], extras: Partial<RawCategoryNode> = {}): RawCategoryNode {
  return { name, slug, children, ...extras };
}

function buildVariantLeaves(baseName: string, brand: string, model: string, variants: readonly string[]): RawCategoryNode[] {
  return variants.map((variant) => {
    const name = `${baseName} ${variant}`.trim();
    return createLeaf({
      name,
      slug: slugify(`${brand} ${model} ${variant}`),
      aliases: [name.toLowerCase(), `${brand.toLowerCase()} ${model.toLowerCase()} ${variant.toLowerCase()}`],
      keywords: [brand, model, variant, `${model} ${variant}`],
      brands: [brand],
      models: [model],
    });
  });
}

function buildProductFamily(
  name: string,
  slug: string,
  brands: readonly string[],
  modelSource: ModelSource,
  suffixes: readonly string[],
  variants: readonly string[],
  extras: Partial<RawCategoryNode> = {},
): RawCategoryNode {
  return {
    name,
    slug,
    aliases: extras.aliases ?? [],
    keywords: extras.keywords ?? [],
    children: brands.map((brand) => {
      const modelBases = buildUniqueModelSet(modelSource, brand);
      const modelNames = buildModelNames(modelBases, suffixes, 10);
      return {
        name: brand,
        slug: slugify(brand),
        aliases: [brand.toLowerCase()],
        brands: [brand],
        keywords: [brand],
        children: modelNames.map((model) => {
          const baseName = `${brand} ${model}`;
          return {
            name: baseName,
            slug: slugify(baseName),
            aliases: [baseName.toLowerCase(), model.toLowerCase(), `${brand.toLowerCase()} ${model.toLowerCase()}`],
            brands: [brand],
            models: [model],
            keywords: [brand, model],
            children: buildVariantLeaves(baseName, brand, model, variants),
          };
        }),
      };
    }),
    ...extras,
  };
}

const PHONE_BRANDS = [
  "Samsung",
  "Apple",
  "Google",
  "OnePlus",
  "Xiaomi",
  "Motorola",
  "Sony",
  "Nokia",
  "Huawei",
  "Honor",
];

const PHONE_MODEL_BASES: Record<string, readonly string[]> = {
  Samsung: ["Galaxy S24", "Galaxy Z Fold", "Galaxy Z Flip", "Galaxy A54", "Galaxy A34", "Galaxy M54", "Galaxy Note", "Galaxy XCover", "Galaxy F54", "Galaxy Tab"],
  Apple: ["iPhone 15", "iPhone 14", "iPhone SE", "iPhone 13", "iPhone 12", "iPhone 11", "iPhone XR", "iPhone XS", "iPhone 8", "iPhone 7"],
  Google: ["Pixel 8", "Pixel 7", "Pixel 6", "Pixel 5", "Pixel 4", "Pixel 3", "Pixel Fold", "Pixel Slate", "Pixel 7a", "Pixel 6a"],
  OnePlus: ["OnePlus 12", "OnePlus 11", "OnePlus 10", "OnePlus Nord", "OnePlus Nord 3", "OnePlus 9", "OnePlus 8", "OnePlus 7", "OnePlus 6", "OnePlus 5"],
  Xiaomi: ["Xiaomi 14", "Redmi Note 13", "Poco F6", "Mi 13", "Mi 12", "Redmi 12", "Redmi 11", "Xiaomi 13T", "Xiaomi 12T", "Xiaomi Mix Fold"],
  Motorola: ["Moto G Power", "Moto Edge", "Moto Razr", "Moto G Stylus", "Moto E", "Moto X", "Moto Z", "Moto One", "Moto g32", "Moto g52"],
  Sony: ["Xperia 1", "Xperia 5", "Xperia 10", "Xperia Ace", "Xperia Pro", "Xperia L", "Xperia XZ", "Xperia X", "Xperia 5 III", "Xperia 10 III"],
  Nokia: ["Nokia XR20", "Nokia X30", "Nokia G60", "Nokia C32", "Nokia 8.3", "Nokia 7.2", "Nokia 6.2", "Nokia 5.4", "Nokia 2.4", "Nokia 1.4"],
  Huawei: ["P60", "P60 Pro", "Mate 50", "Mate 50 Pro", "Nova 12", "Nova 11", "Mate X5", "Y90", "P50", "Nova 9"],
  Honor: ["Magic 6", "Honor 90", "Honor X9b", "Honor Play 50", "Honor 80", "Honor 70", "Honor 60", "Honor 50", "Honor 40", "Honor 30"],
};

const LAPTOP_BRANDS = [
  "Apple",
  "Dell",
  "HP",
  "Lenovo",
  "Asus",
  "Acer",
  "MSI",
  "Razer",
  "Samsung",
  "Microsoft",
];

const LAPTOP_MODEL_BASES: Record<string, readonly string[]> = {
  Apple: ["MacBook Air", "MacBook Pro", "MacBook", "MacBook Pro 14", "MacBook Pro 16"],
  Dell: ["XPS 13", "XPS 15", "XPS 17", "Latitude", "Inspiron", "Alienware M16", "G15", "Precision", "Vostro", "G16"],
  HP: ["Spectre x360", "Envy 14", "Pavilion", "Omen", "EliteBook", "ZBook", "Dragonfly", "Pavilion Gaming", "ProBook", "Victus"],
  Lenovo: ["ThinkPad X1", "Yoga Slim", "IdeaPad", "Legion 5", "Legion 7", "ThinkBook", "Yoga 9i", "Slim 7", "ThinkPad T14", "IdeaPad Flex"],
  Asus: ["ROG Zephyrus", "ZenBook 14", "Vivobook", "TUF Gaming", "ProArt", "ROG Strix", "ZenBook Duo", "ExpertBook", "Chromebook Flip", "ZenBook Pro"],
  Acer: ["Swift 5", "Aspire 5", "Nitro 16", "Predator Helios", "Enduro", "Spin 5", "TravelMate", "Chromebook Spin", "ConceptD", "Aspire Vero"],
  MSI: ["Stealth 15", "Prestige 14", "Sword 17", "Katana GF66", "Modern 14", "Creator Z16", "Pulse GL66", "Summit E13", "Cyrix", "Titan GT"],
  Razer: ["Blade 14", "Blade 15", "Blade 16", "Blade Stealth", "Blade Pro", "Book 13"],
  Samsung: ["Galaxy Book3", "Galaxy Book2", "Galaxy Book4", "Galaxy Book Pro", "Galaxy Book Flex", "Galaxy Chromebook", "Galaxy Book Ion"],
  Microsoft: ["Surface Laptop", "Surface Pro", "Surface Book", "Surface Go", "Surface Studio", "Surface Laptop Studio"],
};

const TV_BRANDS = [
  "Samsung",
  "Sony",
  "LG",
  "Panasonic",
  "Philips",
  "TCL",
  "Hisense",
  "Sharp",
  "Panasonic",
  "Vizio",
];

const TV_MODEL_BASES: Record<string, readonly string[]> = {
  Samsung: ["QN90C", "The Frame", "The Serif", "Q80C", "Q70C", "TU7000", "S95C", "Q60C", "Q90C", "QN85C"],
  Sony: ["A95L", "A80L", "X90L", "X95L", "X85L", "A80K", "A90K", "X80L", "Z9K", "A73L"],
  LG: ["OLED C3", "OLED G3", "OLED B3", "QNED99", "QNED90", "UQ90", "UQ85", "NanoCell 90", "OLED A3", "UQ80"],
  Panasonic: ["JZ2000", "JZ1500", "JZ1000", "HX940", "HX900", "HZ2000", "HZ1500", "HZ1000", "HZ980", "HZ960"],
  Philips: ["OLED+ 907", "OLED+ 936", "OLED 807", "PUS8807", "PUS8507", "PUS8207", "PUS7807", "PUS7307", "PUS7507", "PML9707"],
  TCL: ["6-Series", "5-Series", "4-Series", "8-Series", "S5", "S4", "C-series", "P715", "P635", "P615"],
  Hisense: ["U8H", "U7K", "U6G", "A6K", "A7H", "U7H", "U9DG", "A65H", "A6K", "ULED X6H"],
  Sharp: ["Aquos 4K", "Aquos LED", "8K Q+", "ULED 4K", "ULED 8K", "Smart LED", "Quattron", "C Series", "Q Series", "N Series"],
  Vizio: ["P-Series", "M-Series", "V-Series", "Vizio OLED", "OLED+", "D-Series", "Quantum", "SmartCast 4K", "M7", "M6"],
};

const AUDIO_BRANDS = [
  "Bose",
  "Sony",
  "Sennheiser",
  "JBL",
  "Beats",
  "Yamaha",
  "Sonos",
  "Denon",
  "Marshall",
  "Bang & Olufsen",
];

const AUDIO_MODEL_BASES: Record<string, readonly string[]> = {
  Bose: ["QuietComfort 45", "Noise Cancelling Headphones", "SoundLink", "Home Speaker 500", "Smart Soundbar 900", "QuietComfort Earbuds", "Soundbar 700", "Portable Smart Speaker"],
  Sony: ["WH-1000XM5", "WF-1000XM5", "SRS-XB43", "HT-A7000", "HT-A5000", "SLM-A9", "MDR-7506", "WH-CH720N"],
  Sennheiser: ["HD 660 S", "Momentum 4", "IE 900", "HD 599", "PXC 550-II", "Ambeo Soundbar", "HD 560S", "HD 450SE"],
  JBL: ["Charge 5", "Flip 6", "Boombox 2", "Live 660NC", "Tune 760NC", "PartyBox 310", "Bar 1300", "Quantum 800"],
  Beats: ["Studio Pro", "Solo Pro", "Powerbeats Pro", "Fit Pro", "Pill+", "Flex", "Beats Solo 3", "Beats Studio 3"],
  Yamaha: ["YHT-4950U", "SR-B20A", "YAS-209", "NS-333", "RX-V6A", "RX-A2A", "DBR10", "HS8"],
  Sonos: ["Arc", "Beam", "Five", "Roam", "Move", "Era 300", "Sub Mini", "Amp"],
  Denon: ["AVR-S760H", "Home 550", "AH-GC30", "Envaya", "DHT-S516H", "Home Sound Bar 550", "AVR-X2800H", "POA 3000"],
  Marshall: ["Major IV", "Monitor II", "Acton II", "Stockwell II", "Kilburn II", "Woburn II", "Emberton II", "Tufton"],
  "Bang & Olufsen": ["Beoplay H95", "Beosound A5", "Beoplay A9", "Beoplay E8", "Beosound Stage", "Beosound Balance", "Beoplay Portal", "Beoplay A1"],
};

const CAR_BRANDS = [
  "Ford",
  "BMW",
  "Audi",
  "Mercedes-Benz",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Honda",
  "Nissan",
  "Kia",
];

const CAR_MODEL_BASES: Record<string, readonly string[]> = {
  Ford: ["Fiesta", "Focus", "Mustang", "Puma", "Kuga", "Explorer", "Transit", "Ranger", "Edge", "EcoSport"],
  BMW: ["3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "M3", "M5", "i4", "iX"],
  Audi: ["A3", "A4", "A6", "Q3", "Q5", "Q7", "A8", "RS5", "e-tron", "TT"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "GLA", "GLC", "GLE", "S-Class", "SLC", "AMG GT", "EQC"],
  Tesla: ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck", "Roadster", "Semi", "Model 2"],
  Toyota: ["Corolla", "Camry", "RAV4", "Prius", "Hilux", "Yaris", "C-HR", "Land Cruiser", "Supra", "Auris"],
  Volkswagen: ["Golf", "Passat", "Tiguan", "Polo", "Arteon", "Touareg", "ID.3", "ID.4", "Beetle", "Up!"],
  Honda: ["Civic", "Accord", "CR-V", "Jazz", "HR-V", "Pilot", "Fit", "Odyssey", "Insight", "NSX"],
  Nissan: ["Leaf", "Qashqai", "Juke", "X-Trail", "Micra", "Sentra", "Altima", "GT-R", "Pathfinder", "Murano"],
  Kia: ["Sportage", "Sorento", "Picanto", "Ceed", "Rio", "Stinger", "EV6", "Soul", "Niro", "Carnival"],
};

const MOTORCYCLE_BRANDS = [
  "Honda",
  "Yamaha",
  "Kawasaki",
  "Ducati",
  "BMW",
  "Harley-Davidson",
  "Triumph",
  "Suzuki",
  "KTM",
  "Aprilia",
];

const MOTORCYCLE_MODEL_BASES: Record<string, readonly string[]> = {
  Honda: ["CBR1000RR", "Africa Twin", "Gold Wing", "CB650R", "Rebel 1100", "NC750X", "CRF450R", "CB500X", "CBR500R", "CBR650R"],
  Yamaha: ["YZF-R1", "MT-09", "Tenere 700", "Tracer 9", "Bolt", "XSR900", "FJR1300", "WR250R", "MT-07", "V-Star 250"],
  Kawasaki: ["Ninja ZX-10R", "Z900", "Versys 650", "KX450", "Ninja 400", "Vulcan S", "Z650", "KLR650", "Ninja H2", "W800"],
  Ducati: ["Panigale V4", "Monster", "Multistrada V4", "Scrambler", "Streetfighter V4", "Diavel", "SuperSport", "Hypermotard", "XDiavel", "Panigale 959"],
  BMW: ["S 1000 RR", "R 1250 GS", "F 900 R", "R 18", "F 850 GS", "S 1000 XR", "K 1600 GT", "G 310 R", "K 1200 S", "C 400 X"],
  "Harley-Davidson": ["Street Glide", "Fat Boy", "Iron 883", "Sportster S", "Road King", "Softail Deluxe", "Low Rider", "LiveWire", "Breakout", "Heritage Classic"],
  Triumph: ["Street Triple", "Bonneville T120", "Tiger 900", "Speed Triple", "Scrambler 900", "Rocket 3", "Daytona 675", "Thruxton RS", "Speed Twin", "Street Scrambler"],
  Suzuki: ["GSX-R1000", "Hayabusa", "SV650", "V-Strom 650", "GSX-S1000", "DR-Z400S", "Burgman 400", "GSX250R", "GSX-R750", "Katana"],
  KTM: ["1290 Super Duke", "390 Duke", "890 Adventure", "RC 390", "690 Enduro", "250 SX-F", "790 Duke", "1290 Super Adventure", "890 Adventure R", "250 EXC-F"],
  Aprilia: ["RS 660", "Tuono 660", "RSV4", "Tuono V4", "Shiver 900", "Caponord 1200", "SR GT", "RS 457", "Tuono 660 Factory", "RSV4 RR"],
};

const FASHION_BRANDS = [
  "Nike",
  "Adidas",
  "Gucci",
  "Prada",
  "Louis Vuitton",
  "Zara",
  "H&M",
  "Levi's",
  "Uniqlo",
  "Burberry",
];

const FASHION_MODEL_BASES: Record<string, readonly string[]> = {
  Nike: ["Air Max", "Jordan", "Dunk", "Blazer", "Cortez", "React", "Pegasus", "Zoom", "SB", "Cruzr"],
  Adidas: ["Ultraboost", "Stan Smith", "Superstar", "NMD", "Gazelle", "Forum", "Yeezy", "Adilette", "Campus", "Ozweego"],
  Gucci: ["Ace", "Princetown", "Rhyton", "Jordan", "Blondie", "Gucci 100", "Ultrapace", "Screener", "Pace", "Rhyton"],
  Prada: ["Cloudbust", "Linea Rossa", "America's Cup", "Pradax", "Pride", "Runner", "Cloudburst", "Candy", "America Cup", "Spectre"],
  "Louis Vuitton": ["Archlight", "Run Away", "Frontrow", "LV Trainer", "Horizon", "Dream", "Eclipse", "Astro", "Run Away", "Boite Choc"],
  Zara: ["Basic Hoodie", "Tribute Sneaker", "Leather Boots", "Denim Jacket", "Tailored Suit", "Flared Jeans", "Biker Jacket", "Pleated Skirt", "Blazer", "Midi Dress"],
  "H&M": ["Conscious Dress", "Business Shirt", "Puffer Jacket", "Skinny Jeans", "Soundtrack Sneaker", "Linen Shirt", "Wool Coat", "Jersey Skirt", "Chinos", "Bomber Jacket"],
  "Levi's": ["501 Original", "511 Slim", "720 High Rise", "Wedgie", "721 High Waist", "501 Skinny", "505 Regular", "550 Relaxed", "721 High Rise", "310 Shaping"],
  Uniqlo: ["Ultra Light Down", "AIRism Tee", "Heattech Leggings", "Blocktech Coat", "Flannel Shirt", "Sweatpants", "Lounge Pants", "U Jersey", "Dry-Ex Shorts", "Ultra Stretch"],
  Burberry: ["Trench Coat", "Brit Bag", "Scarf", "Hoodie", "Kensington", "TB Jacket", "Vintage Check", "Leather Bomber", "Chelsea Boot", "Sloan Bag"],
};

const FURNITURE_BRANDS = [
  "Ikea",
  "Habitat",
  "Wayfair",
  "West Elm",
  "John Lewis",
  "Next",
  "Made",
  "Argos",
  "Oak Furniture",
  "Sofa.com",
];

const FURNITURE_MODEL_BASES: Record<string, readonly string[]> = {
  Ikea: ["Ektorp Sofa", "Poang Chair", "Malm Bed", "Kallax Shelf", "Billy Bookcase", "Hemnes Wardrobe", "Norråker Stool", "Brimnes Bed", "Lack Table", "Klippan Sofa"],
  Habitat: ["Marlow Sofa", "Kellan Bed", "Vera Chair", "Rory Table", "Elsie Sideboard", "Otis Desk", "Nina Bookcase", "Brooke Bed", "Milo Bench", "Sofia Armchair"],
  Wayfair: ["Alcott Hill Sofa", "Mercury Row Table", "Andover Mills Desk", "Ebern Designs Bed", "Wade Logan Chair", "Three Posts Cabinet", "Zipcode Design Shelf", "17 Stories Stool", "Birch Lane Sofa", "George Oliver Bed"],
  "West Elm": ["Haven Sofa", "Andes Chair", "Mid-century Bed", "Box Frame Table", "Industrial Shelf", "York Desk", "Peachtree Coffee Table", "Henry Bookcase", "Finley Bed", "Monroe Couch"],
  "John Lewis": ["Luca Sofa", "Oslo Bed", "Alston Chair", "Camden Table", "Marlow Wardrobe", "Edge Cabinet", "Boda Bookcase", "Porter Stool", "Catton Desk", "Harrison Bench"],
  Next: ["Drew Sofa", "Nyla Bed", "Harrison Chair", "Harper Table", "Logan Wardrobe", "Madison Shelf", "Avery Bench", "Ella Sideboard", "Toby Desk", "Lola Wardrobe"],
  Made: ["Bourne Sofa", "Riviera Bed", "Harlow Chair", "Essence Table", "Neo Shelf", "Luca Wardrobe", "Hughes Desk", "Kassidy Bench", "Peggy Armchair", "Rosie Bed"],
  Argos: ["Sherborne Sofa", "Ottoman Bed", "Montana Wardrobe", "Erin Chair", "Ashby Table", "Hemple Desk", "Rylan Bed", "Oswald Shelf", "Dorset Wardrobe", "Carrie Sofa"],
  "Oak Furniture": ["Kendal Table", "Oakley Bed", "Lancaster Wardrobe", "Chatsworth Chair", "Hampton Shelf", "Windsor Bench", "Somerset Desk", "Cotswold Wardrobe", "Sycamore Table", "Richmond Bed"],
  "Sofa.com": ["Helsinki Sofa", "Cambridge Armchair", "Gusset Sofa", "Janet Bed", "Ida Ottoman", "Huxley Table", "Milan Sofa", "Florence Chair", "Aston Bench", "Marlow Stool"],
};

const KITCHEN_BRANDS = [
  "Breville",
  "KitchenAid",
  "Bosch",
  "Samsung",
  "LG",
  "Ninja",
  "Philips",
  "Krups",
  "Panasonic",
  "Tefal",
];

const KITCHEN_MODEL_BASES: Record<string, readonly string[]> = {
  Breville: ["Barista Express", "Smart Oven", "The Oracle", "Juicer Plus", "MixMaster", "Blend Active", "Flexi Microwave", "Air Fryer", "Tea Maker", "Coffee Bar"],
  KitchenAid: ["Artisan Mixer", "Pro Line", "Food Processor", "Hand Blender", "Toaster", "Stand Mixer", "Coffee Grinder", "Kettle", "Blender", "Ice Cream Maker"],
  Bosch: ["Serie 8 Oven", "Serie 6 Hob", "Dishwasher", "Washing Machine", "Kettle", "Coffee Machine", "Food Processor", "Microwave", "Backwave", "Venting Hood"],
  Samsung: ["Family Hub", "Smart Oven", "AirDresser", "Powerbot", "Jet Stick", "Galaxy Tab", "Bespoke Refrigerator", "Chef Collection", "Microwave", "Dishwasher"],
  LG: ["InstaView", "Fusion Kit", "SmartThinQ", "AirFryer", "CordZero", "Tone Free", "UltraGear", "MegaChef", "Fridge", "Washer Dryer"],
  Ninja: ["Foodi", "Chef", "Blender", "Toaster", "Air Fryer", "Coffee Bar", "Coffee Grinder", "Creami", "Food Processor", "Soup Maker"],
  Philips: ["Airfryer XXL", "Avance Blender", "Sonicare", "SleepCare", "Steam Iron", "Food Processor", "Coffee Maker", "Toaster", "Kettle", "Smart Oven"],
  Krups: ["Espresseria", "Nespresso Machine", "Coffee Grinder", "Food Processor", "Toaster", "Kettle", "Duo Pro", "Vivo Blender", "Steam Iron", "Coffee Maker"],
  Panasonic: ["NN-SN966S", "All-In-One", "Inverter Microwave", "Bread Maker", "Toaster", "Coffee Maker", "Blender", "Rice Cooker", "Steam Oven", "Juicer"],
  Tefal: ["ActiFry", "Easy Fry", "Ingenio", "Cook4Me", "Perfect Fry", "Air Force", "Comfort Kettle", "Mix & Cook", "Steam Generator", "Toast"],
};

const TOOL_BRANDS = [
  "DeWalt",
  "Makita",
  "Bosch",
  "Milwaukee",
  "Ryobi",
  "Hitachi",
  "Black & Decker",
  "Festool",
  "Metabo",
];

const TOOL_MODEL_BASES: Record<string, readonly string[]> = {
  DeWalt: ["XR Drill", "Impact Driver", "Circular Saw", "Reciprocating Saw", "Angle Grinder", "Jigsaw", "Sander", "Router", "Planer", "Brad Nailer"],
  Makita: ["XGT Drill", "LXT Saw", "Impact Driver", "Circular Saw", "Heat Gun", "Angle Grinder", "Planer", "Router", "Job Site Light", "Vacuum"],
  Bosch: ["Professional Drill", "Jigsaw", "Angle Grinder", "Reciprocating Saw", "SDS Plus Hammer", "Circular Saw", "Orbital Sander", "Multicutter", "Spray Gun", "Router"],
  Milwaukee: ["M18 Drill", "Impact Wrench", "Sawzall", "Grinder", "M18 Blower", "Nailer", "Planer", "Router", "Circular Saw", "Vacuum"],
  Ryobi: ["One+ Drill", "Impact Driver", "Circular Saw", "Orbital Sander", "Jigsaw", "Heat Gun", "Blower", "Chainsaw", "Planer", "Router"],
  Hitachi: ["Cordless Drill", "Impact Driver", "Circular Saw", "Jigsaw", "Grinder", "Reciprocating Saw", "Rotary Hammer", "Screwdriver", "Compressor", "Nailer"],
  "Black & Decker": ["Drill", "Sander", "Jigsaw", "Circular Saw", "Blower", "Leaf Blower", "Multi Tool", "Oscillating Tool", "Heat Gun", "Router"],
  Festool: ["Track Saw", "Rotex Sander", "Domino Joiner", "Planer", "Router", "Jigsaw", "Dust Extractor", "Circular Saw", "Drill", "Screwdriver"],
  Metabo: ["Impact Drill", "Angle Grinder", "Circular Saw", "Rotary Hammer", "Festool Compatible", "Jigsaw", "Planer", "Sander", "Screwdriver", "Nailer"],
};

const CAR_PART_BRANDS = [
  "Bosch",
  "Mahle",
  "Valeo",
  "NGK",
  "Denso",
  "ZF",
  "Brembo",
  "Curtis",
  "Gates",
];

const CAR_PART_MODEL_BASES: Record<string, readonly string[]> = {
  Bosch: ["Spark Plug", "Fuel Pump", "Brake Pad", "Alternator", "Starter Motor", "Air Filter", "Spark Coil", "Oxygen Sensor", "Wiper Motor", "Ignition Module"],
  Mahle: ["Piston Kit", "Cylinder Head", "Oil Filter", "Water Pump", "Thermostat", "Timing Belt", "Valve", "Radiator", "Gasket Set", "Turbocharger"],
  Valeo: ["Clutch Kit", "Wiper Blade", "Alternator", "Starter", "Cooling Fan", "Washer Pump", "Radiator", "Heater Motor", "Timing Belt Tensioner", "AC Compressor"],
  NGK: ["Spark Plug", "Glow Plug", "Ignition Coil", "O2 Sensor", "ABS Sensor", "Fuel Injector", "Knock Sensor", "Crankshaft Sensor", "Camshaft Sensor", "Coil Pack"],
  Denso: ["Injectors", "Oxygen Sensor", "Spark Plug", "Air Flow Sensor", "Radiator", "Fuel Pump", "Air Filter", "Starter Motor", "Alternator", "A/C Compressor"],
  ZF: ["Steering Rack", "Shock Absorber", "Clutch", "Transmission", "Differential", "CV Joint", "Control Arm", "Stabilizer Link", "Wheel Bearing", "Prop Shaft"],
  Brembo: ["Brake Disc", "Brake Caliper", "Brake Pad", "Brake Fluid", "Brake Kit", "Brake Line", "Brake Shoe", "Brake Drum", "Brake Rotor", "Performance Pad"],
  Curtis: ["Car Charger", "Battery Cable", "Fuse", "Relay", "Ignition Switch", "Interior Light", "Wiring Loom", "Control Module", "Headlight", "Taillight"],
  Gates: ["Timing Belt", "Serpentine Belt", "Radiator Hose", "Drive Belt", "Water Pump", "AC Belt", "Timing Chain", "Head Gasket", "Power Steering Hose", "Fan Belt"],
};

const BIKE_BRANDS = [
  "Trek",
  "Specialized",
  "Giant",
  "Cannondale",
  "Scott",
  "Canyon",
  "Santa Cruz",
  "Cube",
  "Bianchi",
  "Merida",
];

const BIKE_MODEL_BASES: Record<string, readonly string[]> = {
  Trek: ["Domane", "Emonda", "Marlin", "Fuel EX", "Slash", "Roscoe", "Checkpoint", "FX", "Verve", "Rail"],
  Specialized: ["Tarmac", "Roubaix", "Allez", "Stumpjumper", "Diverge", "Sirrus", "Fuse", "Rockhopper", "Turbo Levo", "Vado"],
  Giant: ["Defy", "TCR", "Propel", "Trance", "Anthem", "Fathom", "Reign", "Escape", "FastRoad", "Stance"],
  Cannondale: ["Synapse", "SuperSix", "Topstone", "Scalpel", "Mavaro", "Trail", "Quick", "Bad Boy", "Tesoro", "Habit"],
  Scott: ["Addict", "Foil", "Spark", "Genius", "Aspect", "Sub Cross", "Speedster", "Scale", "Solace", "Patrol"],
  Canyon: ["Ultimate", "Aeroad", "Endurace", "Lux", "Spectral", "Neuron", "Strive", "Grizl", "Inflite", "Grand Canyon"],
  "Santa Cruz": ["Bronson", "Hightower", "5010", "Blur", "Tallboy", "Nomad", "Chameleon", "Jackal", "Stigmata", "Heckler"],
  Cube: ["Agree", "Nuroad", "Stereo", "Reaction", "Aim", "Access", "Nature", "Elbaz", "Kathmandu", "Analog"],
  Bianchi: ["Infinito", "Oltre", "Impulso", "ARIA", "E-Impulso", "Methanol", "Nirone", "Via Nirone", "Maglia", "Aquila"],
  Merida: ["Scultura", "Reacto", "One Twenty", "One Forty", "Big Nine", "Speeder", "eOne-Sixty", "eOne-Forty", "Silex", "Crossway"],
};

const MEDICAL_BRANDS = [
  "Philips",
  "GE Healthcare",
  "Siemens Healthineers",
  "Medtronic",
  "Abbott",
  "Honeywell",
  "Drager",
  "Baxter",
  "3M",
  "BD",
];

const MEDICAL_MODEL_BASES: Record<string, readonly string[]> = {
  Philips: ["EPIQ 7", "Affiniti 70", "Ingenia", "IntelliVue", "Respironics DreamStation", "VitalSigns", "ClearVue", "Lumify", "Miniaturized Ultrasound", "IntelliSpace"],
  "GE Healthcare": ["Vivid E95", "Logiq E10", "Discovery MI", "Revolution EVO", "Carescape", "Innova", "Inspire", "Optima", "Signa", "Venue"],
  "Siemens Healthineers": ["Magnetom Altea", "Acuson Sequoia", "Multix Fusion", "Symbia", "Artis Q", "Atellica", "SOMATOM Force", "Luminos Fusion", "Arona", "Y.SI"],
  Medtronic: ["StealthStation", "SynchroMed", "Intellis", "MiniMed", "Microdebrider", "Ablation System", "O-arm", "Percept", "Hugo", "Luna"],
  Abbott: ["Alinity", "i-STAT", "FreeStyle Libre", "Neuromodulation", "CardioMEMS", "OptiVol", "AcuNav", "Hematology Analyzer", "Alinity s", "ARCHITECT"],
  Honeywell: ["Respironics V60", "Life Care", "Apollo", "Aerospace Medical", "SureTemp", "PuriCare", "Hush", "Alert", "OnGuard", "SleepBand"],
  Drager: ["Evita V600", "Fabius Plus", "Apollo", "Infinity M540", "Vario", "Primus", "X-plore", "Babylog", "Ventilator", "Anesthesia Workstation"],
  Baxter: ["Amia", "Sigma Spectrum", "Spectrum IQ", "Colleague", "Prismaflex", "Nexsafe", "System One", "SIGMA XL", "Libertas", "Alaris"],
  "3M": ["Littmann", "Micropore", "Clarity", "TECA", "Avagard", "V.A.C.", "Dual Action", "Barrier", "Steri-Strip", "Nexcare"],
  BD: ["Alaris", "Pyxis", "Praxair", "Venturi", "Nexus", "Ignite", "Glyph", "Oncology", "Schedule", "Luer-Lok"],
};

const CONSTRUCTION_BRANDS = [
  "Caterpillar",
  "JCB",
  "Komatsu",
  "Volvo",
  "Hitachi",
  "John Deere",
  "Doosan",
  "Kubota",
  "CASE",
  "Terex",
];

const CONSTRUCTION_MODEL_BASES: Record<string, readonly string[]> = {
  Caterpillar: ["D8T", "330 Excavator", "420F Backhoe", "988K Loader", "303 Mini Excavator", "259D Skid Steer", "725C Articulated Truck", "289D Compact Track Loader", "938M Wheel Loader", "CB54"],
  JCB: ["3CX", "4CX", "JS220", "TM320", "8025ZTS", "55Z-1", "331", "26C-1", "540-180", "CON850"],
  Komatsu: ["PC210-10", "WA470-8", "D85EX-18", "HD785-7", "SK510-5", "PW148-11", "HB215LC-2", "GD655-6", "FD40-16", "PC78US-11"],
  Volvo: ["EC300E", "L120H", "A40G", "ECR88D", "S90D", "L110H", "MCT130", "A25G", "EWR150E", "MC125C"],
  Hitachi: ["ZX350LC-6", "ZX130-6", "ZW310-6", "EH5000AC-3", "ZX210-6", "ZX690LCH-6", "ZAXIS 170W-6", "ZW220-6", "EH4000AC-3", "ZX175W-6"],
  "John Deere": ["350G", "850K", "310G", "4044M", "Z515E", "333G", "544P", "310SL", "700L", "450K"],
  Doosan: ["DX225LC-5", "DL300-5", "DX140LCR-5", "DA30", "DL420-5", "DX85R-3", "DL200-7", "DA40", "DX140W-5", "DL250-5"],
  Kubota: ["KX040-4", "SVL75-2", "U35-4", "BX2380", "L4708", "RTV-X1140", "M7060", "SVL75-2", "SVL97-2", "U55-4"],
  CASE: ["CX210D", "580N", "850M", "TR310", "SV185", "TV450", "DL550", "CX75C", "570N", "SV340B"],
  Terex: ["TR60", "HR170", "PT-60", "TL120", "RTX130", "TA300", "TC-125", "RH120", "TS14", "MB-170"],
};

const LUXURY_BRANDS = [
  "Rolex",
  "Chanel",
  "Hermès",
  "Louis Vuitton",
  "Cartier",
  "Gucci",
  "Prada",
  "Dior",
  "Tiffany & Co.",
  "Burberry",
];

const LUXURY_MODEL_BASES: Record<string, readonly string[]> = {
  Rolex: ["Submariner", "Daytona", "Datejust", "GMT-Master II", "Explorer", "Yacht-Master", "Sea-Dweller", "Air-King", "Oyster Perpetual", "Pearlmaster"],
  Chanel: ["Classic Flap", "Boy Bag", "Gabrielle", "Wallet on Chain", "19 Bag", "Mademoiselle", "Deauville", "Paris-Biarritz", "Coco Handle", "Gabrielle Hobo"],
  "Hermès": ["Birkin", "Kelly", "Constance", "Evelyne", "Garden Party", "Lindy", "Picotin", "Aline", "Jypsiere", "Bolide"],
  "Louis Vuitton": ["Neverfull", "Alma", "Speedy", "Pochette", "Capucines", "Twist", "OnTheGo", "Palm Springs", "Petite Malle", "Onthego"],
  Cartier: ["Love Bracelet", "Panthère", "Ballon Bleu", "Santos", "Tank", "Juste un Clou", "Clash", "Baignoire", "Ronde", "Pasha"],
  Gucci: ["Marmont", "Dionysus", "Horsebit", "Ophidia", "Sylvie", "GG Supreme", "Blind For Love", "Princetown", "Dionysus", "Jackie 1961"],
  Prada: ["Re-Edition", "Galleria", "Cahier", "Pionnière", "Cinema", "Saffiano", "Double Bag", "Diagramme", "Panier", "Clema"],
  Dior: ["Lady Dior", "Book Tote", "Saddle", "Lady D-Lite", "Dior Caro", "Dior Bobby", "Mini D-Lite", "30 Montaigne", "Diorama", "Rider"],
  "Tiffany & Co.": ["Tiffany T", "Atlas", "Return to Tiffany", "Key", "HardWear", "Paper Flowers", "Lock", "Soleste", "Elsa Peretti", "Bean"],
  Burberry: ["The TB Bag", "The Banner", "The Lola", "The Pocket", "The Buckle", "The Olympia", "The Media", "The Leather", "The Title", "The Bridle"],
};

const HEALTH_BRANDS = [
  "Fitbit",
  "Garmin",
  "Withings",
  "Omron",
  "Beurer",
  "Philips",
  "Braun",
  "Panasonic",
  "JBL",
  "Xiaomi",
];

const CATEGORY_DEFINITIONS: RawCategoryNode[] = [
  {
    name: "Vehicles",
    slug: "vehicles",
    aliases: ["cars", "motor vehicles", "automotive"],
    keywords: ["car", "van", "truck", "motorbike", "boat", "camper"],
    priority: 100,
    searchWeight: 100,
    children: [
      {
        name: "Cars",
        slug: "cars",
        aliases: ["automobiles", "sedans", "hatchbacks"],
        keywords: ["car", "vehicle", "sedan", "estate", "coupe", "convertible"],
        children: [
          buildProductFamily("Car Models", "car-models", CAR_BRANDS, CAR_MODEL_BASES, CAR_SUFFIXES, COMMON_VARIANTS, {
            aliases: ["car brands", "car models", "automotive models"],
            keywords: ["sedan", "hatchback", "SUV", "estate", "coupe", "electric"],
          }),
          {
            name: "Electric Cars",
            slug: "electric-cars",
            aliases: ["ev", "electric vehicles", "electric autos"],
            keywords: ["electric", "EV", "battery", "zero emissions"],
            children: [
              createLeaf({ name: "Tesla Models", slug: "tesla-models", aliases: ["tesla cars"], keywords: ["tesla", "model s", "model 3", "model x", "model y"], brands: ["Tesla"], models: ["Model S", "Model 3", "Model X", "Model Y"] }),
              createLeaf({ name: "Hybrid Cars", slug: "hybrid-cars", aliases: ["hybrids"], keywords: ["hybrid", "plug-in", "PHEV", "self charging"], brands: ["Toyota", "Honda"], models: ["Prius", "Insight"] }),
            ],
          },
          {
            name: "Performance Cars",
            slug: "performance-cars",
            aliases: ["sports cars", "supercars"],
            keywords: ["sports", "performance", "GT", "supercar"],
            children: [
              createLeaf({ name: "Sports Coupes", slug: "sports-coupes", aliases: ["sports coupes"], keywords: ["coupe", "sports car", "performance"], brands: ["Porsche", "BMW", "Audi"] }),
              createLeaf({ name: "Luxury GT Cars", slug: "luxury-gt-cars", aliases: ["grand tourers"], keywords: ["GT", "grand tourer", "luxury"], brands: ["Aston Martin", "Bentley"] }),
            ],
          },
        ],
      },
      {
        name: "Motorcycles",
        slug: "motorcycles",
        aliases: ["bikes", "motorbikes", "two-wheelers"],
        keywords: ["motorcycle", "bike", "scooter", "cruiser", "sports"],
        children: [
          buildProductFamily("Motorcycle Models", "motorcycle-models", MOTORCYCLE_BRANDS, MOTORCYCLE_MODEL_BASES, MOTORCYCLE_SUFFIXES, COMMON_VARIANTS, {
            aliases: ["motorbike models", "bike models"],
            keywords: ["motorbike", "sport bike", "cruiser", "dirt bike", "tourer"],
          }),
          createLeaf({ name: "Scooters", slug: "scooters", aliases: ["motor scooters"], keywords: ["scooter", "125cc", "electric scooter"], brands: ["Vespa", "Piaggio"], models: ["Primavera", "MP3"] }),
          createLeaf({ name: "Motorcycle Gear", slug: "motorcycle-gear", aliases: ["bike gear", "riding gear"], keywords: ["helmet", "jacket", "boots", "gloves"], brands: ["Alpinestars", "Dainese"], models: [] }),
        ],
      },
      {
        name: "Vans & Trucks",
        slug: "vans-trucks",
        aliases: ["commercial vehicles", "light trucks"],
        keywords: ["van", "truck", "pickup", "lorry"],
        children: [
          createLeaf({ name: "Panel Vans", slug: "panel-vans", aliases: ["cargo vans"], keywords: ["panel van", "cargo"], brands: ["Ford", "Mercedes-Benz"], models: ["Transit", "Sprinter"] }),
          createLeaf({ name: "Pickups", slug: "pickups", aliases: ["pick-up trucks"], keywords: ["pickup", "truck", "4x4"], brands: ["Ford", "Toyota"], models: ["Ranger", "Hilux"] }),
          createLeaf({ name: "Commercial Trucks", slug: "commercial-trucks", aliases: ["heavy trucks"], keywords: ["truck", "haulage", "transport"], brands: ["Volvo", "Caterpillar"], models: ["FH16", "D8T"] }),
        ],
      },
      {
        name: "Caravans & Motorhomes",
        slug: "caravans-motorhomes",
        aliases: ["campers", "motorhomes", "camper vans"],
        keywords: ["caravan", "motorhome", "camper", "RV"],
        children: [
          createLeaf({ name: "Caravans", slug: "caravans", aliases: ["travel trailers"], keywords: ["touring caravan", "static caravan"], brands: ["Bailey", "Coachman"], models: ["Unicorn", "VIP"] }),
          createLeaf({ name: "Motorhomes", slug: "motorhomes", aliases: ["RV"], keywords: ["motorhome", "campervan"], brands: ["Swift", "Adria"], models: ["Escape", "Twin Supreme"] }),
          createLeaf({ name: "Camper Vans", slug: "camper-vans", aliases: ["campervan"], keywords: ["camper van", "van conversion"], brands: ["VW", "Mercedes-Benz"], models: ["California", "Marco Polo"] }),
        ],
      },
      {
        name: "Boats",
        slug: "boats",
        aliases: ["marine", "watercraft"],
        keywords: ["boat", "yacht", "dinghy", "sailing"],
        children: [
          createLeaf({ name: "Sailing Boats", slug: "sailing-boats", aliases: ["yachts"], keywords: ["sailing", "yacht", "sailboat"], brands: ["Beneteau", "Jeanneau"], models: ["Oceanis", "Sun Odyssey"] }),
          createLeaf({ name: "Motor Boats", slug: "motor-boats", aliases: ["powerboats"], keywords: ["motorboat", "speedboat"], brands: ["Bayliner", "Chaparral"], models: ["Element", "Sunesta"] }),
          createLeaf({ name: "Kayaks", slug: "kayaks", aliases: ["canoes"], keywords: ["kayak", "canoe", "paddle"], brands: ["Ocean Kayak", "Perception"], models: ["Tempress", "Expression"] }),
          createLeaf({ name: "Jet Skis", slug: "jet-skis", aliases: ["personal watercraft"], keywords: ["jet ski", "PWC"], brands: ["Yamaha", "Kawasaki"], models: ["WaveRunner", "Jet Ski"] }),
        ],
      },
    ],
  },
  {
    name: "Property",
    slug: "property",
    aliases: ["real estate", "housing", "homes"],
    keywords: ["house", "flat", "apartment", "commercial", "land"],
    priority: 95,
    searchWeight: 88,
    children: [
      createBranch("For Sale", "for-sale", [
        createLeaf({ name: "Houses for Sale", slug: "houses-for-sale", aliases: ["homes for sale"], keywords: ["house sale", "for sale"], brands: [], models: [] }),
        createLeaf({ name: "Flats for Sale", slug: "flats-for-sale", aliases: ["apartments for sale"], keywords: ["flat sale", "apartment sale"], brands: [], models: [] }),
        createLeaf({ name: "Land for Sale", slug: "land-for-sale", aliases: ["plots for sale"], keywords: ["land", "plot"], brands: [], models: [] }),
      ], { aliases: ["sale properties"] }),
      createBranch("To Rent", "to-rent", [
        createLeaf({ name: "Flats to Rent", slug: "flats-to-rent", aliases: ["apartments to rent"], keywords: ["rent flat", "rent apartment"], brands: [], models: [] }),
        createLeaf({ name: "Houses to Rent", slug: "houses-to-rent", aliases: ["homes to rent"], keywords: ["rent house", "rental home"], brands: [], models: [] }),
        createLeaf({ name: "Rooms to Rent", slug: "rooms-to-rent", aliases: ["room rental"], keywords: ["room", "room rent"], brands: [], models: [] }),
      ], { aliases: ["rental properties"] }),
      createBranch("Commercial", "commercial-property", [
        createLeaf({ name: "Offices", slug: "offices", aliases: ["office space"], keywords: ["office", "workspace", "commercial"], brands: [], models: [] }),
        createLeaf({ name: "Retail", slug: "retail-space", aliases: ["shop space"], keywords: ["retail", "shop", "store"], brands: [], models: [] }),
        createLeaf({ name: "Industrial", slug: "industrial-space", aliases: ["warehouse space"], keywords: ["industrial", "warehouse", "factory"], brands: [], models: [] }),
      ], { aliases: ["commercial real estate"] }),
      createBranch("Overseas", "overseas", [
        createLeaf({ name: "Europe", slug: "europe", aliases: ["european property"], keywords: ["europe", "international"], brands: [], models: [] }),
        createLeaf({ name: "Asia", slug: "asia", aliases: ["asian property"], keywords: ["asia", "international"], brands: [], models: [] }),
        createLeaf({ name: "Americas", slug: "americas", aliases: ["american property"], keywords: ["america", "international"], brands: [], models: [] }),
      ]),
    ],
  },
  {
    name: "Phones",
    slug: "phones",
    aliases: ["mobile phones", "cell phones", "smartphones"],
    keywords: ["phone", "mobile", "smartphone", "android", "iphone", "5g"],
    priority: 90,
    searchWeight: 94,
    children: [
      createBranch("Smartphones", "smartphones", [
        buildProductFamily("Android Phones", "android-phones", PHONE_BRANDS, PHONE_MODEL_BASES, PHONE_SUFFIXES, COMMON_VARIANTS, {
          aliases: ["android smartphones", "android phones"],
          keywords: ["android", "cell phone", "mobile"],
        }),
        buildProductFamily("Apple iPhones", "apple-iphones", ["Apple"], { Apple: PHONE_MODEL_BASES.Apple }, PHONE_SUFFIXES, COMMON_VARIANTS, {
          aliases: ["iPhone", "apple phones", "ios phones"],
          keywords: ["iphone", "apple", "ios"],
        }),
        createLeaf({ name: "Unlocked Phones", slug: "unlocked-phones", aliases: ["sim-free phones"], keywords: ["unlocked", "sim free", "factory unlocked"], brands: PHONE_BRANDS, models: [] }),
        createLeaf({ name: "Dual SIM Phones", slug: "dual-sim-phones", aliases: ["dual sim"], keywords: ["dual sim", "two sims"], brands: PHONE_BRANDS, models: [] }),
        createLeaf({ name: "5G Phones", slug: "5g-phones", aliases: ["5g smartphones"], keywords: ["5g", "gigabit"], brands: PHONE_BRANDS, models: [] }),
      ]),
      createBranch("Tablets", "tablets", [
        createLeaf({ name: "Android Tablets", slug: "android-tablets", aliases: ["android tablet"], keywords: ["tablet", "android"], brands: ["Samsung", "Lenovo"], models: ["Galaxy Tab", "Tab P11"] }),
        createLeaf({ name: "iPads", slug: "ipads", aliases: ["apple tablets"], keywords: ["ipad", "apple tablet"], brands: ["Apple"], models: ["iPad", "iPad Pro"] }),
        createLeaf({ name: "Kids Tablets", slug: "kids-tablets", aliases: ["childrens tablets"], keywords: ["kids tablet", "child tablet"], brands: ["Amazon", "Kurio"], models: ["Fire Kids", "Kurio Tab"] }),
      ]),
      createBranch("Wearables", "wearables", [
        createLeaf({ name: "Smartwatches", slug: "smartwatches", aliases: ["smart watch"], keywords: ["smartwatch", "wearable"], brands: ["Apple", "Samsung", "Fitbit"], models: ["Watch Series", "Galaxy Watch"] }),
        createLeaf({ name: "Fitness Trackers", slug: "fitness-trackers", aliases: ["activity trackers"], keywords: ["fitness tracker", "health tracker"], brands: ["Fitbit", "Garmin"], models: ["Charge", "Vivosmart"] }),
        createLeaf({ name: "VR Headsets", slug: "vr-headsets", aliases: ["virtual reality"], keywords: ["vr", "virtual reality"], brands: ["Meta", "Sony"], models: ["Quest", "PlayStation VR"] }),
      ]),
      createBranch("Phone Parts", "phone-parts", [
        createLeaf({ name: "Screens", slug: "phone-screens", aliases: ["display panels"], keywords: ["screen", "display", "replacement screen"], brands: PHONE_BRANDS, models: [] }),
        createLeaf({ name: "Batteries", slug: "phone-batteries", aliases: ["replacement batteries"], keywords: ["battery", "power"], brands: PHONE_BRANDS, models: [] }),
        createLeaf({ name: "Chargers", slug: "phone-chargers", aliases: ["power adapters"], keywords: ["charger", "adapter"], brands: PHONE_BRANDS, models: [] }),
        createLeaf({ name: "Cases", slug: "phone-cases", aliases: ["phone covers"], keywords: ["case", "cover"], brands: PHONE_BRANDS, models: [] }),
      ]),
    ],
  },
  {
    name: "Computers",
    slug: "computers",
    aliases: ["pcs", "laptops", "desktops"],
    keywords: ["computer", "laptop", "desktop", "notebook", "workstation"],
    priority: 88,
    searchWeight: 92,
    children: [
      createBranch("Laptops", "laptops", [
        buildProductFamily("Laptop Models", "laptop-models", LAPTOP_BRANDS, LAPTOP_MODEL_BASES, LAPTOP_SUFFIXES, COMMON_VARIANTS, {
          aliases: ["notebooks", "portable computers"],
          keywords: ["notebook", "laptop", "ultrabook", "gaming laptop"],
        }),
        createLeaf({ name: "Chromebooks", slug: "chromebooks", aliases: ["chrome laptops"], keywords: ["chromebook", "chrome os"], brands: ["Acer", "Asus", "HP"], models: [] }),
        createLeaf({ name: "MacBooks", slug: "macbooks", aliases: ["apple laptops"], keywords: ["macbook", "mac os"], brands: ["Apple"], models: [] }),
      ]),
      createBranch("Desktops", "desktops", [
        createLeaf({ name: "Gaming PCs", slug: "gaming-pcs", aliases: ["gaming computers"], keywords: ["gaming pc", "desktop gaming"], brands: ["Alienware", "Corsair"], models: [] }),
        createLeaf({ name: "Workstations", slug: "workstations", aliases: ["professional desktops"], keywords: ["workstation", "professional pc"], brands: ["HP", "Dell"], models: [] }),
        createLeaf({ name: "All-in-One PCs", slug: "all-in-one-pcs", aliases: ["aio pcs"], keywords: ["all in one", "aio"], brands: ["Apple", "HP"], models: [] }),
      ]),
      createBranch("Components", "components", [
        createLeaf({ name: "GPUs", slug: "gpus", aliases: ["graphics cards"], keywords: ["gpu", "graphics card"], brands: ["NVIDIA", "AMD"], models: [] }),
        createLeaf({ name: "CPUs", slug: "cpus", aliases: ["processors"], keywords: ["cpu", "processor"], brands: ["Intel", "AMD"], models: [] }),
        createLeaf({ name: "RAM", slug: "ram", aliases: ["memory modules"], keywords: ["ram", "memory"], brands: ["Corsair", "Kingston"], models: [] }),
        createLeaf({ name: "Storage", slug: "storage", aliases: ["ssds", "hdds"], keywords: ["storage", "ssd", "hdd"], brands: ["Samsung", "Western Digital"], models: [] }),
      ]),
      createBranch("Accessories", "computer-accessories", [
        createLeaf({ name: "Monitors", slug: "monitors", aliases: ["screens"], keywords: ["monitor", "display"], brands: ["Dell", "LG"], models: [] }),
        createLeaf({ name: "Keyboards", slug: "keyboards", aliases: ["key boards"], keywords: ["keyboard", "mechanical keyboard"], brands: ["Logitech", "Corsair"], models: [] }),
        createLeaf({ name: "Mice", slug: "mice", aliases: ["mouse"], keywords: ["mouse", "computer mouse"], brands: ["Logitech", "Razer"], models: [] }),
      ]),
    ],
  },
  {
    name: "Electronics",
    slug: "electronics",
    aliases: ["consumer electronics", "gadgets"],
    keywords: ["electronics", "tv", "audio", "camera", "smart home"],
    priority: 86,
    searchWeight: 90,
    children: [
      createBranch("TV & Video", "tv-video", [
        buildProductFamily("Television Models", "television-models", TV_BRANDS, TV_MODEL_BASES, TV_SUFFIXES, COMMON_VARIANTS, {
          aliases: ["tv models"],
          keywords: ["television", "tv", "smart tv", "oled", "qled"],
        }),
        createLeaf({
          name: "Televisions",
          slug: "televisions",
          aliases: ["television", "smart tvs", "oled tv", "qled tv"],
          keywords: ["television", "tv", "smart tv", "oled", "qled"],
          brands: TV_BRANDS,
          models: [],
        }),
        createLeaf({ name: "Streaming Devices", slug: "streaming-devices", aliases: ["media streamers"], keywords: ["streaming", "roku", "fire stick"], brands: ["Roku", "Amazon"], models: [] }),
        createLeaf({ name: "TV Mounts", slug: "tv-mounts", aliases: ["tv brackets"], keywords: ["mount", "wall mount"], brands: [], models: [] }),
      ]),
      createBranch("Audio", "audio", [
        buildProductFamily("Audio Systems", "audio-systems", AUDIO_BRANDS, AUDIO_MODEL_BASES, AUDIO_SUFFIXES, COMMON_VARIANTS, {
          aliases: ["sound systems"],
          keywords: ["audio", "speakers", "headphones", "soundbar"],
        }),
        createLeaf({
          name: "Earbuds",
          slug: "earbuds",
          aliases: ["earbud", "wireless earbuds", "true wireless earbuds"],
          keywords: ["earbuds", "earbud", "wireless earbuds", "airpods"],
          brands: AUDIO_BRANDS,
          models: [],
        }),
        createLeaf({ name: "Hi-Fi", slug: "hi-fi", aliases: ["hi fi"], keywords: ["hi-fi", "stereo"], brands: ["Yamaha", "Denon"], models: [] }),
        createLeaf({ name: "DJ Equipment", slug: "dj-equipment", aliases: ["dj gear"], keywords: ["dj", "turntable", "mixer"], brands: ["Pioneer", "Numark"], models: [] }),
      ]),
      createBranch("Cameras", "cameras", [
        createLeaf({ name: "DSLR", slug: "dslr", aliases: ["digital slr"], keywords: ["dslr", "camera", "photography"], brands: ["Canon", "Nikon"], models: [] }),
        createLeaf({ name: "Mirrorless", slug: "mirrorless", aliases: ["mirrorless camera"], keywords: ["mirrorless", "camera"], brands: ["Sony", "Fujifilm"], models: [] }),
        createLeaf({ name: "Action Cameras", slug: "action-cameras", aliases: ["go pro"], keywords: ["action cam", "sports camera"], brands: ["GoPro", "DJI"], models: [] }),
      ]),
      createBranch("Smart Home", "smart-home", [
        createLeaf({ name: "Smart Speakers", slug: "smart-speakers", aliases: ["voice speakers"], keywords: ["smart speaker", "voice assistant"], brands: ["Amazon", "Google", "Apple"], models: [] }),
        createLeaf({ name: "Security", slug: "smart-security", aliases: ["home security"], keywords: ["security camera", "alarm"], brands: ["Ring", "Arlo"], models: [] }),
        createLeaf({ name: "Lighting", slug: "smart-lighting", aliases: ["smart bulbs"], keywords: ["lighting", "bulb", "smart"], brands: ["Philips Hue", "LIFX"], models: [] }),
      ]),
    ],
  },
  {
    name: "Gaming",
    slug: "gaming",
    aliases: ["video games", "console games"],
    keywords: ["gaming", "console", "pc games", "accessories"],
    priority: 84,
    searchWeight: 86,
    children: [
      createLeaf({ name: "Consoles", slug: "consoles", aliases: ["game consoles"], keywords: ["xbox", "playstation", "switch"], brands: ["Sony", "Microsoft", "Nintendo"], models: [] }),
      createLeaf({ name: "Games", slug: "video-games", aliases: ["video games"], keywords: ["action", "sports", "rpg", "racing"], brands: [], models: [] }),
      createLeaf({ name: "Accessories", slug: "gaming-accessories", aliases: ["gaming gear"], keywords: ["controller", "headset", "chair"], brands: ["Razer", "Logitech"], models: [] }),
      createLeaf({ name: "PC Gaming", slug: "pc-gaming", aliases: ["pc games"], keywords: ["pc gaming", "hardware", "peripherals"], brands: ["NVIDIA", "AMD"], models: [] }),
    ],
  },
  {
    name: "Home & Garden",
    slug: "home-garden",
    aliases: ["home", "garden"],
    keywords: ["home", "garden", "bedding", "kitchen", "decor"],
    priority: 82,
    searchWeight: 85,
    children: [
      createBranch("Furniture", "furniture", [
        buildProductFamily("Sofa Collections", "sofa-collections", FURNITURE_BRANDS, FURNITURE_MODEL_BASES, WATCH_SUFFIXES, COMMON_VARIANTS, {
          aliases: ["sofas", "couches", "settees"],
          keywords: ["sofa", "couch", "living room"],
        }),
        createLeaf({ name: "Dining Tables", slug: "dining-tables", aliases: ["table"], keywords: ["dining", "table"], brands: FURNITURE_BRANDS, models: [] }),
        createLeaf({ name: "Wardrobes", slug: "wardrobes", aliases: ["closets"], keywords: ["wardrobe", "closet"], brands: FURNITURE_BRANDS, models: [] }),
      ]),
      createBranch("Bedding", "bedding", [
        createLeaf({ name: "Pillows", slug: "pillows", aliases: ["cushions", "pillows"], keywords: ["pillow", "cushion", "sleep"], brands: ["Silentnight", "Tempur"], models: [] }),
        createLeaf({ name: "Mattresses", slug: "mattresses", aliases: ["beds"], keywords: ["mattress", "bed", "foam"], brands: ["Emma", "Simba"], models: [] }),
        createLeaf({ name: "Duvets", slug: "duvets", aliases: ["quilts"], keywords: ["duvet", "bedding"], brands: ["Hush", "Naturalmat"], models: [] }),
      ]),
      createBranch("Kitchen", "kitchen", [
        buildProductFamily("Kitchen Appliances", "kitchen-appliances", KITCHEN_BRANDS, KITCHEN_MODEL_BASES, APPLIANCE_SUFFIXES, COMMON_VARIANTS, {
          aliases: ["kitchen gadgets", "kitchen equipment"],
          keywords: ["kitchen", "appliance", "cook"],
        }),
        createLeaf({ name: "Cookware", slug: "cookware", aliases: ["pans", "pots"], keywords: ["cookware", "pan", "pot"], brands: ["Le Creuset", "Tefal"], models: [] }),
        createLeaf({ name: "Cutlery", slug: "cutlery", aliases: ["knives", "forks"], keywords: ["cutlery", "knife", "fork"], brands: ["Robert Welch", "Zwilling"], models: [] }),
      ]),
      createBranch("Garden", "garden", [
        createLeaf({ name: "Plants", slug: "garden-plants", aliases: ["plants"], keywords: ["plant", "garden"], brands: [], models: [] }),
        createLeaf({ name: "Outdoor Furniture", slug: "outdoor-furniture", aliases: ["garden furniture"], keywords: ["outdoor", "garden", "furniture"], brands: FURNITURE_BRANDS, models: [] }),
        createLeaf({ name: "Lawn Care", slug: "lawn-care", aliases: ["grass care"], keywords: ["lawn", "mower", "garden"], brands: ["Gardena", "Bosch"], models: [] }),
      ]),
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    aliases: ["clothing", "apparel", "style"],
    keywords: ["fashion", "clothes", "accessories", "shoes", "footwear"],
    priority: 80,
    searchWeight: 84,
    children: [
      createBranch("Women's Fashion", "womens-fashion", [
        createLeaf({ name: "Women's Clothing", slug: "womens-clothing", aliases: ["ladies clothing"], keywords: ["women", "clothing", "apparel"], brands: FASHION_BRANDS, models: [] }),
        createLeaf({ name: "Women's Shoes", slug: "womens-shoes", aliases: ["ladies shoes"], keywords: ["women shoes", "footwear"], brands: FASHION_BRANDS, models: [] }),
        createBranch("Women's Bags", "womens-bags", [
          createLeaf({ name: "Handbags", slug: "handbags", aliases: ["handbag", "tote bag", "designer bag"], keywords: ["handbag", "tote", "clutch", "backpack"], brands: FASHION_BRANDS, models: [] }),
          createLeaf({ name: "Totes", slug: "totes", aliases: ["tote bag"], keywords: ["tote", "tote bag", "shopping bag"], brands: FASHION_BRANDS, models: [] }),
          createLeaf({ name: "Clutches", slug: "clutches", aliases: ["clutch bag"], keywords: ["clutch", "evening bag"], brands: FASHION_BRANDS, models: [] }),
          createLeaf({ name: "Backpacks", slug: "womens-backpacks", aliases: ["women's backpack", "ladies backpack"], keywords: ["backpack", "rucksack"], brands: FASHION_BRANDS, models: [] }),
        ]),
        createLeaf({ name: "Women's Accessories", slug: "womens-accessories", aliases: ["ladies accessories"], keywords: ["accessories", "jewellery", "scarves"], brands: FASHION_BRANDS, models: [] }),
      ]),
      createBranch("Men's Fashion", "mens-fashion", [
        createLeaf({ name: "Men's Clothing", slug: "mens-clothing", aliases: ["menswear"], keywords: ["men", "clothing"], brands: FASHION_BRANDS, models: [] }),
        createLeaf({ name: "Men's Shoes", slug: "mens-shoes", aliases: ["mens shoes"], keywords: ["men shoes", "footwear"], brands: FASHION_BRANDS, models: [] }),
        createLeaf({ name: "Men's Accessories", slug: "mens-accessories", aliases: ["mens accessories"], keywords: ["accessories", "wallet", "belt"], brands: FASHION_BRANDS, models: [] }),
      ]),
      createBranch("Kids Fashion", "kids-fashion", [
        createLeaf({ name: "Kids Clothing", slug: "kids-clothing", aliases: ["children's clothing"], keywords: ["kids", "children", "clothing"], brands: ["Next", "H&M"], models: [] }),
        createLeaf({ name: "Baby Clothing", slug: "baby-clothing", aliases: ["newborn clothes"], keywords: ["baby", "clothing"], brands: ["Mothercare", "JoJo Maman Bébé"], models: [] }),
        createLeaf({ name: "Kids Shoes", slug: "kids-shoes", aliases: ["children's shoes"], keywords: ["kids shoes", "footwear"], brands: ["Clarks", "Nike"], models: [] }),
      ]),
      buildProductFamily("Shoes", "shoes", FASHION_BRANDS, FASHION_MODEL_BASES, WATCH_SUFFIXES, COMMON_VARIANTS, {
        aliases: ["footwear", "trainers", "boots"],
        keywords: ["shoes", "boots", "trainers", "sneakers"],
      }),
    ],
  },
  {
    name: "Furniture",
    slug: "furniture",
    aliases: ["home furniture", "house furniture"],
    keywords: ["sofa", "table", "bed", "chair", "cabinet"],
    priority: 78,
    searchWeight: 82,
    children: [
      createBranch("Living Room", "living-room", [
        createLeaf({ name: "Sofas", slug: "sofas", aliases: ["couches", "settees"], keywords: ["sofa", "couch"], brands: FURNITURE_BRANDS, models: [] }),
        createLeaf({ name: "TV Stands", slug: "tv-stands", aliases: ["media units"], keywords: ["tv stand", "media unit"], brands: FURNITURE_BRANDS, models: [] }),
      ]),
      createBranch("Bedroom", "bedroom", [
        createLeaf({ name: "Beds", slug: "beds", aliases: ["bed frames"], keywords: ["bed", "bedroom"], brands: FURNITURE_BRANDS, models: [] }),
        createLeaf({ name: "Wardrobes", slug: "wardrobes", aliases: ["closets"], keywords: ["wardrobe", "closet"], brands: FURNITURE_BRANDS, models: [] }),
      ]),
      createBranch("Office", "office-furniture", [
        createLeaf({ name: "Desks", slug: "desks", aliases: ["office desks"], keywords: ["desk", "office furniture"], brands: FURNITURE_BRANDS, models: [] }),
        createLeaf({ name: "Office Chairs", slug: "office-chairs", aliases: ["desk chairs"], keywords: ["office chair", "desk chair"], brands: FURNITURE_BRANDS, models: [] }),
      ]),
      createBranch("Outdoor", "outdoor-furniture", [
        createLeaf({ name: "Garden Chairs", slug: "garden-chairs", aliases: ["outdoor chairs"], keywords: ["garden chair", "outdoor furniture"], brands: FURNITURE_BRANDS, models: [] }),
        createLeaf({ name: "Patio Sets", slug: "patio-sets", aliases: ["garden sets"], keywords: ["patio set", "outdoor dining"], brands: FURNITURE_BRANDS, models: [] }),
      ]),
    ],
  },
  {
    name: "Sports",
    slug: "sports",
    aliases: ["fitness", "exercise", "athletics"],
    keywords: ["sports", "equipment", "fitness", "outdoor", "team"],
    priority: 76,
    searchWeight: 80,
    children: [
      createLeaf({ name: "Fitness Equipment", slug: "fitness-equipment", aliases: ["gym equipment"], keywords: ["fitness", "gym", "exercise"], brands: ["NordicTrack", "Bowflex"], models: [] }),
      createLeaf({ name: "Outdoor Sports", slug: "outdoor-sports", aliases: ["camping", "hiking"], keywords: ["outdoor", "camping", "hiking", "cycling"], brands: ["The North Face", "Berghaus"], models: [] }),
      createLeaf({ name: "Team Sports", slug: "team-sports", aliases: ["football", "rugby", "cricket"], keywords: ["football", "rugby", "cricket", "team"], brands: ["Adidas", "Mitre"], models: [] }),
      createLeaf({ name: "Water Sports", slug: "water-sports", aliases: ["surfing", "kayaking"], keywords: ["water sport", "surfboard", "kayak"], brands: ["O'Neill", "Quiksilver"], models: [] }),
    ],
  },
  {
    name: "Pets",
    slug: "pets",
    aliases: ["pet supplies", "pet care"],
    keywords: ["dog", "cat", "pet", "food", "accessories"],
    priority: 74,
    searchWeight: 78,
    children: [
      createLeaf({ name: "Dogs", slug: "dogs", aliases: ["dog supplies"], keywords: ["dog", "canine", "pets"], brands: ["KONG", "Pedigree"], models: [] }),
      createLeaf({ name: "Cats", slug: "cats", aliases: ["cat supplies"], keywords: ["cat", "feline", "pets"], brands: ["Purina", "Whiskas"], models: [] }),
      createLeaf({ name: "Other Pets", slug: "other-pets", aliases: ["small pets"], keywords: ["rabbit", "hamster", "bird"], brands: ["Kaytee", "Vitakraft"], models: [] }),
      createLeaf({ name: "Pet Services", slug: "pet-services", aliases: ["pet grooming"], keywords: ["grooming", "walking", "boarding"], brands: [], models: [] }),
    ],
  },
  {
    name: "Baby",
    slug: "baby",
    aliases: ["baby products", "newborn"],
    keywords: ["baby", "nursery", "feeding", "toys", "clothing"],
    priority: 72,
    searchWeight: 76,
    children: [
      createLeaf({ name: "Nursery", slug: "nursery", aliases: ["baby room"], keywords: ["baby room", "cot", "changing"], brands: ["John Lewis", "Ikea"], models: [] }),
      createBranch("Pushchairs", "pushchairs", [
        createLeaf({ name: "Prams", slug: "prams", aliases: ["pushchair", "stroller"], keywords: ["pram", "pushchair", "stroller"], brands: ["Bugaboo", "Baby Jogger"], models: [] }),
        createLeaf({ name: "Travel Systems", slug: "travel-systems", aliases: ["travel system", "infant travel system"], keywords: ["travel system", "travel-system", "car seat"], brands: ["Graco", "Chicco"], models: [] }),
      ]),
      createLeaf({ name: "Feeding", slug: "feeding", aliases: ["baby feeding"], keywords: ["bottle", "breast pump", "high chair"], brands: ["Tommee Tippee", "Philips Avent"], models: [] }),
      createLeaf({ name: "Baby Toys", slug: "baby-toys", aliases: ["toddler toys"], keywords: ["toy", "baby toy"], brands: ["Fisher-Price", "VTech"], models: [] }),
    ],
  },
  {
    name: "Jobs",
    slug: "jobs",
    aliases: ["careers", "employment"],
    keywords: ["job", "career", "work", "vacancy", "recruitment"],
    priority: 70,
    searchWeight: 74,
    children: [
      createLeaf({ name: "Full Time", slug: "full-time", aliases: ["full-time jobs"], keywords: ["full-time", "employment"], brands: [], models: [] }),
      createLeaf({ name: "Part Time", slug: "part-time", aliases: ["part-time jobs"], keywords: ["part-time", "employment"], brands: [], models: [] }),
      createLeaf({ name: "Freelance", slug: "freelance", aliases: ["contract work"], keywords: ["freelance", "contract", "self-employed"], brands: [], models: [] }),
      createLeaf({ name: "Apprenticeships", slug: "apprenticeships", aliases: ["training"], keywords: ["apprenticeship", "trainee", "training"], brands: [], models: [] }),
    ],
  },
  {
    name: "Services",
    slug: "services",
    aliases: ["service providers", "contractors"],
    keywords: ["service", "home service", "professional", "creative", "events"],
    priority: 68,
    searchWeight: 72,
    children: [
      createLeaf({ name: "Home Services", slug: "home-services", aliases: ["house services"], keywords: ["cleaning", "plumbing", "electrical"], brands: [], models: [] }),
      createLeaf({ name: "Professional Services", slug: "professional-services", aliases: ["business services"], keywords: ["accounting", "legal", "consulting"], brands: [], models: [] }),
      createLeaf({ name: "Creative Services", slug: "creative-services", aliases: ["design services"], keywords: ["design", "photography", "video"], brands: [], models: [] }),
      createLeaf({ name: "Event Services", slug: "event-services", aliases: ["party services"], keywords: ["catering", "dj", "photography"], brands: [], models: [] }),
    ],
  },
  {
    name: "Business",
    slug: "business",
    aliases: ["business equipment", "commercial"],
    keywords: ["business", "equipment", "inventory", "franchise"],
    priority: 66,
    searchWeight: 70,
    children: [
      createLeaf({ name: "Equipment", slug: "business-equipment", aliases: ["commercial equipment"], keywords: ["equipment", "commercial"], brands: ["Caterpillar", "Bosch"], models: [] }),
      createLeaf({ name: "Inventory", slug: "inventory", aliases: ["stock"], keywords: ["inventory", "stock", "wholesale"], brands: [], models: [] }),
      createLeaf({ name: "Franchise", slug: "franchise", aliases: ["franchise opportunities"], keywords: ["franchise", "business opportunity"], brands: [], models: [] }),
      createLeaf({ name: "Business for Sale", slug: "business-for-sale", aliases: ["companies for sale"], keywords: ["business sale", "company for sale"], brands: [], models: [] }),
    ],
  },
  {
    name: "Industrial",
    slug: "industrial",
    aliases: ["industry", "manufacturing"],
    keywords: ["machinery", "safety", "materials", "warehouse"],
    priority: 64,
    searchWeight: 68,
    children: [
      createLeaf({ name: "Machinery", slug: "machinery", aliases: ["industrial machinery"], keywords: ["machinery", "equipment", "industrial"], brands: CONSTRUCTION_BRANDS, models: [] }),
      createLeaf({ name: "Safety", slug: "safety", aliases: ["ppe", "protective"], keywords: ["ppe", "safety", "protective"], brands: ["3M", "Honeywell"], models: [] }),
      createLeaf({ name: "Materials", slug: "materials", aliases: ["industrial materials"], keywords: ["steel", "plastic", "chemical"], brands: [], models: [] }),
      createLeaf({ name: "Warehouse", slug: "warehouse", aliases: ["storage"], keywords: ["warehouse", "racking", "pallet"], brands: [], models: [] }),
    ],
  },
  {
    name: "Health",
    slug: "health",
    aliases: ["wellness", "medical"],
    keywords: ["health", "wellness", "supplements", "medical"],
    priority: 62,
    searchWeight: 66,
    children: [
      createLeaf({ name: "Wellness", slug: "wellness", aliases: ["health products"], keywords: ["supplements", "vitamins", "protein"], brands: ["Vitabiotics", "Holland & Barrett"], models: [] }),
      createLeaf({ name: "Medical", slug: "medical", aliases: ["healthcare"], keywords: ["medical", "equipment", "supplies"], brands: MEDICAL_BRANDS, models: [] }),
      createLeaf({ name: "Personal Care", slug: "personal-care", aliases: ["hygiene"], keywords: ["personal care", "hygiene", "skincare"], brands: HEALTH_BRANDS, models: [] }),
      createLeaf({ name: "Optical", slug: "optical", aliases: ["eyewear"], keywords: ["glasses", "contacts", "optical"], brands: ["Ray-Ban", "Oakley"], models: [] }),
    ],
  },
  {
    name: "Beauty",
    slug: "beauty",
    aliases: ["cosmetics", "skincare"],
    keywords: ["beauty", "makeup", "hair", "fragrance"],
    priority: 60,
    searchWeight: 64,
    children: [
      createLeaf({ name: "Skincare", slug: "skincare", aliases: ["skin care"], keywords: ["skincare", "moisturiser", "serum"], brands: ["The Ordinary", "Clinique"], models: [] }),
      createLeaf({ name: "Makeup", slug: "makeup", aliases: ["cosmetics"], keywords: ["makeup", "foundation", "lipstick"], brands: ["MAC", "Maybelline"], models: [] }),
      createLeaf({ name: "Hair", slug: "hair", aliases: ["haircare"], keywords: ["shampoo", "conditioner", "hair"], brands: ["L'Oreal", "Schwarzkopf"], models: [] }),
      createLeaf({ name: "Fragrance", slug: "fragrance", aliases: ["perfume"], keywords: ["perfume", "cologne", "scent"], brands: ["Chanel", "Dior"], models: [] }),
    ],
  },
  {
    name: "Music",
    slug: "music",
    aliases: ["instruments", "audio"],
    keywords: ["music", "instruments", "vinyl", "studio"],
    priority: 58,
    searchWeight: 62,
    children: [
      createLeaf({ name: "Instruments", slug: "instruments", aliases: ["musical instruments"], keywords: ["guitar", "keyboard", "drum"], brands: ["Yamaha", "Fender"], models: [] }),
      createLeaf({ name: "Vinyl & CDs", slug: "vinyl-cds", aliases: ["records"], keywords: ["vinyl", "cd", "music media"], brands: [], models: [] }),
      createLeaf({ name: "DJ & Studio", slug: "dj-studio", aliases: ["dj equipment"], keywords: ["dj", "studio", "mixing"], brands: ["Pioneer"], models: [] }),
      createLeaf({ name: "Sheet Music", slug: "sheet-music", aliases: ["music scores"], keywords: ["sheet music", "score"], brands: [], models: [] }),
    ],
  },
  {
    name: "Collectibles",
    slug: "collectibles",
    aliases: ["collectables", "memorabilia"],
    keywords: ["collectible", "trading cards", "memorabilia", "vintage"],
    priority: 56,
    searchWeight: 60,
    children: [
      createLeaf({ name: "Trading Cards", slug: "trading-cards", aliases: ["cards"], keywords: ["pokemon", "magic", "sports cards"], brands: [], models: [] }),
      createLeaf({ name: "Vintage", slug: "vintage", aliases: ["antique collectibles"], keywords: ["vintage", "retro", "antique"], brands: [], models: [] }),
      createLeaf({ name: "Memorabilia", slug: "memorabilia", aliases: ["collectible memorabilia"], keywords: ["memorabilia", "souvenir", "collectible"], brands: [], models: [] }),
      createLeaf({ name: "Figurines", slug: "figurines", aliases: ["statues"], keywords: ["figurine", "figure", "model"], brands: [], models: [] }),
    ],
  },
  {
    name: "Jewellery",
    slug: "jewellery",
    aliases: ["jewelry", "gems"],
    keywords: ["jewellery", "rings", "necklaces", "watches"],
    priority: 54,
    searchWeight: 58,
    children: [
      createLeaf({ name: "Rings", slug: "rings", aliases: ["ring"], keywords: ["ring", "jewellery", "wedding band"], brands: ["Tiffany & Co.", "Cartier"], models: [] }),
      createLeaf({ name: "Necklaces", slug: "necklaces", aliases: ["pendants"], keywords: ["necklace", "jewellery"], brands: ["Pandora", "Thomas Sabo"], models: [] }),
      createLeaf({ name: "Watches", slug: "watches", aliases: ["watch"], keywords: ["watch", "timepiece"], brands: ["Rolex", "Omega"], models: [] }),
      createLeaf({ name: "Earrings", slug: "earrings", aliases: ["earring"], keywords: ["earring", "jewellery"], brands: ["Swarovski", "Pandora"], models: [] }),
    ],
  },
  {
    name: "Luxury",
    slug: "luxury",
    aliases: ["designer", "high-end"],
    keywords: ["luxury", "designer", "premium", "exclusive"],
    priority: 52,
    searchWeight: 56,
    children: [
      buildProductFamily("Luxury Collections", "luxury-collections", LUXURY_BRANDS, LUXURY_MODEL_BASES, WATCH_SUFFIXES, COMMON_VARIANTS, {
        aliases: ["designer collections", "luxury brands"],
        keywords: ["luxury", "designer", "exclusive"],
      }),
      createLeaf({ name: "Luxury Watches", slug: "luxury-watches", aliases: ["designer watches"], keywords: ["luxury watch", "timepiece"], brands: LUXURY_BRANDS, models: [] }),
      createLeaf({ name: "Luxury Handbags", slug: "luxury-handbags", aliases: ["designer bags"], keywords: ["handbag", "luxury bag"], brands: LUXURY_BRANDS, models: [] }),
    ],
  },
  {
    name: "Office",
    slug: "office",
    aliases: ["office supplies", "workplace"],
    keywords: ["office", "desk", "chair", "technology", "supplies"],
    priority: 50,
    searchWeight: 54,
    children: [
      createBranch("Office Furniture", "office-furniture", [
        createLeaf({ name: "Desks", slug: "desks-office", aliases: ["office desks"], keywords: ["desk", "office desk"], brands: FURNITURE_BRANDS, models: [] }),
        createLeaf({ name: "Chairs", slug: "office-chairs", aliases: ["desk chairs"], keywords: ["office chair", "desk chair"], brands: FURNITURE_BRANDS, models: [] }),
      ]),
      buildProductFamily("Office Technology", "office-technology", ["Dell", "HP", "Canon", "Brother", "Epson", "Logitech", "Apple", "Microsoft", "Lenovo", "Samsung"], {
        "Dell": ["Monitor", "Printer", "Dock", "Workstation", "Laptop"],
        "HP": ["Printer", "Scanner", "Laptop", "Desktop", "Monitor"],
        "Canon": ["Laser Printer", "Inkjet Printer", "Scanner", "Projector", "Camera"],
        "Brother": ["Laser Printer", "Label Printer", "Scanner", "Fax Machine","All-in-One"],
        "Epson": ["Inkjet Printer", "Scanner", "Projector", "Receipt Printer","SureColor"],
        "Logitech": ["Webcam", "Keyboard", "Mouse", "Speaker", "Headset"],
        "Apple": ["MacBook", "iMac", "Mac Mini", "iPad", "Magic Keyboard"],
        "Microsoft": ["Surface Laptop", "Surface Pro", "Surface Studio", "Surface Go", "Surface Dock"],
        "Lenovo": ["ThinkPad", "ThinkCentre", "Yoga", "Legion", "IdeaPad"],
        "Samsung": ["Monitor", "Printer", "Galaxy Book", "Notebook", "Smart Monitor"],
      }, WATCH_SUFFIXES, COMMON_VARIANTS, {
        aliases: ["office tech"],
        keywords: ["printer", "monitor", "office technology"],
      }),
      createLeaf({ name: "Office Supplies", slug: "office-supplies", aliases: ["stationery"], keywords: ["stationery", "paper", "ink"], brands: ["Staples", "Office Depot"], models: [] }),
    ],
  },
  {
    name: "Food",
    slug: "food",
    aliases: ["groceries", "food & drink"],
    keywords: ["food", "groceries", "beverages", "specialty"],
    priority: 48,
    searchWeight: 52,
    children: [
      createLeaf({ name: "Groceries", slug: "groceries", aliases: ["supermarket"], keywords: ["grocery", "food"], brands: ["Tesco", "Sainsbury's"], models: [] }),
      createLeaf({ name: "Speciality Food", slug: "speciality-food", aliases: ["gourmet food"], keywords: ["gourmet", "artisan", "organic"], brands: [], models: [] }),
      createLeaf({ name: "Beverages", slug: "beverages", aliases: ["drinks"], keywords: ["coffee", "tea", "alcohol"], brands: ["Coca-Cola", "Red Bull"], models: [] }),
      createLeaf({ name: "Food Equipment", slug: "food-equipment", aliases: ["catering equipment"], keywords: ["kitchen equipment", "catering"], brands: KITCHEN_BRANDS, models: [] }),
    ],
  },
  {
    name: "Books",
    slug: "books",
    aliases: ["literature", "reading"],
    keywords: ["book", "novel", "fiction", "non-fiction", "comics"],
    priority: 46,
    searchWeight: 50,
    children: [
      createLeaf({ name: "Fiction", slug: "fiction", aliases: ["novels"], keywords: ["fiction", "novel"], brands: [], models: [] }),
      createLeaf({ name: "Non-Fiction", slug: "non-fiction", aliases: ["nonfiction"], keywords: ["non-fiction", "biography", "history"], brands: [], models: [] }),
      createLeaf({ name: "Academic", slug: "academic", aliases: ["textbooks"], keywords: ["academic", "textbook", "study guide"], brands: [], models: [] }),
      createLeaf({ name: "Comics & Manga", slug: "comics", aliases: ["graphic novels"], keywords: ["comics", "manga", "graphic novel"], brands: [], models: [] }),
    ],
  },
  {
    name: "Movies",
    slug: "movies",
    aliases: ["films", "dvd", "blu-ray"],
    keywords: ["movie", "film", "dvd", "blu-ray"],
    priority: 44,
    searchWeight: 48,
    children: [
      createLeaf({ name: "Blu-ray", slug: "blu-ray", aliases: ["bluray"], keywords: ["blu-ray", "dvd"], brands: [], models: [] }),
      createLeaf({ name: "DVD", slug: "dvd", aliases: ["dvd movies"], keywords: ["dvd", "disk"], brands: [], models: [] }),
      createLeaf({ name: "Collectibles", slug: "movie-collectibles", aliases: ["film memorabilia"], keywords: ["collectible", "memorabilia"], brands: [], models: [] }),
      createLeaf({ name: "4K UHD", slug: "4k-uhd", aliases: ["4k"], keywords: ["4k", "UHD", "ultra hd"], brands: [], models: [] }),
    ],
  },
  {
    name: "Tickets",
    slug: "tickets",
    aliases: ["events", "admissions"],
    keywords: ["ticket", "concert", "sports event", "theatre", "travel"],
    priority: 42,
    searchWeight: 46,
    children: [
      createLeaf({ name: "Concerts", slug: "concerts", aliases: ["music events"], keywords: ["concert", "live music"], brands: [], models: [] }),
      createLeaf({ name: "Sports Events", slug: "sports-events", aliases: ["sports tickets"], keywords: ["sports", "match", "game"], brands: [], models: [] }),
      createLeaf({ name: "Theatre", slug: "theatre", aliases: ["shows"], keywords: ["theatre", "play", "musical"], brands: [], models: [] }),
      createLeaf({ name: "Travel Tickets", slug: "travel-tickets", aliases: ["transport tickets"], keywords: ["flight", "train", "bus"], brands: [], models: [] }),
    ],
  },
  {
    name: "Art",
    slug: "art",
    aliases: ["artworks", "paintings"],
    keywords: ["art", "painting", "sculpture", "prints", "photography"],
    priority: 40,
    searchWeight: 44,
    children: [
      createLeaf({ name: "Paintings", slug: "paintings", aliases: ["canvas"], keywords: ["painting", "artwork"], brands: [], models: [] }),
      createLeaf({ name: "Sculpture", slug: "sculpture", aliases: ["statues"], keywords: ["sculpture", "statue"], brands: [], models: [] }),
      createLeaf({ name: "Prints", slug: "prints", aliases: ["art prints"], keywords: ["print", "art print"], brands: [], models: [] }),
      createLeaf({ name: "Photography", slug: "photography", aliases: ["photographic art"], keywords: ["photography", "photo"], brands: [], models: [] }),
    ],
  },
  {
    name: "Travel",
    slug: "travel",
    aliases: ["holidays", "vacations"],
    keywords: ["travel", "flights", "hotels", "luggage"],
    priority: 38,
    searchWeight: 42,
    children: [
      createLeaf({ name: "Holidays", slug: "holidays", aliases: ["vacations"], keywords: ["holiday", "vacation", "break"], brands: [], models: [] }),
      createLeaf({ name: "Flights", slug: "flights", aliases: ["air travel"], keywords: ["flight", "airline", "plane"], brands: [], models: [] }),
      createLeaf({ name: "Accommodation", slug: "accommodation", aliases: ["hotels"], keywords: ["hotel", "apartment", "hostel"], brands: [], models: [] }),
      createLeaf({ name: "Luggage", slug: "luggage", aliases: ["suitcases"], keywords: ["luggage", "suitcase", "travel bag"], brands: KITCHEN_BRANDS, models: [] }),
    ],
  },
  {
    name: "Tools",
    slug: "tools",
    aliases: ["hardware", "equipment"],
    keywords: ["tools", "power tools", "hand tools", "workshop"],
    priority: 36,
    searchWeight: 40,
    children: [
      createBranch("Power Tools", "power-tools", [
        buildProductFamily("Power Tool Brands", "power-tool-brands", TOOL_BRANDS, TOOL_MODEL_BASES, TOOL_SUFFIXES, COMMON_VARIANTS, {
          aliases: ["electric tools", "cordless tools"],
          keywords: ["power tool", "drill", "saw", "router"],
        }),
        createLeaf({ name: "Cordless Tools", slug: "cordless-tools", aliases: ["battery tools"], keywords: ["cordless", "battery"], brands: TOOL_BRANDS, models: [] }),
      ]),
      createBranch("Hand Tools", "hand-tools", [
        createLeaf({ name: "Wrenches", slug: "wrenches", aliases: ["spanners"], keywords: ["wrench", "spanner"], brands: TOOL_BRANDS, models: [] }),
        createLeaf({ name: "Screwdrivers", slug: "screwdrivers", aliases: ["drivers"], keywords: ["screwdriver", "driver"], brands: TOOL_BRANDS, models: [] }),
        createLeaf({ name: "Hammers", slug: "hammers", aliases: ["mallets"], keywords: ["hammer", "mallet"], brands: TOOL_BRANDS, models: [] }),
      ]),
      createBranch("Workshop", "workshop", [
        createLeaf({ name: "Workbenches", slug: "workbenches", aliases: ["bench"], keywords: ["workbench", "bench"], brands: TOOL_BRANDS, models: [] }),
        createLeaf({ name: "Tool Storage", slug: "tool-storage", aliases: ["tool boxes"], keywords: ["tool storage", "toolbox"], brands: TOOL_BRANDS, models: [] }),
      ]),
    ],
  },
  {
    name: "Auto Parts",
    slug: "auto-parts",
    aliases: ["car parts", "vehicle parts"],
    keywords: ["auto parts", "car parts", "engine", "brake"],
    priority: 34,
    searchWeight: 38,
    children: [
      createBranch("Engine Parts", "engine-parts", [
        buildProductFamily("Engine Parts", "engine-parts-collection", CAR_PART_BRANDS, CAR_PART_MODEL_BASES, APPLIANCE_SUFFIXES, ["Replacement", "Genuine", "Performance", "OEM", "Premium", "Standard"], {
          aliases: ["engine components", "performance parts"],
          keywords: ["engine", "replacement", "genuine"],
        }),
      ]),
      createLeaf({ name: "Body Parts", slug: "body-parts", aliases: ["car body parts"], keywords: ["bumper", "mirror", "panel"], brands: CAR_PART_BRANDS, models: [] }),
      createLeaf({ name: "Interior Parts", slug: "interior-parts", aliases: ["car interior"], keywords: ["seat", "dashboard", "steering"], brands: CAR_PART_BRANDS, models: [] }),
      createLeaf({ name: "Wheels & Tyres", slug: "wheels-tyres", aliases: ["wheels", "tires", "tyres"], keywords: ["wheel", "tyre", "tire"], brands: CAR_PART_BRANDS, models: [] }),
    ],
  },
  {
    name: "Bicycles",
    slug: "bicycles",
    aliases: ["bikes", "cycling"],
    keywords: ["bicycle", "bike", "cycle", "mountain", "road"],
    priority: 32,
    searchWeight: 36,
    children: [
      buildProductFamily("Road Bikes", "road-bikes", BIKE_BRANDS, BIKE_MODEL_BASES, BIKE_SUFFIXES, COMMON_VARIANTS, {
        aliases: ["road bikes"],
        keywords: ["road bike", "race bike"],
      }),
      createLeaf({ name: "Mountain Bikes", slug: "mountain-bikes", aliases: ["mtb"], keywords: ["mountain bike", "trail"], brands: BIKE_BRANDS, models: [] }),
      createLeaf({ name: "Electric Bikes", slug: "electric-bikes", aliases: ["e-bikes"], keywords: ["electric bike", "ebike"], brands: BIKE_BRANDS, models: [] }),
      createLeaf({ name: "Bike Parts", slug: "bike-parts", aliases: ["cycle parts"], keywords: ["wheel", "gear", "brake"], brands: BIKE_BRANDS, models: [] }),
    ],
  },
  {
    name: "Agriculture",
    slug: "agriculture",
    aliases: ["farming", "farm equipment"],
    keywords: ["agriculture", "farm", "tractor", "livestock"],
    priority: 30,
    searchWeight: 34,
    children: [
      createLeaf({ name: "Farm Equipment", slug: "farm-equipment", aliases: ["farm machinery"], keywords: ["tractor", "harvester", "farm"], brands: CONSTRUCTION_BRANDS, models: [] }),
      createLeaf({ name: "Livestock", slug: "livestock", aliases: ["animal feed"], keywords: ["livestock", "feed", "fencing"], brands: [], models: [] }),
      createLeaf({ name: "Produce", slug: "produce", aliases: ["farm produce"], keywords: ["produce", "crops", "vegetables"], brands: [], models: [] }),
      createLeaf({ name: "Equestrian", slug: "equestrian", aliases: ["horse equipment"], keywords: ["horse", "equestrian", "saddle"], brands: [], models: [] }),
    ],
  },
  {
    name: "Construction",
    slug: "construction",
    aliases: ["building", "site"],
    keywords: ["construction", "machinery", "materials", "safety"],
    priority: 28,
    searchWeight: 32,
    children: [
      buildProductFamily("Heavy Machinery", "heavy-machinery", CONSTRUCTION_BRANDS, CONSTRUCTION_MODEL_BASES, APPLIANCE_SUFFIXES, COMMON_VARIANTS, {
        aliases: ["construction machinery", "site equipment"],
        keywords: ["excavator", "digger", "bulldozer"],
      }),
      createLeaf({ name: "Building Materials", slug: "building-materials", aliases: ["construction materials"], keywords: ["cement", "brick", "timber"], brands: [], models: [] }),
      createLeaf({ name: "Safety Equipment", slug: "construction-safety", aliases: ["site safety"], keywords: ["ppe", "helmet", "high viz"], brands: ["3M", "Honeywell"], models: [] }),
    ],
  },
  {
    name: "Medical",
    slug: "medical",
    aliases: ["healthcare", "clinical"],
    keywords: ["medical", "equipment", "supplies", "diagnostic"],
    priority: 26,
    searchWeight: 30,
    children: [
      buildProductFamily("Diagnostic Equipment", "diagnostic-equipment", MEDICAL_BRANDS, MEDICAL_MODEL_BASES, WATCH_SUFFIXES, COMMON_VARIANTS, {
        aliases: ["medical diagnostics", "health diagnostics"],
        keywords: ["diagnostic", "scanner", "monitor"],
      }),
      createLeaf({ name: "Mobility Aids", slug: "mobility-aids", aliases: ["walking aids"], keywords: ["mobility", "wheelchair", "walker"], brands: ["Drive Medical", "Invacare"], models: [] }),
      createLeaf({ name: "Protective Equipment", slug: "protective-equipment", aliases: ["medical ppe"], keywords: ["ppe", "mask", "glove"], brands: ["3M", "Honeywell"], models: [] }),
    ],
  },
  {
    name: "DIY",
    slug: "diy",
    aliases: ["home improvement", "handyman"],
    keywords: ["do it yourself", "tools", "building", "repair"],
    priority: 24,
    searchWeight: 28,
    children: [
      createLeaf({ name: "Building", slug: "building", aliases: ["construction"], keywords: ["timber", "plaster", "brick"], brands: [], models: [] }),
      createLeaf({ name: "Painting", slug: "painting", aliases: ["decorating"], keywords: ["paint", "roller", "brush"], brands: [], models: [] }),
      createLeaf({ name: "Plumbing", slug: "plumbing", aliases: ["pipes"], keywords: ["tap", "pipe", "leak"], brands: [], models: [] }),
      createLeaf({ name: "Electrical", slug: "electrical", aliases: ["wiring"], keywords: ["cable", "socket", "switch"], brands: [], models: [] }),
    ],
  },
  {
    name: "Toys",
    slug: "toys",
    aliases: ["games", "play"],
    keywords: ["toy", "children", "games", "collectible"],
    priority: 22,
    searchWeight: 26,
    children: [
      createLeaf({ name: "Building Toys", slug: "building-toys", aliases: ["construction toys"], keywords: ["lego", "blocks"], brands: ["LEGO", "Mega Bloks"], models: [] }),
      createLeaf({ name: "Board Games", slug: "board-games", aliases: ["tabletop games"], keywords: ["board game", "tabletop"], brands: ["Hasbro", "Mattel"], models: [] }),
      createLeaf({ name: "Outdoor Toys", slug: "outdoor-toys", aliases: ["garden toys"], keywords: ["outdoor", "play"], brands: [], models: [] }),
      createLeaf({ name: "Educational Toys", slug: "educational-toys", aliases: ["learning toys"], keywords: ["educational", "learning"], brands: ["LeapFrog", "VTech"], models: [] }),
    ],
  },
  {
    name: "Hobbies",
    slug: "hobbies",
    aliases: ["crafts", "pastimes"],
    keywords: ["hobby", "craft", "model", "collection"],
    priority: 20,
    searchWeight: 24,
    children: [
      createLeaf({ name: "Model Making", slug: "model-making", aliases: ["scale models"], keywords: ["model", "scale model", "plastic model"], brands: [], models: [] }),
      createLeaf({ name: "RC", slug: "rc", aliases: ["remote control"], keywords: ["rc car", "drone", "quad"], brands: [], models: [] }),
      createLeaf({ name: "Sewing", slug: "sewing", aliases: ["needlework"], keywords: ["sewing", "fabric", "thread"], brands: [], models: [] }),
      createLeaf({ name: "Knitting", slug: "knitting", aliases: ["crochet"], keywords: ["knitting", "yarn", "needle"], brands: [], models: [] }),
    ],
  },
  {
    name: "Auction",
    slug: "auction",
    aliases: ["auctions", "bid"],
    keywords: ["auction", "bidding", "sale"],
    priority: 18,
    searchWeight: 22,
    children: [
      createLeaf({ name: "Live Auctions", slug: "live-auctions", aliases: ["auction events"], keywords: ["live auction", "bid live"], brands: [], models: [] }),
      createLeaf({ name: "Online Auctions", slug: "online-auctions", aliases: ["internet auction"], keywords: ["online auction", "bid online"], brands: [], models: [] }),
      createLeaf({ name: "Property Auctions", slug: "property-auctions", aliases: ["real estate auctions"], keywords: ["property auction", "house auction"], brands: [], models: [] }),
      createLeaf({ name: "Motors Auctions", slug: "motors-auctions", aliases: ["vehicle auctions"], keywords: ["car auction", "motor auction"], brands: [], models: [] }),
    ],
  },
];

function buildTaxonomyTree(): TaxonomyCategoryNode[] {
  const registry = new Set<string>();

  function ensureUniqueSlug(candidate: string, parentSlug: string | null): string {
    if (!registry.has(candidate)) {
      registry.add(candidate);
      return candidate;
    }

    // First collision → qualify with the parent slug for a stable, readable slug.
    if (parentSlug) {
      const qualified = `${parentSlug}-${candidate}`;
      if (!registry.has(qualified)) {
        registry.add(qualified);
        return qualified;
      }
    }

    // Guaranteed-terminating fallback: numeric suffixing. The previous
    // implementation recomputed a constant `${parentSlug}-${candidate}` inside
    // the loop and never consumed `suffix`, so a duplicate sibling slug (e.g.
    // two "Bosch" brands under "engine-parts-collection") spun forever and
    // hung the main thread.
    const base = parentSlug ? `${parentSlug}-${candidate}` : candidate;
    let suffix = 2;
    let slug = `${base}-${suffix}`;
    while (registry.has(slug)) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    registry.add(slug);
    return slug;
  }

  function buildNode(node: RawCategoryNode, parentId: string | null, parentSlug: string | null, path: string[]): TaxonomyCategoryNode {
    const baseSlug = node.slug ?? slugify(node.name);
    const slug = ensureUniqueSlug(baseSlug, parentSlug);
    const seoSlug = [...path, slug].join("/");
    const id = `taxonomy:${[...path, slug].join(":")}`;
    const children = (node.children ?? []).map((child) => buildNode(child, id, slug, [...path, slug]));
    const isLeaf = children.length === 0;
    const priority = node.priority ?? Math.max(10, 100 - path.length * 5);
    const searchWeight = node.searchWeight ?? Math.max(10, 100 - path.length * 4);

    return {
      id,
      slug,
      name: node.name,
      parentId,
      children,
      aliases: node.aliases ?? [],
      keywords: node.keywords ?? [],
      brands: node.brands ?? [],
      models: node.models ?? [],
      priority,
      isLeaf,
      searchWeight,
      seoSlug,
    };
  }

  return CATEGORY_DEFINITIONS.map((node) => buildNode(node, null, null, []));
}

let taxonomyTreeCache: TaxonomyCategoryNode[] | null = null;
let flatTaxonomyCache: TaxonomyCategoryNode[] | null = null;

export function getTaxonomyTree(): TaxonomyCategoryNode[] {
  if (!taxonomyTreeCache) {
    taxonomyTreeCache = buildTaxonomyTree();
  }
  return taxonomyTreeCache;
}

export function getFlatTaxonomy(): TaxonomyCategoryNode[] {
  if (!flatTaxonomyCache) {
    const nodes: TaxonomyCategoryNode[] = [];
    const walk = (node: TaxonomyCategoryNode) => {
      nodes.push(node);
      node.children.forEach(walk);
    };
    getTaxonomyTree().forEach(walk);
    flatTaxonomyCache = nodes;
  }
  return flatTaxonomyCache;
}
