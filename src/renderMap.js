// Turns the composed world grid into kaplay game objects across the layer stack.
//
// Terrain is built as stacked passes inside the "terrain" layer so the blob
// tiles' transparent corners reveal what sits beneath them:
//   water (animated base)  ->  grass islands  ->  dirt patches  ->  bridges
// A 'd' cell therefore implies grass-under-dirt and water-under-grass, which is
// why a single readable character grid produces correct coastlines and paths.
// A 'b' cell is a walkable bridge deck over water (not grass).
//
// The world is mostly open sea. Rather than spawn a water sprite per tile, a
// single ocean object (addOcean) tiles the animated water across the whole
// visible viewport every frame, snapped to the world grid so it sits beneath the
// land and animates the coastlines revealed through the grass tiles' transparent
// corners. The sea therefore always fills the screen - no flat-blue gaps.
//
// Objects go in the "objects" layer, anchored at their base and given z = base
// Y so they Y-sort against each other and the player (see attachYSort).
import { TILE_SIZE, GRASS_AUTOTILE_FRAMES, DIRT_AUTOTILE_FRAMES } from "./tilesets.js";
import { autotileFrame } from "./autotile.js";

const Z_WATER = 0;
const Z_GRASS = 1;
const Z_DIRT = 2;
const Z_BRIDGE = 3;
// Flat ground decals (rugs / picnic blankets / mats). They lie ON the ground and
// must never occlude the player, so they live in the terrain layer (always drawn
// below the objects layer) rather than being Y-sorted like upright props.
const Z_FLAT = 4;

// Animation of the open sea: the Water sprite has FRAMES frames cycled at SPEED
// per second (matching the old "flow" anim).
const WATER_FRAMES = 4;
const WATER_SPEED = 6;

// Object types that physically block the player. Everything not listed here
// (flowers, mushrooms, grass tufts, ...) can be freely walked over. Keep this
// list small and focused on solid props.
export const BLOCKING_TYPES = new Set([
  "tree", "treeBig", "appleTree",
  "rockSmall", "rockBig", "boulder",
  "stump", "stumpSmall", "log",
  "bush", "berryBush",
  "sign", "hedge", "hedgeBig",
  // structures + fences read as solid props
  "chickenHouse", "table", "dresser", "clockTall",
  "fenceTop", "fenceVert", "fenceBottom", "fencePost",
  "fenceLeft", "fenceMid", "fenceRight",
]);

// Ground-level decorations the player walks over/through and that should never
// occlude the character: floor mats, low seats, and small flora. They render in
// the terrain layer (always below the objects layer) instead of being Y-sorted
// as upright props - which is what made the player draw "behind" them. Tall or
// solid props (trees, tables, bushes, signs...) stay Y-sorted so you can still
// walk behind them.
const FLAT_TYPES = new Set([
  // rugs & picnic blankets you stand on
  "rugGreen", "rugPink", "rugBlue",
  "rugWideGreen", "rugWidePink", "rugWideBlue",
  // low seats you can walk over
  "stool", "stoolSmall",
  // ground-level flora the player walks through
  "flowerPink", "flowerYellow", "flowerPinkSmall", "flowersPink", "flowersYellow",
  "grassTuft", "grassTufts", "grassPlant", "seedling", "berryTiny", "pebble",
]);

// Trees have a thin trunk under a wide leafy canopy, so only the trunk blocks:
// the player can stroll *behind* the canopy. Their footprint is a small box at
// the base centre.
const TREE_TYPES = new Set(["tree", "treeBig", "appleTree"]);
const TRUNK_HALF_W = 6;
const TRUNK_H = 7;

// Every other solid prop (hedge, bush, rock, sign, fence, furniture...) is a
// low, opaque mass you walk *around* - not behind. Its footprint covers the
// whole base tile (full sprite width, nearly the full tile height) so the player
// can never tuck in behind it and end up half-buried with only its head showing.
// halfWidth defaults to ~half a tile; wider sprites override it. Height is one
// near-full tile, leaving a 2px lip at the very foot.
const SOLID_FOOT_H = 14;
const SOLID_HALF_W = { hedge: 15, hedgeBig: 23 };

// Sample points covering the character's lower body, offset from its feet point
// (pos sits at the feet; the ~16px sprite body rises *above* it). Requiring all
// of them to be on land keeps the body off the water, not just the feet - so the
// character can't drift over a coastline with its torso hanging above the sea.
// The asymmetry is deliberate: -10 reaches up into the body (you stop well short
// of an upper/north shore), while +2 only nudges past the feet (you can still
// hug a lower/south shore, where the body leans safely inland).
const BODY_HALF_W = 5;
const BODY_TOP = -12; // reaches up into the body; larger = stops further from an upper shore
const BODY_SAMPLES = [
  [-BODY_HALF_W, BODY_TOP], [0, BODY_TOP], [BODY_HALF_W, BODY_TOP],
  [-BODY_HALF_W, 0],        [0, 0],        [BODY_HALF_W, 0],
  [-BODY_HALF_W, 2],        [0, 2],        [BODY_HALF_W, 2],
];

export function buildMap(k, mapData) {
  const rows = mapData.terrain;
  const height = rows.length;
  const width = rows[0].length;

  const at = (x, y) => (y < 0 || y >= height || x < 0 || x >= width ? "" : rows[y][x]);
  const isGrass = (x, y) => { const c = at(x, y); return c === "g" || c === "d"; };
  const isDirt = (x, y) => at(x, y) === "d";
  // Walkable surface: grass, dirt, and bridge decks (over water).
  const isWalkable = (x, y) => { const c = at(x, y); return c === "g" || c === "d" || c === "b"; };

  // Animated sea filling the whole screen, drawn beneath the land.
  addOcean(k);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const wx = x * TILE_SIZE;
      const wy = y * TILE_SIZE;

      if (isGrass(x, y)) {
        k.add([
          k.sprite("grass", { frame: autotileFrame(GRASS_AUTOTILE_FRAMES, isGrass, x, y) }),
          k.pos(wx, wy),
          k.layer("terrain"),
          k.z(Z_GRASS),
        ]);
      }

      if (isDirt(x, y)) {
        k.add([
          k.sprite("dirt", { frame: autotileFrame(DIRT_AUTOTILE_FRAMES, isDirt, x, y) }),
          k.pos(wx, wy),
          k.layer("terrain"),
          k.z(Z_DIRT),
        ]);
      }
    }
  }

  // Bridge spans drawn over the water gaps. A single sprite per bridge sits flat
  // in the terrain layer (below all objects/the player, so you walk on top).
  for (const b of mapData.bridges ?? []) {
    const sprite = b.orient === "v" ? "bridgeVertical" : "bridgeHorizontal";
    k.add([
      k.sprite(sprite),
      k.pos(b.x * TILE_SIZE, b.y * TILE_SIZE),
      k.anchor("topleft"),
      k.layer("terrain"),
      k.z(Z_BRIDGE),
    ]);
  }

  const blockers = [];
  for (const obj of mapData.objects ?? []) {
    const px = obj.x * TILE_SIZE + TILE_SIZE / 2; // horizontal center of the tile
    const py = obj.y * TILE_SIZE + TILE_SIZE;     // base sits at bottom of the tile
    const flat = FLAT_TYPES.has(obj.type);
    // A "book" has no sprite in the asset set, so it's drawn as a small upright
    // primitive (cover/pages/spine) instead of a k.sprite (used for clue books).
    const isBook = obj.type === "book";
    const comps = [
      k.pos(px, py),
      k.anchor("bot"),
      // flat mats lie on the ground (terrain layer, below the player); upright
      // props live in the objects layer and Y-sort against the player by base Y.
      k.layer(flat ? "terrain" : "objects"),
      k.z(flat ? Z_FLAT : py),
      "mapObject",
    ];
    if (isBook) comps.unshift(k.color(...(obj.color ?? [150, 120, 200])));
    else comps.unshift(k.sprite(obj.type));
    // Props with a `label` reveal that text when the player walks near (puzzle
    // clues); world.js reads the tag + stored text to draw the floating label.
    if (obj.label) comps.push({ labelText: obj.label }, "labeled");
    const added = k.add(comps);
    if (isBook) added.onDraw(() => drawClueBook(k, added.color));
    if (BLOCKING_TYPES.has(obj.type)) {
      if (TREE_TYPES.has(obj.type)) {
        blockers.push({ x: px - TRUNK_HALF_W, y: py - TRUNK_H, w: 2 * TRUNK_HALF_W, h: TRUNK_H });
      } else {
        const hw = SOLID_HALF_W[obj.type] ?? 7;
        blockers.push({ x: px - hw, y: py - SOLID_FOOT_H, w: 2 * hw, h: SOLID_FOOT_H });
      }
    }
  }

  // Walkable ground (grass/dirt/bridge) under a single world pixel; open water
  // and off-map are not.
  const isLand = (px, py) => isWalkable(Math.floor(px / TILE_SIZE), Math.floor(py / TILE_SIZE));
  const isBlocked = (px, py) =>
    blockers.some((b) => px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h);

  return {
    width,
    height,
    pixelWidth: width * TILE_SIZE,
    pixelHeight: height * TILE_SIZE,
    // Register an extra solid box at runtime (e.g. an NPC's footprint) so the
    // player collides with it just like a static blocking prop.
    addBlocker: (box) => blockers.push(box),
    // Whether the player's feet (a world pixel) may rest here: the character's
    // lower body stays on land (no drifting over a coastline) and the feet are
    // outside any blocking prop's solid base.
    canStand: (px, py) =>
      !isBlocked(px, py) && BODY_SAMPLES.every(([dx, dy]) => isLand(px + dx, py + dy)),
  };
}

// A single object that paints the animated sea across the entire visible
// viewport, tiled and snapped to the world grid, sitting below the land
// (Z_WATER). Because it follows the camera every frame the sea always fills the
// screen - there is no flat-blue far ocean - and because the tiles are locked to
// the world grid the coastlines revealed through the grass tiles' transparent
// corners line up and animate as before. Drawing is immediate-mode and the
// camera is zoomed in, so only a few hundred tiles are painted per frame.
function addOcean(k) {
  k.add([
    k.layer("terrain"),
    k.z(Z_WATER),
    {
      draw() {
        const frame = Math.floor(k.time() * WATER_SPEED) % WATER_FRAMES;
        const cam = k.getCamPos();
        const scale = k.getCamScale();
        const halfW = k.width() / 2 / scale.x;
        const halfH = k.height() / 2 / scale.y;
        // Snap the start down to the tile grid and bleed one tile past every edge
        // so the camera never reveals an un-painted seam.
        const left = Math.floor((cam.x - halfW) / TILE_SIZE) * TILE_SIZE - TILE_SIZE;
        const top = Math.floor((cam.y - halfH) / TILE_SIZE) * TILE_SIZE - TILE_SIZE;
        const right = cam.x + halfW + TILE_SIZE;
        const bottom = cam.y + halfH + TILE_SIZE;
        for (let y = top; y < bottom; y += TILE_SIZE)
          for (let x = left; x < right; x += TILE_SIZE)
            k.drawSprite({ sprite: "water", frame, pos: k.vec2(x, y), anchor: "topleft" });
      },
    },
  ]);
}

// A small upright closed-book primitive (cover, peeking pages, spine) for clue
// books that have no sprite in the asset set. `color` is a kaplay Color (the
// object's k.color component) tinting the cover. Mirrors the closed-book look
// used for grove books in world.js.
function drawClueBook(k, color) {
  const { r, g, b } = color;
  const cover = k.rgb(r, g, b);
  const dark = k.rgb(Math.max(0, r - 55), Math.max(0, g - 55), Math.max(0, b - 55));
  const page = k.rgb(248, 240, 214);
  k.drawRect({ pos: k.vec2(0, 0), width: 9, height: 12, radius: 1, anchor: "bot", color: cover });
  k.drawRect({ pos: k.vec2(2, -1), width: 4, height: 10, anchor: "bot", color: page });
  k.drawRect({ pos: k.vec2(-3.5, 0), width: 2, height: 12, anchor: "bot", color: dark });
}

// Keep a moving object's draw order (z) in sync with its base Y, so it slips
// behind objects whose base is lower on screen and in front of those above it.
// Call with the object's foot offset (distance from pos to the base) if its
// anchor isn't already at the base.
export function attachYSort(obj, footOffset = 0) {
  obj.onUpdate(() => {
    obj.z = obj.pos.y + footOffset;
  });
}
