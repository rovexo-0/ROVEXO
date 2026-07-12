/**
 * Product type seed definitions per category group.
 * Format: groupSlug → base product type names
 */

export const PRODUCT_TYPE_SEEDS: Record<string, readonly string[]> = {
  // Bedding
  pillows: [
    "Memory Foam Pillow", "Travel Pillow", "Neck Pillow", "Orthopaedic Pillow", "Cooling Pillow",
    "Latex Pillow", "Down Pillow", "Feather Pillow", "Microfiber Pillow", "Gel Pillow",
    "Bamboo Pillow", "Shredded Memory Foam Pillow", "Contour Pillow", "Cervical Pillow",
    "Body Pillow", "Wedge Pillow", "Reading Pillow", "Anti Snore Pillow", "Pregnancy Pillow",
    "Maternity Pillow", "Nursing Pillow", "Kids Pillow", "Toddler Pillow", "Baby Pillow",
    "Camping Pillow", "Inflatable Pillow", "Hotel Pillow", "Luxury Pillow", "Pet Pillow",
    "Decorative Cushion", "Seat Cushion", "Lumbar Cushion", "Floor Cushion", "Outdoor Cushion",
    "Sofa Cushion", "Wheelchair Cushion", "V-Shaped Pillow", "Bolster Pillow", "Throw Pillow",
  ],
  duvets: [
    "Single Duvet", "Double Duvet", "King Duvet", "Super King Duvet", "Emperor Duvet",
    "All Season Duvet", "Summer Duvet", "Winter Duvet", "Feather Duvet", "Down Duvet",
    "Synthetic Duvet", "Weighted Duvet", "Toddler Duvet", "Cot Duvet", "Anti-Allergy Duvet",
    "Cooling Duvet", "Organic Duvet", "Hotel Quality Duvet",
  ],
  pillowcases: [
    "Standard Pillowcase", "Oxford Pillowcase", "Housewife Pillowcase", "Silk Pillowcase",
    "Satin Pillowcase", "Cotton Pillowcase", "Egyptian Cotton Pillowcase", "Anti-Allergy Pillowcase",
    "Waterproof Pillowcase", "Envelope Pillowcase", "Zippered Pillowcase",
  ],
  blankets: [
    "Fleece Blanket", "Wool Blanket", "Cotton Blanket", "Weighted Blanket", "Electric Blanket",
    "Throw Blanket", "Baby Blanket", "Sherpa Blanket", "Knitted Blanket", "Quilted Blanket",
    "Heated Throw", "Picnic Blanket", "Outdoor Blanket", "Emergency Blanket",
  ],
  "bed-sheets": [
    "Fitted Sheet", "Flat Sheet", "Deep Fitted Sheet", "Silk Sheet Set", "Cotton Sheet Set",
    "Egyptian Cotton Sheet Set", "Bamboo Sheet Set", "Linen Sheet Set", "Jersey Sheet Set",
  ],
  "duvet-covers": [
    "Single Duvet Cover", "Double Duvet Cover", "King Duvet Cover", "Super King Duvet Cover",
    "Reversible Duvet Cover", "Children's Duvet Cover", "Oxford Duvet Cover",
  ],
  throws: [
    "Knitted Throw", "Faux Fur Throw", "Velvet Throw", "Cotton Throw", "Wool Throw",
    "Chenille Throw", "Chunky Knit Throw", "Fringed Throw",
  ],
  "mattress-protectors": [
    "Waterproof Mattress Protector", "Anti-Allergy Mattress Protector", "Fitted Mattress Protector",
    "Encasement Mattress Protector", "Cooling Mattress Protector", "Quilted Mattress Protector",
  ],
  // Furniture
  tables: [
    "Dining Table", "Coffee Table", "Side Table", "Console Table", "Desk", "Bedside Table",
    "Nesting Table", "Extending Table", "Round Table", "Square Table", "Folding Table",
    "Garden Table", "Picnic Table", "Bar Table", "Drafting Table", "Computer Desk",
    "Standing Desk", "Dressing Table", "Hall Table", "Gateleg Table",
  ],
  // Electronics - phones
  smartphones: [
    "Apple iPhone", "Samsung Galaxy", "Google Pixel", "OnePlus", "Xiaomi", "Motorola",
    "Sony Xperia", "Nokia", "Huawei", "Honor", "Oppo", "Vivo", "Nothing Phone",
    "Fairphone", "Refurbished Smartphone", "Unlocked Smartphone", "Dual SIM Phone",
    "5G Smartphone", "Foldable Phone", "Rugged Phone",
  ],
  // Fashion
  dresses: [
    "Maxi Dress", "Midi Dress", "Mini Dress", "Shift Dress", "Wrap Dress", "Bodycon Dress",
    "A-Line Dress", "Shirt Dress", "Cocktail Dress", "Evening Dress", "Wedding Guest Dress",
    "Bridesmaid Dress", "Summer Dress", "Winter Dress", "Party Dress", "Casual Dress",
    "Formal Dress", "Work Dress", "Beach Dress", "Knitted Dress",
  ],
  trainers: [
    "Running Trainers", "Walking Trainers", "Gym Trainers", "Lifestyle Trainers", "Basketball Trainers",
    "Tennis Trainers", "Cross Training Shoes", "Trail Running Shoes", "Road Running Shoes",
    "Retro Trainers", "Platform Trainers", "Slip-On Trainers", "High Top Trainers", "Low Top Trainers",
  ],
  // Sports
  "gym-equipment": [
    "Dumbbell", "Kettlebell", "Barbell", "Weight Bench", "Squat Rack", "Power Rack",
    "Treadmill", "Exercise Bike", "Rowing Machine", "Cross Trainer", "Elliptical",
    "Pull Up Bar", "Resistance Band", "Yoga Mat", "Foam Roller", "Medicine Ball",
    "Punch Bag", "Speed Rope", "Ab Roller", "Push Up Bars",
  ],
  // Garden
  "garden-tools": [
    "Lawn Mower", "Strimmer", "Hedge Trimmer", "Chainsaw", "Leaf Blower", "Pressure Washer",
    "Garden Fork", "Spade", "Rake", "Hoe", "Trowel", "Secateurs", "Loppers", "Pruning Saw",
    "Wheelbarrow", "Garden Hose", "Sprinkler", "Watering Can", "Compost Bin", "Greenhouse",
  ],
  // DIY
  paint: [
    "Emulsion Paint", "Gloss Paint", "Matt Paint", "Satin Paint", "Eggshell Paint",
    "Exterior Paint", "Masonry Paint", "Primer", "Undercoat", "Wood Stain", "Varnish",
    "Fence Paint", "Decking Oil", "Spray Paint", "Chalk Paint",
  ],
  drills: [
    "Cordless Drill", "Combi Drill", "Hammer Drill", "SDS Drill", "Impact Driver",
    "Drill Driver Set", "Right Angle Drill", "Magnetic Drill", "Bench Drill",
  ],
  // Baby
  cots: [
    "Cot Bed", "Travel Cot", "Bassinet", "Moses Basket", "Crib", "Next to Me Crib",
    "Co-Sleeping Crib", "Convertible Cot", "Wooden Cot", "White Cot",
  ],
  // Pets
  "dog-beds": [
    "Orthopaedic Dog Bed", "Memory Foam Dog Bed", "Raised Dog Bed", "Crate Mat",
    "Donut Dog Bed", "Bolster Dog Bed", "Waterproof Dog Bed", "Cooling Dog Bed",
    "Heated Dog Bed", "Travel Dog Bed", "Puppy Bed", "Large Dog Bed",
  ],
  // Kitchen
  "small-appliances": [
    "Air Fryer", "Blender", "Food Processor", "Coffee Machine", "Kettle", "Toaster",
    "Microwave", "Slow Cooker", "Pressure Cooker", "Stand Mixer", "Hand Mixer",
    "Juicer", "Bread Maker", "Sandwich Maker", "Waffle Maker", "Ice Cream Maker",
    "Rice Cooker", "Steamer", "Deep Fryer", "Health Grill",
  ],
};

/** Size/variant qualifiers applied per group for expansion. */
export const PRODUCT_TYPE_QUALIFIERS: Record<string, readonly string[]> = {
  pillows: ["Standard", "King", "Super King", "Travel", "Body", "Euro", "Cot", "Toddler"],
  duvets: ["4.5 Tog", "7.5 Tog", "10.5 Tog", "13.5 Tog", "15 Tog"],
  blankets: ["Single", "Double", "King", "Throw Size"],
  trainers: ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
  dresses: ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18"],
  default: ["Small", "Medium", "Large", "Extra Large"],
};

/** Material prefixes for product type expansion. */
export const PRODUCT_TYPE_MATERIAL_PREFIXES: Record<string, readonly string[]> = {
  pillows: ["Memory Foam", "Latex", "Down", "Microfiber", "Bamboo", "Gel"],
  blankets: ["Fleece", "Wool", "Cotton", "Sherpa", "Weighted"],
  tables: ["Oak", "Walnut", "Pine", "Glass", "Marble"],
  default: [],
};
