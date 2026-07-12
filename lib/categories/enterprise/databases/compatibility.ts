/**
 * Canonical marketplace compatibility database — SSOT for parts and accessories.
 */

export const PHONE_COMPATIBILITY = [
  "iPhone 16 Pro Max",
  "iPhone 16 Pro",
  "iPhone 16",
  "iPhone 15 Pro Max",
  "iPhone 15 Pro",
  "iPhone 15",
  "iPhone 14 Pro Max",
  "iPhone 14 Pro",
  "iPhone 14",
  "iPhone 13 Pro Max",
  "iPhone 13 Pro",
  "iPhone 13",
  "iPhone 12",
  "iPhone 11",
  "iPhone SE",
  "Samsung Galaxy S25",
  "Samsung Galaxy S24",
  "Samsung Galaxy S23",
  "Samsung Galaxy A55",
  "Samsung Galaxy A54",
  "Google Pixel 9",
  "Google Pixel 8",
  "Google Pixel 7",
  "Universal",
] as const;

export const VEHICLE_COMPATIBILITY = [
  "Universal Fit",
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
  "Peugeot",
  "Renault",
  "Citroen",
  "Fiat",
  "Seat",
  "Skoda",
  "Land Rover",
  "Jaguar",
] as const;

export const COMPUTER_COMPATIBILITY = [
  "Windows",
  "macOS",
  "Linux",
  "Chrome OS",
  "Universal",
  "USB-C",
  "Thunderbolt",
  "HDMI",
  "DisplayPort",
] as const;

export const MARKETPLACE_COMPATIBILITY_BY_SCOPE = {
  default: [] as readonly string[],
  phones: PHONE_COMPATIBILITY,
  autoparts: VEHICLE_COMPATIBILITY,
  computers: COMPUTER_COMPATIBILITY,
} as const;
