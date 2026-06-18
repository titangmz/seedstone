import { describe, it, expect } from "vitest";
import { gemSceneFactory } from "../src/gem/scene";
import { derive } from "../src/core/index";

// The gem is just one SceneFactory. We can't drive the Viewer without a real
// WebGL context, but we can assert the contract shape and that the gem's traits
// satisfy the toolkit's ViewerConfig convention (renderer + camera blocks).
describe("gem scene factory (toolkit contract)", () => {
  it("exposes traits + createScene", () => {
    expect(typeof gemSceneFactory.createScene).toBe("function");
    expect(gemSceneFactory.traits).toBeTruthy();
  });

  it("traits resolve to a ViewerConfig-shaped config", () => {
    const c = derive(gemSceneFactory.traits, "alice") as any;
    expect(typeof c.renderer.maxFrameDelta).toBe("number");
    expect(typeof c.renderer.transmissionResolutionScale).toBe("number");
    expect(typeof c.camera.fov).toBe("number");
    expect(Array.isArray(c.camera.position)).toBe(true);
    expect(c.camera.position).toHaveLength(3);
  });
});
