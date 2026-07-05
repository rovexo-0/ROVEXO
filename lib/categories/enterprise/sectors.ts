import type { SectorDef } from "@/lib/categories/enterprise/builder";
import {
  BATHROOM_ITEMS,
  BEDDING_ITEMS,
  BEDDING_SIZES,
  BLIND_TYPES,
  BOOK_GENRES,
  CAR_BODY_TYPES,
  CAR_MAKES,
  COLLECTIBLE_TYPES,
  COMPUTER_BRANDS,
  CONSTRUCTION_ITEMS,
  CURTAIN_TYPES,
  DIY_ITEMS,
  FASHION_SIZES,
  FEATURE_PHONE_ITEMS,
  FURNITURE_ITEMS,
  GARDEN_ITEMS,
  GYM_EQUIPMENT_ITEMS,
  HOME_TEXTILES_ITEMS,
  LUXURY_FASHION_ITEMS,
  JOB_SECTORS,
  KITCHEN_ITEMS,
  PET_TYPES,
  PHONE_BRANDS,
  PHONE_ACCESSORY_ITEMS,
  PHOTOGRAPHY_ITEMS,
  POWER_TOOL_ITEMS,
  PROPERTY_TYPES,
  SERVICE_TYPES,
  SMARTPHONE_ITEMS,
  SPORT_TYPES,
  TABLE_TYPES,
  TOOL_BRANDS,
  TENT_ACCESSORY_ITEMS,
  VEHICLE_INTERIOR_ITEMS,
  VEHICLE_EXTERIOR_ITEMS,
  pairsFromNames,
} from "@/lib/categories/enterprise/item-banks";

export const ENTERPRISE_SECTORS: SectorDef[] = [
  {
    id: "cat-vehicles", name: "Vehicles", slug: "vehicles", sortOrder: 1,
    departments: [
      { name: "Cars", slug: "cars", items: [...CAR_BODY_TYPES], brands: CAR_MAKES },
      { name: "Motorbikes", slug: "motorbikes", items: [["Sports", "sports-bikes"], ["Cruiser", "cruiser"], ["Scooter", "scooter"], ["Adventure", "adventure"], ["Classic", "classic-bikes"], ["Parts", "motorbike-parts"], ["Gear", "motorbike-gear"]], brands: ["Honda", "Yamaha", "Kawasaki", "BMW", "Ducati", "Harley-Davidson"] },
      { name: "Vans & Trucks", slug: "vans-trucks", items: [["Panel Vans", "panel-vans"], ["Pickups", "pickups"], ["Lorries", "lorries"], ["Minibuses", "minibuses"], ["Commercial", "commercial-vans"], ["Parts", "van-parts"]] },
      { name: "Caravans & Motorhomes", slug: "caravans", items: [["Caravans", "caravans"], ["Motorhomes", "motorhomes"], ["Camper Vans", "camper-vans"], ["Accessories", "caravan-accessories"]] },
      { name: "Boats", slug: "boats", items: [["Sailing", "sailing"], ["Motor Boats", "motor-boats"], ["Kayaks", "kayaks"], ["Jet Skis", "jet-skis"], ["Parts", "boat-parts"]] },
      { name: "Interior", slug: "vehicle-interior", items: [...VEHICLE_INTERIOR_ITEMS] },
      { name: "Exterior", slug: "vehicle-exterior", items: [...VEHICLE_EXTERIOR_ITEMS] },
    ],
  },
  {
    id: "cat-property", name: "Property", slug: "property", sortOrder: 2,
    departments: [
      { name: "For Sale", slug: "for-sale", items: [...PROPERTY_TYPES] },
      { name: "To Rent", slug: "to-rent", items: [...PROPERTY_TYPES] },
      { name: "Commercial", slug: "commercial-property", items: [["Offices", "offices"], ["Retail", "retail-space"], ["Industrial", "industrial-space"], ["Land", "commercial-land"]] },
      { name: "Overseas", slug: "overseas", items: [["Europe", "europe"], ["Asia", "asia"], ["Americas", "americas"], ["Holiday Homes", "holiday-homes"]] },
    ],
  },
  {
    id: "cat-phones", name: "Phones", slug: "phones", sortOrder: 3,
    departments: [
      { name: "Smartphones", slug: "smartphones", items: [...SMARTPHONE_ITEMS], brands: PHONE_BRANDS },
      { name: "Feature Phones", slug: "feature-phones", items: [...FEATURE_PHONE_ITEMS] },
      {
        name: "Accessories",
        slug: "phone-accessories-dept",
        groups: [{ name: "Accessories", slug: "phone-accessories", items: [...PHONE_ACCESSORY_ITEMS] }],
      },
      { name: "Tablets", slug: "tablets", items: [["iPad", "ipad"], ["Android Tablets", "android-tablets"], ["Kids Tablets", "kids-tablets"], ["Accessories", "tablet-accessories"]], brands: PHONE_BRANDS },
      { name: "Wearables", slug: "wearables", items: [["Smartwatches", "smartwatches"], ["Fitness Trackers", "fitness-trackers"], ["VR Headsets", "vr-headsets"]], brands: ["Apple", "Samsung", "Garmin", "Fitbit"] },
      { name: "Phone Parts", slug: "phone-parts", items: [["Screens", "screens"], ["Batteries", "batteries"], ["Cases", "cases"], ["Chargers", "chargers"]] },
    ],
  },
  {
    id: "cat-computers", name: "Computers", slug: "computers", sortOrder: 4,
    departments: [
      { name: "Laptops", slug: "laptops", items: [["Gaming Laptops", "gaming-laptops"], ["Business Laptops", "business-laptops"], ["Chromebooks", "chromebooks"], ["MacBooks", "macbooks"]], brands: COMPUTER_BRANDS },
      { name: "Desktops", slug: "desktops", items: [["Gaming PCs", "gaming-pcs"], ["All-in-One", "all-in-one"], ["Workstations", "workstations"], ["Custom Builds", "custom-builds"]], brands: COMPUTER_BRANDS },
      { name: "Components", slug: "components", items: [["GPUs", "gpus"], ["CPUs", "cpus"], ["RAM", "ram"], ["Storage", "storage"], ["Motherboards", "motherboards"], ["PSUs", "psus"]] },
      { name: "Accessories", slug: "computer-accessories", items: [["Monitors", "monitors"], ["Keyboards", "keyboards"], ["Mice", "mice"], ["Webcams", "webcams"], ["Printers", "printers"]] },
    ],
  },
  {
    id: "cat-electronics", name: "Electronics", slug: "electronics", sortOrder: 5,
    departments: [
      { name: "TV & Video", slug: "tv-video", items: [["Televisions", "televisions"], ["Projectors", "projectors"], ["Streaming Devices", "streaming-devices"], ["Blu-ray Players", "blu-ray-players"], ["TV Mounts", "tv-mounts"]] },
      { name: "Audio", slug: "audio", items: [["Headphones", "headphones"], ["Speakers", "speakers"], ["Earbuds", "earbuds"], ["Hi-Fi", "hi-fi"], ["DJ Equipment", "dj-equipment"]] },
      { name: "Cameras", slug: "cameras", items: [["DSLR", "dslr"], ["Mirrorless", "mirrorless"], ["Action Cameras", "action-cameras"], ["Lenses", "lenses"], ["Drones", "drones"]] },
      { name: "Smart Home", slug: "smart-home", items: [["Smart Speakers", "smart-speakers"], ["Security", "smart-security"], ["Lighting", "smart-lighting"], ["Thermostats", "thermostats"]] },
    ],
  },
  {
    id: "cat-gaming", name: "Gaming", slug: "gaming", sortOrder: 6,
    departments: [
      { name: "Consoles", slug: "consoles", items: [["PlayStation", "playstation"], ["Xbox", "xbox"], ["Nintendo", "nintendo"], ["Retro Consoles", "retro-consoles"]] },
      { name: "Games", slug: "video-games", items: [["Action", "action-games"], ["Sports", "sports-games"], ["RPG", "rpg-games"], ["Racing", "racing-games"], ["Indie", "indie-games"]] },
      { name: "Accessories", slug: "gaming-accessories", items: [["Controllers", "controllers"], ["Headsets", "gaming-headsets"], ["Chairs", "gaming-chairs"], ["Steering Wheels", "steering-wheels"]] },
      { name: "PC Gaming", slug: "pc-gaming", items: [["Games", "pc-games"], ["Peripherals", "gaming-peripherals"], ["VR", "gaming-vr"]] },
    ],
  },
  {
    id: "cat-home-garden", name: "Home & Garden", slug: "home-garden", sortOrder: 7,
    departments: [
      {
        name: "Furniture",
        slug: "furniture",
        items: [...FURNITURE_ITEMS],
        groups: [{ name: "Tables", slug: "tables", items: [...TABLE_TYPES] }],
      },
      { name: "Bedding", slug: "bedding", items: [...BEDDING_ITEMS, ...BEDDING_SIZES] },
      {
        name: "Home Textiles",
        slug: "home-textiles",
        items: [...HOME_TEXTILES_ITEMS],
        groups: [
          { name: "Curtains", slug: "curtains", items: [...CURTAIN_TYPES] },
          { name: "Blinds", slug: "blinds", items: [...BLIND_TYPES] },
        ],
      },
      { name: "Kitchen", slug: "kitchen", items: [...KITCHEN_ITEMS] },
      { name: "Bathroom", slug: "bathroom", items: [...BATHROOM_ITEMS] },
      { name: "Lighting", slug: "lighting", items: [["Ceiling Lights", "ceiling-lights"], ["Floor Lamps", "floor-lamps"], ["Wall Lights", "wall-lights"], ["LED Strips", "led-strips"]] },
      { name: "Storage", slug: "storage", items: [["Shelving", "shelving"], ["Boxes", "storage-boxes"], ["Wardrobe Systems", "wardrobe-systems"], ["Garage Storage", "garage-storage"]] },
      { name: "Decor", slug: "decor", items: [["Wall Art", "wall-art"], ["Mirrors", "decor-mirrors"], ["Candles", "candles"], ["Rugs", "rugs"], ["Curtains", "curtains"], ["Blinds", "blinds"]] },
      { name: "Garden", slug: "garden", items: [...GARDEN_ITEMS] },
    ],
  },
  {
    id: "cat-diy", name: "DIY", slug: "diy", sortOrder: 8,
    departments: [
      { name: "Building", slug: "building", items: [...DIY_ITEMS] },
      { name: "Painting", slug: "painting", items: [["Interior Paint", "interior-paint"], ["Exterior Paint", "exterior-paint"], ["Brushes", "brushes"], ["Rollers", "rollers"], ["Wallpaper", "wallpaper"]] },
      { name: "Plumbing", slug: "plumbing", items: [["Pipes", "pipes"], ["Fittings", "fittings"], ["Taps", "plumbing-taps"], ["Toilets", "toilets"], ["Sinks", "sinks"]] },
      { name: "Electrical", slug: "electrical", items: [["Cables", "cables"], ["Sockets", "sockets"], ["Switches", "switches"], ["Consumer Units", "consumer-units"]] },
    ],
  },
  {
    id: "cat-tools", name: "Tools", slug: "tools", sortOrder: 9,
    departments: [
      { name: "Power Tools", slug: "power-tools", items: [...POWER_TOOL_ITEMS], brands: TOOL_BRANDS },
      { name: "Hand Tools", slug: "hand-tools", items: [["Wrenches", "wrenches"], ["Screwdrivers", "screwdrivers"], ["Hammers", "hammers"], ["Pliers", "pliers"], ["Saws", "hand-saws"]] },
      { name: "Workshop", slug: "workshop", items: [["Workbenches", "workbenches"], ["Tool Storage", "tool-storage"], ["Safety Equipment", "safety-equipment"], ["Compressors", "compressors"]] },
      { name: "Garden Tools", slug: "garden-tools-dept", items: [["Lawn Mowers", "lawn-mowers"], ["Strimmers", "strimmers"], ["Hedge Trimmers", "hedge-trimmers"], ["Pressure Washers", "pressure-washers"]] },
    ],
  },
  {
    id: "cat-fashion-women", name: "Women's Fashion", slug: "womens-fashion", sortOrder: 10,
    departments: [
      { name: "Clothing", slug: "womens-clothing", items: [["Dresses", "dresses"], ["Tops", "tops"], ["Jeans", "womens-jeans"], ["Coats", "womens-coats"], ["Skirts", "skirts"], ...FASHION_SIZES] },
      { name: "Shoes", slug: "womens-shoes", items: [["Trainers", "womens-trainers"], ["Heels", "heels"], ["Boots", "womens-boots"], ["Sandals", "womens-sandals"], ["Flats", "flats"]] },
      { name: "Bags", slug: "womens-bags", items: [["Handbags", "handbags"], ["Totes", "totes"], ["Clutches", "clutches"], ["Backpacks", "womens-backpacks"]] },
      { name: "Accessories", slug: "womens-accessories", items: [["Scarves", "scarves"], ["Belts", "belts"], ["Hats", "hats"], ["Sunglasses", "sunglasses"]] },
      { name: "Luxury", slug: "womens-luxury", items: [...LUXURY_FASHION_ITEMS] },
    ],
  },
  {
    id: "cat-fashion-men", name: "Men's Fashion", slug: "mens-fashion", sortOrder: 11,
    departments: [
      { name: "Clothing", slug: "mens-clothing", items: [["Shirts", "shirts"], ["T-Shirts", "t-shirts"], ["Jeans", "mens-jeans"], ["Suits", "suits"], ["Coats", "mens-coats"], ...FASHION_SIZES] },
      { name: "Shoes", slug: "mens-shoes", items: [["Trainers", "mens-trainers"], ["Formal Shoes", "formal-shoes"], ["Boots", "mens-boots"], ["Sandals", "mens-sandals"]] },
      { name: "Bags", slug: "mens-bags", items: [["Backpacks", "mens-backpacks"], ["Briefcases", "briefcases"], ["Messenger Bags", "messenger-bags"]] },
      { name: "Accessories", slug: "mens-accessories", items: [["Ties", "ties"], ["Wallets", "wallets"], ["Belts", "mens-belts"], ["Cufflinks", "cufflinks"]] },
    ],
  },
  {
    id: "cat-fashion-kids", name: "Kids Fashion", slug: "kids-fashion", sortOrder: 12,
    departments: [
      { name: "Boys", slug: "boys-clothing", items: [["Tops", "boys-tops"], ["Trousers", "boys-trousers"], ["Outerwear", "boys-outerwear"], ["School Uniform", "boys-uniform"]] },
      { name: "Girls", slug: "girls-clothing", items: [["Dresses", "girls-dresses"], ["Tops", "girls-tops"], ["Trousers", "girls-trousers"], ["School Uniform", "girls-uniform"]] },
      { name: "Baby", slug: "baby-clothing", items: [["Bodysuits", "bodysuits"], ["Sleepwear", "sleepwear"], ["Outerwear", "baby-outerwear"], ["Accessories", "baby-accessories"]] },
      { name: "Shoes", slug: "kids-shoes", items: [["Trainers", "kids-trainers"], ["School Shoes", "school-shoes"], ["Boots", "kids-boots"], ["Sandals", "kids-sandals"]] },
    ],
  },
  {
    id: "cat-shoes", name: "Shoes", slug: "shoes", sortOrder: 13,
    departments: [
      { name: "Trainers", slug: "trainers", items: pairsFromNames(["Nike", "Adidas", "New Balance", "Puma", "Reebok", "Converse", "Vans"]) },
      { name: "Formal", slug: "formal-shoes", items: [["Oxford", "oxford"], ["Derby", "derby"], ["Loafers", "loafers"], ["Brogues", "brogues"]] },
      { name: "Boots", slug: "boots", items: [["Ankle Boots", "ankle-boots"], ["Chelsea Boots", "chelsea-boots"], ["Work Boots", "work-boots"], ["Hiking Boots", "hiking-boots"]] },
      { name: "Specialist", slug: "specialist-shoes", items: [["Running", "running-shoes"], ["Football", "football-boots"], ["Dance", "dance-shoes"], ["Safety", "safety-shoes"]] },
    ],
  },
  {
    id: "cat-jewellery", name: "Jewellery", slug: "jewellery", sortOrder: 14,
    departments: [
      { name: "Rings", slug: "rings", items: [["Engagement", "engagement-rings"], ["Wedding", "wedding-rings"], ["Fashion", "fashion-rings"], ["Signet", "signet-rings"]] },
      { name: "Necklaces", slug: "necklaces", items: [["Gold", "gold-necklaces"], ["Silver", "silver-necklaces"], ["Pendants", "pendants"], ["Chains", "chains"]] },
      { name: "Watches", slug: "watches", items: pairsFromNames(["Rolex", "Omega", "Tag Heuer", "Seiko", "Casio", "Apple Watch", "Garmin"]) },
      { name: "Earrings & Bracelets", slug: "earrings-bracelets", items: [["Studs", "studs"], ["Hoops", "hoops"], ["Bangles", "bangles"], ["Charm Bracelets", "charm-bracelets"]] },
    ],
  },
  {
    id: "cat-beauty", name: "Beauty", slug: "beauty", sortOrder: 15,
    departments: [
      { name: "Skincare", slug: "skincare", items: [["Moisturisers", "moisturisers"], ["Serums", "serums"], ["Cleansers", "cleansers"], ["Sun Care", "sun-care"]] },
      { name: "Makeup", slug: "makeup", items: [["Foundation", "foundation"], ["Lipstick", "lipstick"], ["Mascara", "mascara"], ["Eyeshadow", "eyeshadow"]] },
      { name: "Hair", slug: "hair", items: [["Shampoo", "shampoo"], ["Styling", "hair-styling"], ["Colour", "hair-colour"], ["Tools", "hair-tools"]] },
      { name: "Fragrance", slug: "fragrance", items: [["Perfume", "perfume"], ["Aftershave", "aftershave"], ["Body Spray", "body-spray"]] },
    ],
  },
  {
    id: "cat-health", name: "Health", slug: "health", sortOrder: 16,
    departments: [
      { name: "Wellness", slug: "wellness", items: [["Supplements", "supplements"], ["Vitamins", "vitamins"], ["Protein", "protein"], ["Herbal", "herbal"]] },
      { name: "Medical", slug: "medical", items: [["Mobility", "mobility"], ["Monitoring", "monitoring"], ["First Aid", "first-aid"], ["Supports", "supports"]] },
      { name: "Personal Care", slug: "personal-care", items: [["Oral Care", "oral-care"], ["Shaving", "shaving"], ["Hygiene", "hygiene"], ["Incontinence", "incontinence"]] },
      { name: "Optical", slug: "optical", items: [["Glasses", "glasses"], ["Contact Lenses", "contact-lenses"], ["Reading Glasses", "reading-glasses"]] },
    ],
  },
  {
    id: "cat-baby", name: "Baby", slug: "baby", sortOrder: 17,
    departments: [
      { name: "Nursery", slug: "nursery", items: [["Cots", "cots"], ["Changing", "changing"], ["Monitors", "baby-monitors"], ["Bedding", "baby-bedding"]] },
      { name: "Pushchairs", slug: "pushchairs", items: [["Prams", "prams"], ["Travel Systems", "travel-systems"], ["Accessories", "pushchair-accessories"]] },
      { name: "Feeding", slug: "feeding", items: [["Bottles", "bottles"], ["Breast Pumps", "breast-pumps"], ["High Chairs", "high-chairs"], ["Sterilisers", "sterilisers"]] },
      { name: "Toys", slug: "baby-toys", items: [["Soft Toys", "soft-toys"], ["Activity", "baby-activity"], ["Bath Toys", "bath-toys"]] },
    ],
  },
  {
    id: "cat-pets", name: "Pets", slug: "pets", sortOrder: 18,
    departments: [
      { name: "Dogs", slug: "dogs", items: [["Food", "dog-food"], ["Beds", "dog-beds"], ["Toys", "dog-toys"], ["Collars", "dog-collars"], ["Grooming", "dog-grooming"]] },
      { name: "Cats", slug: "cats", items: [["Food", "cat-food"], ["Beds", "cat-beds"], ["Toys", "cat-toys"], ["Litter", "cat-litter"], ["Scratchers", "scratchers"]] },
      { name: "Other Pets", slug: "other-pets", items: [...PET_TYPES.slice(2)] },
      { name: "Pet Services", slug: "pet-services", items: [["Grooming", "pet-grooming"], ["Walking", "dog-walking"], ["Boarding", "pet-boarding"]] },
    ],
  },
  {
    id: "cat-sports", name: "Sports", slug: "sports", sortOrder: 19,
    departments: [
      { name: "Equipment", slug: "sports-equipment", items: [...SPORT_TYPES] },
      { name: "Fitness", slug: "fitness", items: [...GYM_EQUIPMENT_ITEMS] },
      { name: "Outdoor", slug: "outdoor-sports", items: [["Camping", "camping"], ["Hiking", "hiking"], ["Climbing", "climbing"], ["Fishing", "fishing"], ["Cycling", "cycling"]] },
      { name: "Team Sports", slug: "team-sports", items: [["Football Kits", "football-kits"], ["Rugby", "rugby-kit"], ["Cricket", "cricket-kit"], ["Hockey", "hockey"]] },
    ],
  },
  {
    id: "cat-cycling", name: "Cycling", slug: "cycling", sortOrder: 20,
    departments: [
      { name: "Bikes", slug: "bikes", items: [["Road", "road-bikes"], ["Mountain", "mountain-bikes"], ["Hybrid", "hybrid-bikes"], ["Electric", "electric-bikes"], ["BMX", "bmx"]] },
      { name: "Parts", slug: "bike-parts", items: [["Wheels", "wheels"], ["Tyres", "tyres"], ["Chains", "bike-chains"], ["Brakes", "brakes"]] },
      { name: "Accessories", slug: "cycling-accessories", items: [["Helmets", "helmets"], ["Lights", "bike-lights"], ["Locks", "bike-locks"], ["Bags", "cycling-bags"]] },
      { name: "Clothing", slug: "cycling-clothing", items: [["Jerseys", "jerseys"], ["Shorts", "cycling-shorts"], ["Jackets", "cycling-jackets"], ["Gloves", "cycling-gloves"]] },
    ],
  },
  {
    id: "cat-books", name: "Books", slug: "books", sortOrder: 21,
    departments: [
      { name: "Fiction", slug: "fiction", items: BOOK_GENRES.slice(0, 6) },
      { name: "Non-Fiction", slug: "non-fiction", items: BOOK_GENRES.slice(6) },
      { name: "Academic", slug: "academic", items: [["Textbooks", "textbooks"], ["Study Guides", "study-guides"], ["Reference", "reference"], ["Language", "language-books"]] },
      { name: "Comics & Manga", slug: "comics", items: [["Marvel", "marvel"], ["DC", "dc"], ["Manga", "manga"], ["Graphic Novels", "graphic-novels"]] },
    ],
  },
  {
    id: "cat-music", name: "Music", slug: "music", sortOrder: 22,
    departments: [
      { name: "Instruments", slug: "instruments", items: [["Guitars", "guitars"], ["Keyboards", "keyboards"], ["Drums", "drums"], ["Violins", "violins"], ["Brass", "brass"]] },
      { name: "Vinyl & CDs", slug: "vinyl-cds", items: [["Vinyl", "vinyl"], ["CDs", "cds"], ["Cassettes", "cassettes"], ["Box Sets", "music-box-sets"]] },
      { name: "DJ & Studio", slug: "dj-studio", items: [["Controllers", "controllers"], ["Microphones", "microphones"], ["Mixers", "mixers"], ["Studio Monitors", "studio-monitors"]] },
      { name: "Sheet Music", slug: "sheet-music", items: [["Classical", "classical-sheet"], ["Pop", "pop-sheet"], ["Jazz", "jazz-sheet"]] },
    ],
  },
  {
    id: "cat-movies", name: "Movies", slug: "movies", sortOrder: 23,
    departments: [
      { name: "Blu-ray", slug: "blu-ray", items: [["Action", "action-films"], ["Drama", "drama-films"], ["Comedy", "comedy-films"], ["Horror", "horror-films"]] },
      { name: "DVD", slug: "dvd", items: [["Box Sets", "dvd-box-sets"], ["Kids", "kids-films"], ["Documentary", "documentary-films"]] },
      { name: "Collectibles", slug: "movie-collectibles", items: [["Posters", "posters"], ["Merchandise", "film-merchandise"], ["Limited Editions", "limited-editions-film"]] },
      { name: "4K UHD", slug: "4k-uhd", items: [["New Releases", "new-releases-4k"], ["Classics", "classics-4k"], ["Box Sets", "4k-box-sets"]] },
    ],
  },
  {
    id: "cat-collectibles", name: "Collectables", slug: "collectibles", sortOrder: 24,
    departments: [
      { name: "Trading Cards", slug: "trading-cards", items: [["Pokemon", "pokemon"], ["Magic", "magic"], ["Sports Cards", "sports-cards"], ["Yu-Gi-Oh", "yu-gi-oh"]] },
      { name: "Vintage", slug: "vintage", items: COLLECTIBLE_TYPES.slice(0, 4) },
      { name: "Memorabilia", slug: "memorabilia", items: COLLECTIBLE_TYPES.slice(4) },
      { name: "Figurines", slug: "figurines", items: [["Funko Pop", "funko-pop"], ["Action Figures", "action-figures"], ["Model Kits", "model-kits"]] },
    ],
  },
  {
    id: "cat-toys", name: "Toys", slug: "toys", sortOrder: 25,
    departments: [
      { name: "Building", slug: "building-toys", items: [["LEGO", "lego"], ["Duplo", "duplo"], ["Magnetic Tiles", "magnetic-tiles"]] },
      { name: "Games", slug: "toy-games", items: [["Board Games", "board-games"], ["Puzzles", "puzzles"], ["Card Games", "card-games"]] },
      { name: "Outdoor", slug: "outdoor-toys", items: [["Scooters", "scooters"], ["Trampolines", "trampolines"], ["Playhouses", "playhouses"], ["Water Toys", "water-toys"]] },
      { name: "Educational", slug: "educational-toys", items: [["STEM", "stem-toys"], ["Arts & Crafts", "arts-crafts"], ["Musical", "musical-toys"]] },
    ],
  },
  {
    id: "cat-office", name: "Office", slug: "office", sortOrder: 26,
    departments: [
      { name: "Furniture", slug: "office-furniture", items: [["Desks", "desks"], ["Chairs", "office-chairs"], ["Storage", "office-storage"], ["Meeting Tables", "meeting-tables"]] },
      { name: "Supplies", slug: "supplies", items: [["Stationery", "stationery"], ["Paper", "paper"], ["Ink", "ink"], ["Folders", "folders"]] },
      { name: "Technology", slug: "office-technology", items: [["Printers", "office-printers"], ["Monitors", "office-monitors"], ["Shredders", "shredders"], ["Scanners", "scanners"]] },
      { name: "Commercial", slug: "commercial-office", items: [["Retail Fittings", "retail-fittings"], ["Signage", "signage"], ["Safes", "safes"]] },
    ],
  },
  {
    id: "cat-business", name: "Business", slug: "business", sortOrder: 27,
    departments: [
      { name: "Equipment", slug: "business-equipment", items: [["Catering", "catering-equipment"], ["Salon", "salon-equipment"], ["Medical", "medical-equipment"], ["Retail", "retail-equipment"]] },
      { name: "Inventory", slug: "inventory", items: [["Stock", "stock"], ["Wholesale", "wholesale"], ["Clearance", "clearance-stock"]] },
      { name: "Franchise", slug: "franchise", items: [["Opportunities", "franchise-opportunities"], ["Licences", "licences"], ["Partnerships", "partnerships"]] },
      { name: "Business for Sale", slug: "business-for-sale", items: [["Retail", "retail-business"], ["Online", "online-business"], ["Hospitality", "hospitality-business"]] },
    ],
  },
  {
    id: "cat-industrial", name: "Industrial", slug: "industrial", sortOrder: 28,
    departments: [
      { name: "Machinery", slug: "machinery", items: [["Manufacturing", "manufacturing"], ["Packaging", "packaging-machinery"], ["Processing", "processing"]] },
      { name: "Safety", slug: "safety", items: [["PPE", "ppe"], ["Signage", "safety-signage"], ["First Aid", "industrial-first-aid"]] },
      { name: "Materials", slug: "materials", items: [["Metals", "metals"], ["Plastics", "plastics"], ["Chemicals", "chemicals"]] },
      { name: "Warehouse", slug: "warehouse", items: [["Racking", "racking"], ["Pallet Trucks", "pallet-trucks"], ["Conveyors", "conveyors"]] },
      { name: "Construction", slug: "construction", items: [...CONSTRUCTION_ITEMS] },
    ],
  },
  {
    id: "cat-agriculture", name: "Agriculture", slug: "agriculture", sortOrder: 29,
    departments: [
      { name: "Farm Equipment", slug: "farm-equipment", items: [["Tractors", "tractors"], ["Implements", "implements"], ["Trailers", "trailers"], ["Harvesters", "harvesters"]] },
      { name: "Livestock", slug: "livestock", items: [["Feed", "animal-feed"], ["Supplies", "livestock-supplies"], ["Fencing", "fencing"]] },
      { name: "Produce", slug: "produce", items: [["Seeds", "farm-seeds"], ["Plants", "farm-plants"], ["Harvest", "harvest"]] },
      { name: "Equestrian", slug: "equestrian", items: [["Saddles", "saddles"], ["Riding Wear", "riding-wear"], ["Stable Equipment", "stable-equipment"]] },
    ],
  },
  {
    id: "cat-jobs", name: "Jobs", slug: "jobs", sortOrder: 30,
    departments: [
      { name: "Full Time", slug: "full-time", items: JOB_SECTORS },
      { name: "Part Time", slug: "part-time", items: JOB_SECTORS },
      { name: "Freelance", slug: "freelance", items: [["Design", "design-freelance"], ["Development", "development-freelance"], ["Marketing", "marketing-freelance"], ["Writing", "writing-freelance"]] },
      { name: "Apprenticeships", slug: "apprenticeships", items: [["Trades", "trade-apprenticeships"], ["IT", "it-apprenticeships"], ["Healthcare", "healthcare-apprenticeships"]] },
    ],
  },
  {
    id: "cat-services", name: "Services", slug: "services", sortOrder: 31,
    departments: [
      { name: "Home Services", slug: "home-services", items: SERVICE_TYPES },
      { name: "Professional", slug: "professional-services", items: [["Legal", "legal"], ["Accounting", "accounting"], ["Consulting", "consulting"], ["Marketing", "marketing-services"]] },
      { name: "Creative", slug: "creative-services", items: [["Design", "design-services"], ["Video", "video-services"], ["Music Lessons", "music-lessons"]] },
      { name: "Events", slug: "event-services", items: [["Catering", "event-catering"], ["DJ", "dj-services"], ["Photography", "event-photography"]] },
    ],
  },
  {
    id: "cat-food", name: "Food", slug: "food", sortOrder: 32,
    departments: [
      { name: "Groceries", slug: "groceries", items: [["Pantry", "pantry"], ["Fresh", "fresh-food"], ["Frozen", "frozen-food"], ["Organic", "organic-food"]] },
      { name: "Speciality", slug: "speciality-food", items: [["International", "international-food"], ["Artisan", "artisan-food"], ["Gluten Free", "gluten-free"], ["Vegan", "vegan-food"]] },
      { name: "Beverages", slug: "beverages", items: [["Coffee", "coffee"], ["Tea", "tea"], ["Soft Drinks", "soft-drinks"], ["Alcohol", "alcohol"]] },
      { name: "Equipment", slug: "food-equipment", items: [["Bakeware", "bakeware"], ["Preserving", "preserving"], ["BBQ", "food-bbq"]] },
    ],
  },
  {
    id: "cat-tickets", name: "Tickets", slug: "tickets", sortOrder: 33,
    departments: [
      { name: "Concerts", slug: "concerts", items: [["Pop", "pop-concerts"], ["Rock", "rock-concerts"], ["Classical", "classical-concerts"], ["Festivals", "festivals"]] },
      { name: "Sports Events", slug: "sports-events", items: [["Football", "football-tickets"], ["Rugby", "rugby-tickets"], ["Motorsport", "motorsport-tickets"], ["Tennis", "tennis-tickets"]] },
      { name: "Theatre", slug: "theatre", items: [["Musicals", "musicals"], ["Comedy", "comedy-shows"], ["Drama", "drama-shows"]] },
      { name: "Travel", slug: "travel-tickets", items: [["Flights", "flight-tickets"], ["Trains", "train-tickets"], ["Attractions", "attraction-tickets"]] },
    ],
  },
  {
    id: "cat-travel", name: "Travel", slug: "travel", sortOrder: 34,
    departments: [
      { name: "Holidays", slug: "holidays", items: [["Package Holidays", "package-holidays"], ["City Breaks", "city-breaks"], ["Beach", "beach-holidays"], ["Ski", "ski-holidays"]] },
      { name: "Flights", slug: "flights", items: [["Domestic", "domestic-flights"], ["International", "international-flights"], ["Charter", "charter-flights"]] },
      { name: "Accommodation", slug: "accommodation", items: [["Hotels", "hotels"], ["Apartments", "holiday-apartments"], ["Cottages", "cottages"], ["Hostels", "hostels"]] },
      { name: "Luggage", slug: "luggage", items: [["Suitcases", "suitcases"], ["Backpacks", "travel-backpacks"], ["Travel Accessories", "travel-accessories"]] },
    ],
  },
  {
    id: "cat-events", name: "Events", slug: "events", sortOrder: 35,
    departments: [
      { name: "Weddings", slug: "weddings", items: [["Venues", "wedding-venues"], ["Catering", "wedding-catering"], ["Photography", "wedding-photography"], ["Dresses", "wedding-dresses"]] },
      { name: "Parties", slug: "parties", items: [["Birthday", "birthday-parties"], ["Corporate", "corporate-events"], ["Kids", "kids-parties"]] },
      { name: "Community", slug: "community-events", items: [["Markets", "markets"], ["Festivals", "community-festivals"], ["Meetups", "meetups"]] },
      { name: "Equipment Hire", slug: "equipment-hire", items: [["Marquees", "marquees"], ["AV", "av-hire"], ["Furniture Hire", "furniture-hire"]] },
    ],
  },
  {
    id: "cat-free-stuff", name: "Free Stuff", slug: "free-stuff", sortOrder: 36,
    departments: [
      { name: "Free Items", slug: "free-items", items: [["Household", "free-household"], ["Clothing", "free-clothing"], ["Electronics", "free-electronics"], ["Furniture", "free-furniture"]] },
      { name: "Free to Collect", slug: "free-to-collect", items: [["Local Pickup", "local-pickup-free"], ["Community", "community-free"]] },
      { name: "Free Cycle", slug: "free-cycle", items: [["Give Away", "give-away"], ["Swap", "swap"]] },
    ],
  },
  {
    id: "cat-everything-else", name: "Everything Else", slug: "everything-else", sortOrder: 37,
    departments: [
      { name: "Miscellaneous", slug: "miscellaneous", items: [["General", "general"], ["Unsorted", "unsorted"], ["Bundles", "bundles"], ["Job Lots", "job-lots"]] },
      { name: "Lost & Found", slug: "lost-found", items: [["Lost", "lost"], ["Found", "found"]] },
      { name: "Other", slug: "other", items: [["Uncategorised", "uncategorised"]] },
    ],
  },
  {
    id: "cat-camping", name: "Camping", slug: "camping", sortOrder: 38,
    departments: [
      { name: "Tents", slug: "tents", items: [["Family Tents", "family-tents"], ["Backpacking", "backpacking-tents"], ["Pop Up", "pop-up-tents"], ["Awnings", "awnings"], ...TENT_ACCESSORY_ITEMS] },
      { name: "Sleeping", slug: "camping-sleeping", items: [["Sleeping Bags", "sleeping-bags"], ["Camp Beds", "camp-beds"], ["Mats", "camping-mats"], ["Pillows", "camping-pillows"]] },
      { name: "Cooking", slug: "camping-cooking", items: [["Stoves", "camping-stoves"], ["Cool Boxes", "cool-boxes"], ["Cookware", "camping-cookware"], ["Kettles", "camping-kettles"]] },
      { name: "Gear", slug: "camping-gear", items: [["Backpacks", "camping-backpacks"], ["Lighting", "camping-lighting"], ["Furniture", "camping-furniture"], ["Tools", "camping-equipment"]] },
    ],
  },
  {
    id: "cat-fishing", name: "Fishing", slug: "fishing", sortOrder: 39,
    departments: [
      { name: "Rods", slug: "fishing-rods", items: [["Coarse", "coarse-rods"], ["Fly", "fly-rods"], ["Sea", "sea-rods"], ["Travel", "travel-rods"]] },
      { name: "Reels", slug: "fishing-reels", items: [["Fixed Spool", "fixed-spool"], ["Multiplier", "multiplier-reels"], ["Fly Reels", "fly-reels"]] },
      { name: "Tackle", slug: "fishing-tackle", items: [["Lures", "lures"], ["Hooks", "hooks"], ["Lines", "fishing-lines"], ["Boxes", "tackle-boxes"]] },
      { name: "Clothing", slug: "fishing-clothing", items: [["Waders", "waders"], ["Jackets", "fishing-jackets"], ["Boots", "fishing-boots"]] },
    ],
  },
  {
    id: "cat-antiques", name: "Antiques", slug: "antiques", sortOrder: 40,
    departments: [
      { name: "Furniture", slug: "antique-furniture", items: [["Tables", "antique-tables"], ["Chairs", "antique-chairs"], ["Cabinets", "antique-cabinets"], ["Desks", "antique-desks"]] },
      { name: "Collectables", slug: "antique-collectables", items: [["Clocks", "antique-clocks"], ["Mirrors", "antique-mirrors"], ["Glass", "antique-glass"], ["Pottery", "antique-pottery"]] },
      { name: "Jewellery", slug: "antique-jewellery", items: [["Rings", "antique-rings"], ["Brooches", "antique-brooches"], ["Necklaces", "antique-necklaces"]] },
      { name: "Art", slug: "antique-art", items: [["Paintings", "antique-paintings"], ["Prints", "antique-prints"], ["Sculpture", "antique-sculpture"]] },
    ],
  },
  {
    id: "cat-art-crafts", name: "Art & Crafts", slug: "art-crafts", sortOrder: 41,
    departments: [
      { name: "Painting", slug: "art-painting", items: [["Acrylics", "acrylics"], ["Oils", "oils"], ["Watercolour", "watercolour"], ["Canvases", "canvases"]] },
      { name: "Drawing", slug: "drawing", items: [["Pencils", "pencils"], ["Markers", "markers"], ["Charcoal", "charcoal"], ["Sketchbooks", "sketchbooks"]] },
      { name: "Craft Supplies", slug: "craft-supplies", items: [["Yarn", "yarn"], ["Fabric", "fabric"], ["Beads", "beads"], ["Scrapbooking", "scrapbooking"]] },
      { name: "Handmade", slug: "handmade", items: [["Cards", "handmade-cards"], ["Candles", "handmade-candles"], ["Soap", "handmade-soap"], ["Jewellery", "handmade-jewellery"]] },
    ],
  },
  {
    id: "cat-car-parts", name: "Car Parts", slug: "car-parts", sortOrder: 42,
    departments: [
      { name: "Engine", slug: "engine-parts", items: [["Filters", "filters"], ["Belts", "belts"], ["Gaskets", "gaskets"], ["Turbo", "turbo"]] },
      { name: "Body", slug: "body-parts", items: [["Bumpers", "bumpers"], ["Mirrors", "car-mirrors"], ["Panels", "panels"], ["Lights", "car-lights"]] },
      { name: "Exterior", slug: "exterior-parts", items: [...VEHICLE_EXTERIOR_ITEMS] },
      { name: "Interior", slug: "interior-parts", items: [["Bench Seats", "car-bench-seats"], ["Seats", "car-seats"], ["Seat Covers", "car-seat-covers"], ["Dashboards", "dashboards"], ["Steering Wheels", "steering-wheels"], ["Floor Mats", "car-floor-mats"], ["Boot Liners", "car-boot-liners"], ["Roof Boxes", "car-roof-boxes"], ["Mirrors", "car-mirrors"]] },
      { name: "Wheels & Tyres", slug: "wheels-tyres", items: [["Alloy Wheels", "alloy-wheels"], ["Tyres", "tyres"], ["Steel Wheels", "steel-wheels"]] },
    ],
  },
  {
    id: "cat-appliances", name: "Appliances", slug: "appliances", sortOrder: 43,
    departments: [
      { name: "Kitchen", slug: "kitchen-appliances", items: [["Fridges", "fridges"], ["Freezers", "freezers"], ["Ovens", "ovens"], ["Dishwashers", "dishwashers"], ["Microwaves", "microwaves"]] },
      { name: "Laundry", slug: "laundry", items: [["Washing Machines", "washing-machines"], ["Dryers", "dryers"], ["Ironing", "ironing"]] },
      { name: "Cleaning", slug: "cleaning-appliances", items: [["Vacuum Cleaners", "vacuum-cleaners"], ["Steam Cleaners", "steam-cleaners"], ["Carpet Cleaners", "carpet-cleaners"]] },
      { name: "Climate", slug: "climate", items: [["Air Conditioning", "air-conditioning"], ["Fans", "fans"], ["Dehumidifiers", "dehumidifiers"], ["Heaters", "heaters"]] },
    ],
  },
  {
    id: "cat-bags", name: "Bags", slug: "bags", sortOrder: 44,
    departments: [
      { name: "Handbags", slug: "handbags-dept", items: pairsFromNames(["Coach", "Michael Kors", "Ted Baker", "Radley", "Mulberry"]) },
      { name: "Backpacks", slug: "backpacks", items: [["School", "school-backpacks"], ["Travel", "travel-backpacks"], ["Laptop", "laptop-backpacks"], ["Hiking", "hiking-backpacks"]] },
      { name: "Luggage", slug: "luggage-dept", items: [["Suitcases", "suitcases-dept"], ["Holdalls", "holdalls"], ["Cabin Bags", "cabin-bags"]] },
      { name: "Sports Bags", slug: "sports-bags", items: [["Gym Bags", "gym-bags"], ["Boot Bags", "boot-bags"], ["Racket Bags", "racket-bags"]] },
    ],
  },
  {
    id: "cat-wedding", name: "Wedding", slug: "wedding", sortOrder: 45,
    departments: [
      { name: "Dresses", slug: "wedding-dresses", items: [["Bridal", "bridal-dresses"], ["Bridesmaid", "bridesmaid-dresses"], ["Mother of Bride", "mob-dresses"], ["Accessories", "wedding-accessories"]] },
      { name: "Suits", slug: "wedding-suits", items: [["Morning Suits", "morning-suits"], ["Tuxedos", "tuxedos"], ["Waistcoats", "waistcoats"]] },
      { name: "Decor", slug: "wedding-decor", items: [["Centrepieces", "centrepieces"], ["Tableware", "wedding-tableware"], ["Favours", "favours"], ["Signage", "wedding-signage"]] },
      { name: "Services", slug: "wedding-services", items: [["Photography", "wedding-photo"], ["Catering", "wedding-caterers"], ["Venues", "wedding-venue-hire"]] },
    ],
  },
  {
    id: "cat-party", name: "Party Supplies", slug: "party-supplies", sortOrder: 46,
    departments: [
      { name: "Decorations", slug: "party-decorations", items: [["Balloons", "balloons"], ["Banners", "banners"], ["Confetti", "confetti"], ["Lights", "party-lights"]] },
      { name: "Tableware", slug: "party-tableware", items: [["Plates", "party-plates"], ["Cups", "party-cups"], ["Napkins", "napkins"], ["Cutlery", "party-cutlery"]] },
      { name: "Costumes", slug: "costumes", items: [["Adult", "adult-costumes"], ["Kids", "kids-costumes"], ["Accessories", "costume-accessories"]] },
      { name: "Cake", slug: "party-cake", items: [["Toppers", "cake-toppers"], ["Stands", "cake-stands"], ["Candles", "cake-candles"]] },
    ],
  },
  {
    id: "cat-security", name: "Home Security", slug: "home-security", sortOrder: 47,
    departments: [
      { name: "Cameras", slug: "security-cameras", items: [["Indoor", "indoor-cameras"], ["Outdoor", "outdoor-cameras"], ["Doorbells", "video-doorbells"], ["Systems", "cctv-systems"]] },
      { name: "Alarms", slug: "alarms", items: [["Burglar Alarms", "burglar-alarms"], ["Smoke Alarms", "smoke-alarms"], ["CO Alarms", "co-alarms"]] },
      { name: "Locks", slug: "locks", items: [["Smart Locks", "smart-locks"], ["Padlocks", "padlocks"], ["Door Locks", "door-locks"]] },
      { name: "Safes", slug: "safes", items: [["Home Safes", "home-safes"], ["Fireproof", "fireproof-safes"], ["Gun Safes", "gun-safes"]] },
    ],
  },
  {
    id: "cat-stamps-coins", name: "Stamps & Coins", slug: "stamps-coins", sortOrder: 48,
    departments: [
      { name: "Stamps", slug: "stamps", items: [["British", "british-stamps"], ["World", "world-stamps"], ["Collections", "stamp-collections"], ["Albums", "stamp-albums"]] },
      { name: "Coins", slug: "coins", items: [["British", "british-coins"], ["Gold", "gold-coins"], ["Silver", "silver-coins"], ["Ancient", "ancient-coins"]] },
      { name: "Banknotes", slug: "banknotes", items: [["British", "british-notes"], ["World", "world-notes"], ["Error Notes", "error-notes"]] },
      { name: "Supplies", slug: "collecting-supplies", items: [["Holders", "coin-holders"], ["Magnifiers", "magnifiers"], ["Scales", "scales"]] },
    ],
  },
  {
    id: "cat-outdoor-living", name: "Outdoor Living", slug: "outdoor-living", sortOrder: 49,
    departments: [
      { name: "Patio", slug: "patio", items: [["Dining Sets", "patio-dining"], ["Sofas", "outdoor-sofas"], ["Umbrellas", "parasols"], ["Heaters", "outdoor-heaters"]] },
      { name: "BBQ", slug: "outdoor-bbq", items: [["Gas BBQ", "gas-bbq"], ["Charcoal BBQ", "charcoal-bbq"], ["Smokers", "smokers"], ["Accessories", "bbq-accessories"]] },
      { name: "Hot Tubs", slug: "hot-tubs", items: [["Inflatable", "inflatable-hot-tubs"], ["Hard Shell", "hard-shell-hot-tubs"], ["Accessories", "hot-tub-accessories"]] },
      { name: "Pools", slug: "pools", items: [["Above Ground", "above-ground-pools"], ["Paddling Pools", "paddling-pools"], ["Covers", "pool-covers"]] },
    ],
  },
  {
    id: "cat-maternity", name: "Maternity", slug: "maternity", sortOrder: 50,
    departments: [
      { name: "Clothing", slug: "maternity-clothing", items: [["Dresses", "maternity-dresses"], ["Tops", "maternity-tops"], ["Jeans", "maternity-jeans"], ["Coats", "maternity-coats"]] },
      { name: "Nursing", slug: "nursing", items: [["Bras", "nursing-bras"], ["Tops", "nursing-tops"], ["Pillows", "nursing-pillows"]] },
      { name: "Accessories", slug: "maternity-accessories", items: [["Support Belts", "support-belts"], ["Bags", "maternity-bags"]] },
    ],
  },
  {
    id: "cat-craft-beer", name: "Craft & Hobby", slug: "craft-hobby", sortOrder: 51,
    departments: [
      { name: "Model Making", slug: "model-making", items: [["Aircraft", "model-aircraft"], ["Cars", "model-cars"], ["Railways", "model-railways"], ["Ships", "model-ships"]] },
      { name: "RC", slug: "rc", items: [["Cars", "rc-cars"], ["Planes", "rc-planes"], ["Boats", "rc-boats"], ["Drones", "hobby-drones"]] },
      { name: "Sewing", slug: "sewing", items: [["Machines", "sewing-machines"], ["Patterns", "patterns"], ["Fabric", "sewing-fabric"], ["Notions", "notions"]] },
      { name: "Knitting", slug: "knitting", items: [["Wool", "wool"], ["Needles", "needles"], ["Patterns", "knitting-patterns"]] },
    ],
  },
  {
    id: "cat-musical", name: "Musical Instruments", slug: "musical-instruments", sortOrder: 52,
    departments: [
      { name: "Guitars", slug: "guitars-dept", items: [["Acoustic", "acoustic-guitars"], ["Electric", "electric-guitars"], ["Bass", "bass-guitars"], ["Classical", "classical-guitars"]] },
      { name: "Keyboards", slug: "keyboards-dept", items: [["Digital Pianos", "digital-pianos"], ["Synthesizers", "synthesizers"], ["MIDI", "midi-keyboards"]] },
      { name: "Drums", slug: "drums-dept", items: [["Acoustic Kits", "acoustic-kits"], ["Electronic Kits", "electronic-kits"], ["Cymbals", "cymbals"], ["Snares", "snares"]] },
      { name: "Wind & Strings", slug: "wind-strings", items: [["Violins", "violins"], ["Saxophones", "saxophones"], ["Flutes", "flutes"], ["Trumpets", "trumpets"]] },
    ],
  },
  {
    id: "cat-photo", name: "Photo & Video", slug: "photo-video", sortOrder: 53,
    departments: [
      { name: "Cameras", slug: "photo-cameras", groups: [{ name: "Cameras", slug: "cameras", items: [...PHOTOGRAPHY_ITEMS] }] },
      { name: "Lenses", slug: "photo-lenses", items: [["Prime", "prime-lenses"], ["Zoom", "zoom-lenses"], ["Macro", "macro-lenses"], ["Telephoto", "telephoto-lenses"]] },
      { name: "Video", slug: "video-equipment", items: [["Camcorders", "camcorders"], ["Cinema Cameras", "cinema-cameras"], ["Gimbals", "gimbals"], ["Lighting", "video-lighting"]] },
      { name: "Accessories", slug: "photo-accessories", items: [["Tripods", "tripods"], ["Bags", "camera-bags"], ["Filters", "lens-filters"], ["Memory Cards", "memory-cards"]] },
    ],
  },
  {
    id: "cat-smart-home", name: "Smart Home", slug: "smart-home", sortOrder: 54,
    departments: [
      { name: "Speakers", slug: "smart-speakers", items: pairsFromNames(["Amazon Echo", "Google Nest", "Apple HomePod"]) },
      { name: "Lighting", slug: "smart-lighting-dept", items: [["Bulbs", "smart-bulbs"], ["Strips", "smart-strips"], ["Switches", "smart-switches"]] },
      { name: "Security", slug: "smart-security", items: [["Cameras", "smart-cameras"], ["Doorbells", "smart-doorbells"], ["Sensors", "smart-sensors"]] },
      { name: "Climate", slug: "smart-climate", items: [["Thermostats", "smart-thermostats"], ["Radiator Valves", "smart-valves"], ["Air Quality", "air-quality-monitors"]] },
    ],
  },
  {
    id: "cat-tv-audio", name: "TV & Audio", slug: "tv-audio", sortOrder: 55,
    departments: [
      { name: "Televisions", slug: "televisions-dept", items: [["OLED", "oled-tvs"], ["QLED", "qled-tvs"], ["LED", "led-tvs"], ["Smart TVs", "smart-tvs"]] },
      { name: "Audio", slug: "tv-audio-dept", items: [["Soundbars", "soundbars"], ["AV Receivers", "av-receivers"], ["Subwoofers", "subwoofers"], ["Turntables", "turntables"]] },
      { name: "Headphones", slug: "headphones-dept", items: [["Over Ear", "over-ear"], ["In Ear", "in-ear"], ["Noise Cancelling", "noise-cancelling"], ["Wireless", "wireless-headphones"]] },
      { name: "Accessories", slug: "tv-accessories", items: [["Wall Mounts", "wall-mounts"], ["Cables", "av-cables"], ["Remote Controls", "remote-controls"]] },
    ],
  },
];
