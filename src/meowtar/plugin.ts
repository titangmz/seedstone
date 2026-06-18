import { definePlugin, mountString, buildLabControls } from "../core/index";
import { meowtarTraits, resolveMeowtar, type MeowtarTraits, type MeowtarOverrides } from "./config";
import { drawCat, type MeowtarConfig } from "./draw";

export const catPlugin = definePlugin<MeowtarTraits, MeowtarConfig>({
  id: "meowtar",
  name: "Cat avatar",
  traits: meowtarTraits,
  lab: buildLabControls(meowtarTraits),
  mount: (container, seed, options = {}) =>
    mountString<MeowtarConfig>(
      container,
      seed,
      (s, overrides) => resolveMeowtar(s, overrides as MeowtarOverrides),
      drawCat,
      options,
    ),
});
