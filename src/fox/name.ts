/**
 * A deterministic display name for the fox, drawn from the seed on its own hash
 * label so it never disturbs the visual traits. Used in the SVG's aria-label and
 * exposed on the resolved config.
 */

import { sampleUnit } from "../core/index";

const NAMES = [
  "Ember",
  "Sorrel",
  "Pippin",
  "Vixen",
  "Rusty",
  "Maple",
  "Cinder",
  "Birch",
  "Hazel",
  "Fennec",
  "Saffron",
  "Clover",
  "Juniper",
  "Bramble",
  "Foxglove",
  "Amber",
  "Marigold",
  "Tamarind",
  "Sienna",
  "Copper",
  "Ginger",
  "Aspen",
  "Willow",
  "Nutmeg",
  "Thistle",
  "Reynard",
  "Basil",
  "Dusk",
  "Sol",
  "Rowan",
];

/** Pick a name deterministically from the seed. */
export function nameFor(seed: string): string {
  return NAMES[Math.floor(sampleUnit(seed, "fox.name") * NAMES.length)];
}
