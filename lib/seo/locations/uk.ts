export type UkNation = "england" | "scotland" | "wales" | "northern-ireland";

export type UkLocation = {
  slug: string;
  name: string;
  type: "nation" | "county" | "city" | "town";
  nation: UkNation;
  parentSlug?: string;
};

export const UK_NATIONS: UkLocation[] = [
  { slug: "england", name: "England", type: "nation", nation: "england" },
  { slug: "scotland", name: "Scotland", type: "nation", nation: "scotland" },
  { slug: "wales", name: "Wales", type: "nation", nation: "wales" },
  { slug: "northern-ireland", name: "Northern Ireland", type: "nation", nation: "northern-ireland" },
];

export const UK_COUNTIES: UkLocation[] = [
  { slug: "greater-london", name: "Greater London", type: "county", nation: "england", parentSlug: "england" },
  { slug: "greater-manchester", name: "Greater Manchester", type: "county", nation: "england", parentSlug: "england" },
  { slug: "west-midlands", name: "West Midlands", type: "county", nation: "england", parentSlug: "england" },
  { slug: "west-yorkshire", name: "West Yorkshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "merseyside", name: "Merseyside", type: "county", nation: "england", parentSlug: "england" },
  { slug: "south-yorkshire", name: "South Yorkshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "tyne-and-wear", name: "Tyne and Wear", type: "county", nation: "england", parentSlug: "england" },
  { slug: "nottinghamshire", name: "Nottinghamshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "hampshire", name: "Hampshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "kent", name: "Kent", type: "county", nation: "england", parentSlug: "england" },
  { slug: "essex", name: "Essex", type: "county", nation: "england", parentSlug: "england" },
  { slug: "surrey", name: "Surrey", type: "county", nation: "england", parentSlug: "england" },
  { slug: "devon", name: "Devon", type: "county", nation: "england", parentSlug: "england" },
  { slug: "cornwall", name: "Cornwall", type: "county", nation: "england", parentSlug: "england" },
  { slug: "lancashire", name: "Lancashire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "cheshire", name: "Cheshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "berkshire", name: "Berkshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "oxfordshire", name: "Oxfordshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "cambridgeshire", name: "Cambridgeshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "norfolk", name: "Norfolk", type: "county", nation: "england", parentSlug: "england" },
  { slug: "suffolk", name: "Suffolk", type: "county", nation: "england", parentSlug: "england" },
  { slug: "gloucestershire", name: "Gloucestershire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "somerset", name: "Somerset", type: "county", nation: "england", parentSlug: "england" },
  { slug: "dorset", name: "Dorset", type: "county", nation: "england", parentSlug: "england" },
  { slug: "staffordshire", name: "Staffordshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "derbyshire", name: "Derbyshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "leicestershire", name: "Leicestershire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "northamptonshire", name: "Northamptonshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "warwickshire", name: "Warwickshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "worcestershire", name: "Worcestershire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "shropshire", name: "Shropshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "herefordshire", name: "Herefordshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "cumbria", name: "Cumbria", type: "county", nation: "england", parentSlug: "england" },
  { slug: "northumberland", name: "Northumberland", type: "county", nation: "england", parentSlug: "england" },
  { slug: "durham", name: "Durham", type: "county", nation: "england", parentSlug: "england" },
  { slug: "east-sussex", name: "East Sussex", type: "county", nation: "england", parentSlug: "england" },
  { slug: "west-sussex", name: "West Sussex", type: "county", nation: "england", parentSlug: "england" },
  { slug: "bedfordshire", name: "Bedfordshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "buckinghamshire", name: "Buckinghamshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "hertfordshire", name: "Hertfordshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "lincolnshire", name: "Lincolnshire", type: "county", nation: "england", parentSlug: "england" },
  { slug: "midlothian", name: "Midlothian", type: "county", nation: "scotland", parentSlug: "scotland" },
  { slug: "lanarkshire", name: "Lanarkshire", type: "county", nation: "scotland", parentSlug: "scotland" },
  { slug: "fife", name: "Fife", type: "county", nation: "scotland", parentSlug: "scotland" },
  { slug: "aberdeenshire", name: "Aberdeenshire", type: "county", nation: "scotland", parentSlug: "scotland" },
  { slug: "highland", name: "Highland", type: "county", nation: "scotland", parentSlug: "scotland" },
  { slug: "glasgow-city", name: "Glasgow City", type: "county", nation: "scotland", parentSlug: "scotland" },
  { slug: "edinburgh-city", name: "City of Edinburgh", type: "county", nation: "scotland", parentSlug: "scotland" },
  { slug: "gwynedd", name: "Gwynedd", type: "county", nation: "wales", parentSlug: "wales" },
  { slug: "powys", name: "Powys", type: "county", nation: "wales", parentSlug: "wales" },
  { slug: "pembrokeshire", name: "Pembrokeshire", type: "county", nation: "wales", parentSlug: "wales" },
  { slug: "carmarthenshire", name: "Carmarthenshire", type: "county", nation: "wales", parentSlug: "wales" },
  { slug: "conwy", name: "Conwy", type: "county", nation: "wales", parentSlug: "wales" },
  { slug: "antrim", name: "Antrim", type: "county", nation: "northern-ireland", parentSlug: "northern-ireland" },
  { slug: "down", name: "Down", type: "county", nation: "northern-ireland", parentSlug: "northern-ireland" },
  { slug: "derry", name: "Derry", type: "county", nation: "northern-ireland", parentSlug: "northern-ireland" },
  { slug: "armagh", name: "Armagh", type: "county", nation: "northern-ireland", parentSlug: "northern-ireland" },
];

export const UK_CITIES: UkLocation[] = [
  { slug: "london", name: "London", type: "city", nation: "england", parentSlug: "greater-london" },
  { slug: "manchester", name: "Manchester", type: "city", nation: "england", parentSlug: "greater-manchester" },
  { slug: "birmingham", name: "Birmingham", type: "city", nation: "england", parentSlug: "west-midlands" },
  { slug: "leeds", name: "Leeds", type: "city", nation: "england", parentSlug: "west-yorkshire" },
  { slug: "liverpool", name: "Liverpool", type: "city", nation: "england", parentSlug: "merseyside" },
  { slug: "sheffield", name: "Sheffield", type: "city", nation: "england", parentSlug: "south-yorkshire" },
  { slug: "newcastle", name: "Newcastle upon Tyne", type: "city", nation: "england", parentSlug: "tyne-and-wear" },
  { slug: "nottingham", name: "Nottingham", type: "city", nation: "england", parentSlug: "nottinghamshire" },
  { slug: "southampton", name: "Southampton", type: "city", nation: "england", parentSlug: "hampshire" },
  { slug: "bristol", name: "Bristol", type: "city", nation: "england", parentSlug: "england" },
  { slug: "leicester", name: "Leicester", type: "city", nation: "england", parentSlug: "leicestershire" },
  { slug: "coventry", name: "Coventry", type: "city", nation: "england", parentSlug: "west-midlands" },
  { slug: "bradford", name: "Bradford", type: "city", nation: "england", parentSlug: "west-yorkshire" },
  { slug: "edinburgh", name: "Edinburgh", type: "city", nation: "scotland", parentSlug: "edinburgh-city" },
  { slug: "glasgow", name: "Glasgow", type: "city", nation: "scotland", parentSlug: "glasgow-city" },
  { slug: "cardiff", name: "Cardiff", type: "city", nation: "wales", parentSlug: "wales" },
  { slug: "swansea", name: "Swansea", type: "city", nation: "wales", parentSlug: "wales" },
  { slug: "belfast", name: "Belfast", type: "city", nation: "northern-ireland", parentSlug: "northern-ireland" },
  { slug: "cambridge", name: "Cambridge", type: "city", nation: "england", parentSlug: "cambridgeshire" },
  { slug: "oxford", name: "Oxford", type: "city", nation: "england", parentSlug: "oxfordshire" },
  { slug: "brighton", name: "Brighton", type: "city", nation: "england", parentSlug: "east-sussex" },
  { slug: "reading", name: "Reading", type: "city", nation: "england", parentSlug: "berkshire" },
  { slug: "milton-keynes", name: "Milton Keynes", type: "city", nation: "england", parentSlug: "buckinghamshire" },
  { slug: "plymouth", name: "Plymouth", type: "city", nation: "england", parentSlug: "devon" },
  { slug: "exeter", name: "Exeter", type: "city", nation: "england", parentSlug: "devon" },
  { slug: "york", name: "York", type: "city", nation: "england", parentSlug: "england" },
  { slug: "norwich", name: "Norwich", type: "city", nation: "england", parentSlug: "norfolk" },
  { slug: "ipswich", name: "Ipswich", type: "city", nation: "england", parentSlug: "suffolk" },
  { slug: "aberdeen", name: "Aberdeen", type: "city", nation: "scotland", parentSlug: "aberdeenshire" },
  { slug: "dundee", name: "Dundee", type: "city", nation: "scotland", parentSlug: "scotland" },
];

export const UK_TOWNS: UkLocation[] = [
  { slug: "wimbledon", name: "Wimbledon", type: "town", nation: "england", parentSlug: "greater-london" },
  { slug: "greenwich", name: "Greenwich", type: "town", nation: "england", parentSlug: "greater-london" },
  { slug: "stratford", name: "Stratford", type: "town", nation: "england", parentSlug: "greater-london" },
  { slug: "stockport", name: "Stockport", type: "town", nation: "england", parentSlug: "greater-manchester" },
  { slug: "bolton", name: "Bolton", type: "town", nation: "england", parentSlug: "greater-manchester" },
  { slug: "wolverhampton", name: "Wolverhampton", type: "town", nation: "england", parentSlug: "west-midlands" },
  { slug: "huddersfield", name: "Huddersfield", type: "town", nation: "england", parentSlug: "west-yorkshire" },
  { slug: "warrington", name: "Warrington", type: "town", nation: "england", parentSlug: "cheshire" },
  { slug: "peterborough", name: "Peterborough", type: "town", nation: "england", parentSlug: "cambridgeshire" },
  { slug: "luton", name: "Luton", type: "town", nation: "england", parentSlug: "bedfordshire" },
  { slug: "northampton", name: "Northampton", type: "town", nation: "england", parentSlug: "northamptonshire" },
  { slug: "swindon", name: "Swindon", type: "town", nation: "england", parentSlug: "wiltshire" },
  { slug: "bournemouth", name: "Bournemouth", type: "town", nation: "england", parentSlug: "dorset" },
  { slug: "poole", name: "Poole", type: "town", nation: "england", parentSlug: "dorset" },
  { slug: "cheltenham", name: "Cheltenham", type: "town", nation: "england", parentSlug: "gloucestershire" },
  { slug: "bath", name: "Bath", type: "town", nation: "england", parentSlug: "somerset" },
  { slug: "chester", name: "Chester", type: "town", nation: "england", parentSlug: "cheshire" },
  { slug: "inverness", name: "Inverness", type: "town", nation: "scotland", parentSlug: "highland" },
  { slug: "stirling", name: "Stirling", type: "town", nation: "scotland", parentSlug: "scotland" },
  { slug: "wrexham", name: "Wrexham", type: "town", nation: "wales", parentSlug: "wales" },
  { slug: "bangor", name: "Bangor", type: "town", nation: "wales", parentSlug: "gwynedd" },
  { slug: "derry-city", name: "Derry", type: "town", nation: "northern-ireland", parentSlug: "derry" },
];

export const ALL_UK_LOCATIONS: UkLocation[] = [...UK_NATIONS, ...UK_COUNTIES, ...UK_CITIES, ...UK_TOWNS];

export function findLocationBySlug(slug: string): UkLocation | undefined {
  return ALL_UK_LOCATIONS.find((location) => location.slug === slug);
}

export function getLocationsByNation(nation: UkNation): UkLocation[] {
  return ALL_UK_LOCATIONS.filter((location) => location.nation === nation);
}

export function getLocationChildren(parentSlug: string): UkLocation[] {
  return ALL_UK_LOCATIONS.filter((location) => location.parentSlug === parentSlug);
}
