/**
 * Material family base definitions.
 * Format: [familyName, baseMaterials[], verticals[]]
 */

export const MATERIAL_FAMILIES: readonly (readonly [string, readonly string[], readonly string[]])[] = [
  ["textiles", [
    "Cotton", "Polyester", "Wool", "Silk", "Linen", "Denim", "Canvas", "Fleece",
    "Jersey", "Satin", "Velvet", "Velour", "Corduroy", "Tweed", "Herringbone", "Flannel",
    "Chiffon", "Organza", "Tulle", "Lace", "Mesh", "Net", "Brocade", "Damask",
    "Microfibre", "Microfiber", "Bamboo", "Hemp", "Jute", "Ramie", "Modal", "Tencel",
    "Viscose", "Rayon", "Acrylic", "Nylon", "Elastane", "Lycra", "Spandex",
  ], ["fashion", "home", "bedding"]],

  ["bedding", [
    "Memory Foam", "Gel Memory Foam", "Shredded Memory Foam", "High Density Foam", "Foam",
    "Gel Foam", "PU Foam", "Latex", "Natural Latex", "Synthetic Latex", "Down",
    "Duck Down", "Goose Down", "Feather", "Kapok", "Buckwheat", "Gel", "Hybrid",
  ], ["bedding", "pillows"]],

  ["leather", [
    "Leather", "Faux Leather", "PU Leather", "Bonded Leather", "Suede", "Faux Suede",
    "Nubuck", "Patent Leather", "Nappa Leather", "Full Grain Leather", "Top Grain Leather",
  ], ["fashion", "home"]],

  ["fur", [
    "Fur", "Faux Fur", "Shearling", "Sheepskin", "Alpaca", "Cashmere", "Merino Wool",
    "Mohair", "Angora", "Alpaca Wool", "Yak Wool", "Camel Hair", "Vicuna",
  ], ["fashion", "home"]],

  ["metals", [
    "Steel", "Stainless Steel", "Aluminium", "Aluminum", "Brass", "Bronze", "Copper",
    "Iron", "Cast Iron", "Wrought Iron", "Zinc", "Tin", "Lead", "Nickel", "Chrome",
    "Titanium", "Magnesium", "Tungsten", "Pewter", "Gunmetal",
  ], ["home", "tools", "electronics"]],

  ["precious_metals", [
    "Gold", "Silver", "Platinum", "Palladium", "Rose Gold", "White Gold", "Yellow Gold",
  ], ["jewellery", "home"]],

  ["woods", [
    "Wood", "Oak", "Pine", "Walnut", "Mahogany", "Teak", "Beech", "Birch", "Maple",
    "Cherry", "Ash", "Elm", "Cedar", "Spruce", "Fir", "Bamboo Wood", "Rubberwood",
    "Mango Wood", "Acacia", "Sheesham", "Mindi", "Mango", "Reclaimed Wood",
  ], ["home", "garden"]],

  ["engineered_wood", [
    "MDF", "Plywood", "Chipboard", "Particle Board", "OSB", "Hardboard", "MFC",
    "Veneer", "Laminate", "Engineered Wood", "Cross-Laminated Timber",
  ], ["home", "diy"]],

  ["stone", [
    "Stone", "Marble", "Granite", "Slate", "Limestone", "Sandstone", "Travertine",
    "Quartzite", "Onyx", "Basalt", "Quartz", "Engineered Stone", "Sintered Stone",
  ], ["home", "garden"]],

  ["ceramics", [
    "Ceramic", "Porcelain", "Stoneware", "Earthenware", "Bone China", "Fine China",
    "Terracotta", "Fireclay", "Vitreous China",
  ], ["home", "garden"]],

  ["glass", [
    "Glass", "Tempered Glass", "Borosilicate Glass", "Crystal", "Frosted Glass",
    "Tinted Glass", "Laminated Glass", "Acrylic Glass", "Plexiglass",
  ], ["home", "electronics"]],

  ["plastics", [
    "Plastic", "ABS", "PVC", "Polypropylene", "Polyethylene", "PET", "Polycarbonate",
    "Nylon", "Acrylic", "PMMA", "Silicone", "Rubber", "EPDM", "Neoprene", "Vinyl",
    "Polyurethane", "PVA", "EVA", "TPE", "TPU", "Fibreglass", "Carbon Fibre",
    "Kevlar", "Graphene",
  ], ["home", "electronics", "tools"]],

  ["natural", [
    "Cork", "Rattan", "Wicker", "Seagrass", "Sisal", "Coir", "Water Hyacinth",
    "Banana Leaf", "Palm Leaf", "Straw", "Hay", "Paper", "Cardboard", "Kraft Paper",
  ], ["home", "garden"]],

  ["finishes", [
    "Painted", "Powder Coated", "Anodised", "Galvanised", "Chrome Plated",
    "Nickel Plated", "Brushed", "Polished", "Matte", "Gloss", "Satin Finish",
    "Oil Finished", "Wax Finished", "Lacquered", "Varnished", "Stained",
  ], ["home", "diy"]],

  ["composites", [
    "Composite", "GRP", "Carbon Composite", "Fibreglass Composite", "Wood Plastic Composite",
    "Bamboo Composite", "Resin", "Epoxy Resin", "Polyester Resin", "Bio-Resin",
  ], ["home", "sports"]],

  ["insulation", [
    "Wool Insulation", "Fibreglass Insulation", "Foam Insulation", "PIR Insulation",
    "EPS Insulation", "XPS Insulation", "Cellulose Insulation", "Mineral Wool",
    "Rockwool", "Aerogel",
  ], ["diy", "home"]],
];
