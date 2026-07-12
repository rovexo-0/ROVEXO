/**
 * Category-group product type seeds — massive deterministic expansion.
 * Each entry generates product types for a category group.
 */

export type CategorySeedConfig = {
  name: string;
  path: readonly string[];
  bases?: readonly string[];
};

/** Generate bases from a name list for a vertical. */
function bases(...names: string[]): readonly string[] {
  return names;
}

export const PRODUCT_TYPE_CATEGORY_SEEDS: Record<string, CategorySeedConfig> = {
  // Home & Garden — Furniture
  sofas: { name: "Sofas", path: ["home-garden", "furniture", "sofas"], bases: bases(
    "Corner Sofa", "Two Seater Sofa", "Three Seater Sofa", "Sofa Bed", "Modular Sofa",
    "Chesterfield Sofa", "Recliner Sofa", "Loveseat", "Chaise Sofa", "Sectional Sofa",
    "Leather Sofa", "Fabric Sofa", "Velvet Sofa", "Linoleum Sofa", "Compact Sofa",
  ) },
  chairs: { name: "Chairs", path: ["home-garden", "furniture", "chairs"], bases: bases(
    "Dining Chair", "Office Chair", "Accent Chair", "Armchair", "Recliner Chair",
    "Bar Stool", "Folding Chair", "Rocking Chair", "Wingback Chair", "Ergonomic Chair",
    "Gaming Chair", "Desk Chair", "Kitchen Stool", "Bench Seat", "Occasional Chair",
  ) },
  beds: { name: "Beds", path: ["home-garden", "furniture", "beds"], bases: bases(
    "Single Bed", "Double Bed", "King Bed", "Super King Bed", "Bunk Bed", "Loft Bed",
    "Day Bed", "Sofa Bed", "Ottoman Bed", "Storage Bed", "Platform Bed", "Four Poster Bed",
    "Sleigh Bed", "Divan Bed", "Adjustable Bed",
  ) },
  wardrobes: { name: "Wardrobes", path: ["home-garden", "furniture", "wardrobes"], bases: bases(
    "Sliding Wardrobe", "Hinged Wardrobe", "Corner Wardrobe", "Fitted Wardrobe",
    "Freestanding Wardrobe", "Mirrored Wardrobe", "Walk-In Wardrobe", "Triple Wardrobe",
    "Double Wardrobe", "Single Wardrobe",
  ) },
  shelving: { name: "Shelving", path: ["home-garden", "storage", "shelving"], bases: bases(
    "Bookcase", "Floating Shelf", "Cube Storage", "Ladder Shelf", "Corner Shelf",
    "Wall Shelf", "Industrial Shelf", "Glass Shelf", "Adjustable Shelf", "Pipe Shelf",
  ) },
  curtains: { name: "Curtains", path: ["home-garden", "home-textiles", "curtains"], bases: bases(
    "Blackout Curtains", "Eyelet Curtains", "Pencil Pleat Curtains", "Velvet Curtains",
    "Linen Curtains", "Thermal Curtains", "Sheer Curtains", "Door Curtains",
    "Tab Top Curtains", "Slot Top Curtains", "Ready Made Curtains", "Made to Measure Curtains",
  ) },
  blinds: { name: "Blinds", path: ["home-garden", "home-textiles", "blinds"], bases: bases(
    "Roller Blind", "Venetian Blind", "Roman Blind", "Vertical Blind", "Pleated Blind",
    "Wooden Blind", "Faux Wood Blind", "Blackout Blind", "Day and Night Blind",
    "Perfect Fit Blind", "Motorised Blind", "Skylight Blind",
  ) },
  rugs: { name: "Rugs", path: ["home-garden", "decor", "rugs"], bases: bases(
    "Area Rug", "Runner Rug", "Shaggy Rug", "Persian Rug", "Jute Rug", "Wool Rug",
    "Cotton Rug", "Outdoor Rug", "Washable Rug", "Round Rug", "Hallway Runner",
    "Kitchen Mat", "Bathroom Mat", "Door Mat", "Children's Rug",
  ) },
  lamps: { name: "Lamps", path: ["home-garden", "lighting", "floor-lamps"], bases: bases(
    "Floor Lamp", "Table Lamp", "Desk Lamp", "Arc Lamp", "Tripod Lamp", "Reading Lamp",
    "Touch Lamp", "LED Lamp", "Smart Lamp", "Bankers Lamp", "Torchiere Lamp",
  ) },
  // Electronics
  laptops: { name: "Laptops", path: ["computers", "laptops", "laptops"], bases: bases(
    "Gaming Laptop", "Business Laptop", "Ultrabook", "Chromebook", "2-in-1 Laptop",
    "MacBook", "Windows Laptop", "Refurbished Laptop", "Student Laptop", "Creative Laptop",
  ) },
  monitors: { name: "Monitors", path: ["computers", "monitors", "monitors"], bases: bases(
    "Gaming Monitor", "4K Monitor", "Ultrawide Monitor", "Curved Monitor", "Portable Monitor",
    "Touchscreen Monitor", "Office Monitor", "Photo Editing Monitor", "144Hz Monitor", "240Hz Monitor",
  ) },
  headphones: { name: "Headphones", path: ["tv-audio", "headphones", "headphones"], bases: bases(
    "Over Ear Headphones", "On Ear Headphones", "In Ear Headphones", "Wireless Headphones",
    "Noise Cancelling Headphones", "Gaming Headset", "Sports Earbuds", "True Wireless Earbuds",
    "Studio Headphones", "Kids Headphones", "Bone Conduction Headphones",
  ) },
  tvs: { name: "TVs", path: ["tv-audio", "tvs", "tvs"], bases: bases(
    "OLED TV", "QLED TV", "LED TV", "4K TV", "8K TV", "Smart TV", "32 Inch TV",
    "43 Inch TV", "50 Inch TV", "55 Inch TV", "65 Inch TV", "75 Inch TV", "85 Inch TV",
  ) },
  cameras: { name: "Cameras", path: ["photo-video", "cameras", "cameras"], bases: bases(
    "DSLR Camera", "Mirrorless Camera", "Compact Camera", "Action Camera", "Instant Camera",
    "Film Camera", "Bridge Camera", "Vlogging Camera", "Security Camera", "Dash Cam",
    "Trail Camera", "Underwater Camera",
  ) },
  // Fashion — Mens
  "mens-jackets": { name: "Mens Jackets", path: ["mens-fashion", "mens-clothing", "jackets"], bases: bases(
    "Bomber Jacket", "Denim Jacket", "Leather Jacket", "Puffer Jacket", "Trench Coat",
    "Parka", "Windbreaker", "Blazer", "Gilet", "Fleece Jacket", "Rain Jacket",
    "Winter Jacket", "Lightweight Jacket", "Harrington Jacket", "Coach Jacket",
  ) },
  "mens-jeans": { name: "Mens Jeans", path: ["mens-fashion", "mens-clothing", "jeans"], bases: bases(
    "Slim Jeans", "Straight Jeans", "Skinny Jeans", "Relaxed Jeans", "Bootcut Jeans",
    "Tapered Jeans", "Ripped Jeans", "Black Jeans", "Stretch Jeans", "Raw Denim Jeans",
  ) },
  "mens-shirts": { name: "Mens Shirts", path: ["mens-fashion", "mens-clothing", "shirts"], bases: bases(
    "Dress Shirt", "Casual Shirt", "Oxford Shirt", "Linen Shirt", "Flannel Shirt",
    "Denim Shirt", "Polo Shirt", "Hawaiian Shirt", "Grandad Collar Shirt", "Checked Shirt",
  ) },
  "mens-shoes": { name: "Mens Shoes", path: ["shoes", "mens-shoes", "mens-shoes"], bases: bases(
    "Oxford Shoes", "Brogues", "Loafers", "Chelsea Boots", "Desert Boots", "Boat Shoes",
    "Slip-On Shoes", "Formal Shoes", "Casual Shoes", "Sandals", "Flip Flops", "Slippers",
  ) },
  // Fashion — Womens
  "womens-tops": { name: "Womens Tops", path: ["womens-fashion", "womens-clothing", "tops"], bases: bases(
    "Blouse", "T-Shirt", "Crop Top", "Tank Top", "Bodysuit", "Camisole", "Tunic Top",
    "Peplum Top", "Off Shoulder Top", "Wrap Top", "Halter Top", "Long Sleeve Top",
  ) },
  "womens-jeans": { name: "Womens Jeans", path: ["womens-fashion", "womens-clothing", "jeans"], bases: bases(
    "Skinny Jeans", "Mom Jeans", "Boyfriend Jeans", "Straight Leg Jeans", "Wide Leg Jeans",
    "Flared Jeans", "High Waist Jeans", "Cropped Jeans", "Ripped Jeans", "Black Jeans",
  ) },
  "womens-bags": { name: "Womens Bags", path: ["womens-fashion", "bags", "handbags"], bases: bases(
    "Tote Bag", "Crossbody Bag", "Shoulder Bag", "Clutch Bag", "Backpack", "Satchel",
    "Hobo Bag", "Bucket Bag", "Messenger Bag", "Evening Bag", "Weekender Bag",
  ) },
  // Sports
  "running-shoes": { name: "Running Shoes", path: ["sports", "running", "running-shoes"], bases: bases(
    "Road Running Shoes", "Trail Running Shoes", "Track Running Shoes", "Marathon Shoes",
    "Stability Running Shoes", "Neutral Running Shoes", "Cushioned Running Shoes",
    "Lightweight Running Shoes", "Waterproof Running Shoes", "Racing Flats",
  ) },
  "cycling-bikes": { name: "Bikes", path: ["cycling", "bikes", "bikes"], bases: bases(
    "Road Bike", "Mountain Bike", "Hybrid Bike", "Electric Bike", "Folding Bike",
    "BMX Bike", "Gravel Bike", "Cyclocross Bike", "Touring Bike", "Kids Bike",
    "Balance Bike", "Cargo Bike", "Fat Bike", "Track Bike", "Time Trial Bike",
  ) },
  "camping-tents": { name: "Tents", path: ["camping", "tents", "tents"], bases: bases(
    "Dome Tent", "Tunnel Tent", "Pop Up Tent", "Family Tent", "Backpacking Tent",
    "Festival Tent", "Inflatable Tent", "Canvas Tent", "Bell Tent", "Awning",
    "Gazebo", "Sun Shelter", "Beach Tent", "Roof Top Tent",
  ) },
  // Vehicles
  "car-parts": { name: "Car Parts", path: ["autoparts", "car-parts", "car-parts"], bases: bases(
    "Brake Pads", "Brake Discs", "Oil Filter", "Air Filter", "Spark Plugs", "Battery",
    "Alternator", "Starter Motor", "Wiper Blades", "Headlight Bulb", "Wing Mirror",
    "Bumper", "Exhaust", "Catalytic Converter", "Suspension Spring", "Shock Absorber",
    "Wheel Bearing", "Clutch Kit", "Timing Belt", "Water Pump",
  ) },
  // Beauty
  "skincare": { name: "Skincare", path: ["beauty", "skincare", "skincare"], bases: bases(
    "Moisturiser", "Cleanser", "Serum", "Sunscreen", "Face Mask", "Toner", "Eye Cream",
    "Face Oil", "Exfoliator", "Retinol", "Vitamin C Serum", "Hyaluronic Acid",
    "Night Cream", "Day Cream", "Micellar Water", "Face Wash", "Spot Treatment",
  ) },
  "makeup": { name: "Makeup", path: ["beauty", "makeup", "makeup"], bases: bases(
    "Foundation", "Concealer", "Mascara", "Lipstick", "Lip Gloss", "Eyeshadow Palette",
    "Blush", "Bronzer", "Highlighter", "Setting Powder", "Primer", "Setting Spray",
    "Eyeliner", "Brow Pencil", "False Lashes", "Makeup Brush Set",
  ) },
  // Toys
  "action-figures": { name: "Action Figures", path: ["toys", "action-figures", "action-figures"], bases: bases(
    "Marvel Figure", "DC Figure", "Star Wars Figure", "WWE Figure", "Transformers Figure",
    "Power Rangers Figure", "TMNT Figure", "GI Joe Figure", "Funko Pop", "Nendoroid",
  ) },
  "board-games": { name: "Board Games", path: ["toys", "board-games", "board-games"], bases: bases(
    "Strategy Board Game", "Family Board Game", "Party Board Game", "Card Game",
    "Trivia Game", "Cooperative Game", "Euro Game", "War Game", "Puzzle Game",
    "Classic Board Game", "Travel Board Game", "Children's Board Game",
  ) },
  // Books
  fiction: { name: "Fiction", path: ["books", "fiction", "fiction"], bases: bases(
    "Crime Fiction", "Thriller", "Romance Novel", "Science Fiction", "Fantasy Novel",
    "Historical Fiction", "Literary Fiction", "Horror Novel", "Mystery Novel",
    "Young Adult Fiction", "Children's Fiction", "Graphic Novel",
  ) },
  nonfiction: { name: "Non-Fiction", path: ["books", "non-fiction", "non-fiction"], bases: bases(
    "Biography", "Autobiography", "History Book", "Self Help Book", "Business Book",
    "Cookbook", "Travel Guide", "Science Book", "Philosophy Book", "True Crime Book",
    "Health Book", "Parenting Book", "Art Book", "Photography Book",
  ) },
  // Music instruments
  guitars: { name: "Guitars", path: ["music", "guitars", "guitars"], bases: bases(
    "Acoustic Guitar", "Electric Guitar", "Classical Guitar", "Bass Guitar",
    "Ukulele", "12 String Guitar", "Semi Acoustic Guitar", "Resonator Guitar",
    "Left Handed Guitar", "Beginner Guitar", "Travel Guitar",
  ) },
  keyboards: { name: "Keyboards", path: ["music", "keyboards", "keyboards"], bases: bases(
    "Digital Piano", "MIDI Keyboard", "Synthesizer", "Stage Piano", "Arranger Keyboard",
    "Workstation Keyboard", "Portable Keyboard", "Beginner Keyboard", "88 Key Keyboard",
  ) },
  // Health
  "fitness-equipment": { name: "Fitness Equipment", path: ["health", "fitness", "fitness-equipment"], bases: bases(
    "Exercise Bike", "Treadmill", "Rowing Machine", "Cross Trainer", "Multi Gym",
    "Weight Bench", "Dumbbell Set", "Kettlebell Set", "Pull Up Bar", "Power Tower",
    "Vibration Plate", "Stepper", "Ab Bench", "Smith Machine",
  ) },
  // Jewellery
  rings: { name: "Rings", path: ["jewellery", "rings", "rings"], bases: bases(
    "Engagement Ring", "Wedding Ring", "Eternity Ring", "Signet Ring", "Statement Ring",
    "Stacking Ring", "Cocktail Ring", "Pinky Ring", "Thumb Ring", "Vintage Ring",
  ) },
  necklaces: { name: "Necklaces", path: ["jewellery", "necklaces", "necklaces"], bases: bases(
    "Pendant Necklace", "Chain Necklace", "Choker", "Lariat Necklace", "Pearl Necklace",
    "Statement Necklace", "Layered Necklace", "Name Necklace", "Lock Necklace", "Beaded Necklace",
  ) },
  watches: { name: "Watches", path: ["jewellery", "watches", "watches"], bases: bases(
    "Analogue Watch", "Digital Watch", "Smart Watch", "Dress Watch", "Sports Watch",
    "Diving Watch", "Chronograph Watch", "Automatic Watch", "Quartz Watch", "Pocket Watch",
  ) },
  // Office
  "office-chairs": { name: "Office Chairs", path: ["office", "office-furniture", "office-chairs"], bases: bases(
    "Ergonomic Office Chair", "Executive Chair", "Mesh Office Chair", "Leather Office Chair",
    "Drafting Chair", "Kneeling Chair", "Balance Ball Chair", "Conference Chair",
    "Stackable Chair", "Visitor Chair",
  ) },
  printers: { name: "Printers", path: ["office", "printers", "printers"], bases: bases(
    "Inkjet Printer", "Laser Printer", "All-in-One Printer", "Photo Printer",
    "Label Printer", "3D Printer", "Portable Printer", "Wireless Printer",
    "Colour Laser Printer", "Mono Laser Printer",
  ) },
};

// Auto-expand: for each seed, also generate variant combinations
export const AUTO_EXPAND_GROUPS = Object.keys(PRODUCT_TYPE_CATEGORY_SEEDS);
