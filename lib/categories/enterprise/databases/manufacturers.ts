/**
 * Canonical marketplace manufacturer database — SSOT for OEM and parts listings.
 */

export const ELECTRONICS_MANUFACTURERS = [
  "Apple",
  "Samsung",
  "Sony",
  "LG",
  "Panasonic",
  "Philips",
  "Bosch",
  "Siemens",
  "Google",
  "Huawei",
  "Xiaomi",
  "Dell",
  "HP",
  "Lenovo",
  "Asus",
  "Acer",
  "MSI",
  "Canon",
  "Nikon",
  "Intel",
  "AMD",
  "NVIDIA",
  "Qualcomm",
  "MediaTek",
] as const;

export const HOME_MANUFACTURERS = [
  "IKEA",
  "Silentnight",
  "Tempur",
  "Emma",
  "Simba",
  "Dunelm",
  "John Lewis",
  "Hypnos",
  "Sealy",
  "Dreams",
  "Dormeo",
  "Le Creuset",
  "Smeg",
  "Dyson",
  "Miele",
  "Bosch",
  "Hotpoint",
  "Beko",
] as const;

export const VEHICLE_MANUFACTURERS = [
  "Ford",
  "Vauxhall",
  "Volkswagen",
  "BMW",
  "Audi",
  "Mercedes-Benz",
  "Toyota",
  "Honda",
  "Nissan",
  "Hyundai",
  "Kia",
  "Tesla",
  "Jaguar",
  "Land Rover",
  "Porsche",
  "Fiat",
  "Peugeot",
  "Renault",
] as const;

export const MARKETPLACE_MANUFACTURERS_BY_VERTICAL = {
  default: [] as readonly string[],
  electronics: ELECTRONICS_MANUFACTURERS,
  home: HOME_MANUFACTURERS,
  vehicles: VEHICLE_MANUFACTURERS,
} as const;
