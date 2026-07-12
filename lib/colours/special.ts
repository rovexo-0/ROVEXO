/**
 * Special / pattern colours outside the hue matrix.
 */

export const COLOUR_SPECIAL: readonly (readonly [string, string] | readonly [string, string, readonly string[]])[] = [
  ["Transparent", "#e5e7eb", ["Clear", "See-Through"]],
  ["Multicolour", "#a3a3a3", ["Multi", "Multi-Colour", "Rainbow"]],
  ["Camouflage", "#4d7c0f", ["Camo"]],
  ["Animal Print", "#78716c", ["Leopard", "Zebra Print"]],
  ["Patterned", "#b8a99a", ["Print", "Printed"]],
  ["Gradient", "#c4b5fd", ["Ombre", "Fade"]],
  ["Space Grey", "#4a4a4a", ["Space Gray"]],
  ["Midnight", "#191970"],
  ["Starlight", "#f5f0e8"],
  ["Product Red", "#bf0013"],
  ["Natural", "#e8dcc8"],
  ["Uncoloured", "#f5f5f5", ["Undyed", "Unbleached"]],
];
