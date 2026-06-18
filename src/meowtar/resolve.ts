import { merge, derive, sampleUnit } from "../core/index";
import {
  meowtarTraits,
  type MeowtarTraits,
  type MeowtarValues,
  type MeowtarOverrides,
} from "./traits";
import { buildPalette } from "./palette";
import { nameFor } from "./name";
import type { MeowtarConfig } from "./draw";

/** Resolve a seed (and optional overrides) into a fully-derived cat config:
 *  trait values + palette + name + a placement seed for markings. */
export function resolveMeowtar(seed: string, overrides?: MeowtarOverrides): MeowtarConfig {
  const values: MeowtarValues = derive(merge<MeowtarTraits>(meowtarTraits, overrides), seed);
  const rngSeed = Math.floor(sampleUnit(seed, "meowtar.marks") * 4294967296);
  return { ...values, palette: buildPalette(values), name: nameFor(seed), rngSeed };
}
