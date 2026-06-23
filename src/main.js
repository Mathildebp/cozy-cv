// Entry point: boot kaplay, load every asset, register the scenes, start at the
// title. Game logic lives in the scene modules (title -> world(xN) -> assembly).

import kaplay from "kaplay";
import { loadAllAssets } from "./assets.js";
import { registerTitle } from "./scenes/title.js";
import { registerWorld } from "./scenes/world.js";
import { registerAssembly } from "./scenes/assembly.js";
import { initAnalytics } from "./analytics.js";

initAnalytics();

const k = kaplay({
  background: [125, 196, 214], // sea blue beyond the island edges
  crisp: true, // keep pixel art sharp
});

k.loadRoot("./"); // good for itch.io publishing later

// Draw order: terrain (ground) -> objects (Y-sorted, includes the player) -> ui.
k.setLayers(["terrain", "objects", "ui"], "objects");

loadAllAssets(k);

registerTitle(k);
registerWorld(k);
registerAssembly(k);

k.go("title");
