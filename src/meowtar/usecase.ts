import { defineUseCase, mountString } from "../kit/index";
import { meowtarTraits, type MeowtarTraits, type MeowtarOverrides } from "./traits";
import { resolveMeowtar } from "./resolve";
import { drawCat, type MeowtarConfig } from "./draw";

/**
 * The cat as a uniform use case. It produces an SVG string, so `mount` delegates
 * to the shared `mountString` renderer — no canvas, no render loop. No `controls`
 * since the cat has no constant traits.
 */
export const catUseCase = defineUseCase<MeowtarTraits, MeowtarConfig>({
  id: "meowtar",
  name: "Cat avatar",
  traits: meowtarTraits,
  mount: (container, seed, options = {}) =>
    mountString<MeowtarConfig>(
      container,
      seed,
      (s, overrides) => resolveMeowtar(s, overrides as MeowtarOverrides),
      drawCat,
      options,
    ),
});
