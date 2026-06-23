// A home for every islander - now a cottage you can actually walk INTO.
//
// The world has no interior scenes, so each house is a cutaway building drawn
// straight onto the island. Two stacked pieces share one open/closed state:
//   - the SHELL (top-down shingled roof + a front wall with the door), drawn on
//     top and Y-sorted by its south foot like any prop;
//   - the ROOM (wood floor, brick back wall, side walls and the resident's
//     furniture), Y-sorted by the house's NORTH edge so a player standing inside
//     always draws in front of it.
// When the player steps through the door into the footprint, the shell fades out
// and the room fades in - "le plafond disparait, l'interieur apparait" - and back
// again when they leave. The footprint is enclosed by wall blockers with a single
// door gap, so the only way in or out is the front door.
//
// Each home is made distinct three ways: the roof is tinted with the resident's
// signature colour, the footprint size varies (very wide on roomy islands), and
// every interior is furnished from a different themed set (see INTERIORS).

import { NPCS } from "./npcs.js";
import { worldTile } from "./data/islands.js";
import { TILE_SIZE } from "./tilesets.js";

const T = TILE_SIZE;
const COLOR_BY_NPC = Object.fromEntries(NPCS.map((n) => [n.id, n.color]));
const ISLAND_BY_NPC = Object.fromEntries(NPCS.map((n) => [n.id, n.island]));

// One cottage per islander. `door` is the island-LOCAL tile under the doorway
// (south-centre of the footprint); the house is W tiles wide and D tiles deep,
// extending NORTH from the door. Footprints were validated to sit fully on land
// and to clear every NPC, sign, chest, book, item and tree (see scripts).
export const HOUSES = [
  // Footprints sit entirely on grass - never on the dirt paths/clearings - and
  // extend NORTH from the door, so the only path tile they touch is the door's
  // own southern doorstep. Validated off every path, prop, sign and NPC.
  { npc: "kindor",     door: [13, 4], W: 5, D: 4, doorOpen: false },
  { npc: "tomeraider", door: [9, 3],  W: 5, D: 4, doorOpen: true },
  { npc: "xprience",   door: [12, 7], W: 5, D: 4, doorOpen: false },
  { npc: "empathus",   door: [14, 5], W: 5, D: 4, doorOpen: true },
  { npc: "gerard",     door: [5, 6],  W: 5, D: 4, doorOpen: false },
  { npc: "melodyssee", door: [10, 4], W: 5, D: 4, doorOpen: true },
];

// Themed interiors - a list of {s: sprite, ix, iy} per resident, placed on the
// interior tile grid (ix: 0 = left .. W-1 = right; iy: 0 = back-wall row ..
// D-1 = front/door row). This is what makes every home read differently inside.
const INTERIORS = {
  kindor: [ // a warm host's wide living room (W5 D4; door at ix2 of the front row)
    { s: "bedPinkMade", ix: 0, iy: 0 }, { s: "clock", ix: 2, iy: 0 }, { s: "dresser", ix: 4, iy: 0 },
    { s: "chairLeft", ix: 0, iy: 1 }, { s: "table", ix: 1, iy: 1 }, { s: "chairRight", ix: 2, iy: 1 }, { s: "stool", ix: 4, iy: 1 },
    { s: "rugGreen", ix: 1, iy: 2 }, { s: "plantTall", ix: 4, iy: 2 },
    { s: "plantSmall", ix: 0, iy: 3 }, { s: "stool", ix: 4, iy: 3 },
  ],
  tomeraider: [ // a reader's nook, a wall of books (W5 D4; door at ix2)
    { s: "dresser", ix: 0, iy: 0 }, { s: "dresser", ix: 1, iy: 0 },
    { s: "painting", ix: 3, iy: 0 }, { s: "plantSmall", ix: 4, iy: 0 },
    { s: "rugWideBlue", ix: 1, iy: 1 }, { s: "chairRight", ix: 3, iy: 1 },
    { s: "stool", ix: 1, iy: 2 }, { s: "plantTall", ix: 4, iy: 2 },
  ],
  xprience: [ // an explorer's bunk (W5 D4; door at ix2 of the front row)
    { s: "bedGreenMade", ix: 0, iy: 0 }, { s: "clock", ix: 2, iy: 0 }, { s: "plantTall", ix: 4, iy: 0 },
    { s: "rugGreen", ix: 2, iy: 1 }, { s: "stool", ix: 3, iy: 1 },
    { s: "dresser", ix: 0, iy: 2 }, { s: "plantSmall", ix: 4, iy: 2 },
    { s: "stool", ix: 0, iy: 3 }, { s: "plantSmall", ix: 4, iy: 3 },
  ],
  empathus: [ // a gardener's wide home, table set for guests (W5 D4; door at ix2)
    { s: "dresser", ix: 0, iy: 0 }, { s: "painting", ix: 2, iy: 0 }, { s: "plantSmall", ix: 4, iy: 0 },
    { s: "chairLeft", ix: 1, iy: 1 }, { s: "tableSmall", ix: 2, iy: 1 }, { s: "chairRight", ix: 3, iy: 1 },
    { s: "bedGreenMade", ix: 0, iy: 2 }, { s: "rugPink", ix: 2, iy: 2 }, { s: "plantFlower", ix: 4, iy: 2 },
    { s: "plantTall", ix: 1, iy: 3 }, { s: "plantTall", ix: 3, iy: 3 },
  ],
  gerard: [ // a debugger's wide workshop (W5 D4; door at ix2)
    { s: "dresser", ix: 0, iy: 0 }, { s: "clockTall", ix: 2, iy: 0 }, { s: "painting", ix: 4, iy: 0 },
    { s: "rugBlue", ix: 1, iy: 1 }, { s: "stool", ix: 3, iy: 1 },
    { s: "plantTall", ix: 0, iy: 2 }, { s: "stool", ix: 1, iy: 2 }, { s: "plantSmall", ix: 4, iy: 2 },
    { s: "stool", ix: 0, iy: 3 }, { s: "plantSmall", ix: 4, iy: 3 },
  ],
  melodyssee: [ // a musician's wide studio, posters on the wall (W5 D4; door at ix2)
    { s: "paintingNight", ix: 0, iy: 0 }, { s: "painting", ix: 1, iy: 0 }, { s: "paintingWide", ix: 3, iy: 0 },
    { s: "rugPink", ix: 2, iy: 1 },
    { s: "stool", ix: 0, iy: 2 }, { s: "plantTall", ix: 4, iy: 2 },
    { s: "plantTall", ix: 0, iy: 3 }, { s: "stool", ix: 4, iy: 3 },
  ],
};

// Pick the left/middle/right variant for column i of a width-w roof/wall row.
const col = (i, w, L, M, R) => (i === 0 ? L : i === w - 1 ? R : M);

const DOOR_HALF = 10; // half-width of the walkable door gap in the front wall

// Build every house into the world: the room + shell objects, the enclosing wall
// blockers (with a door gap), and the per-frame cutaway that opens the roof while
// the player is inside. Call AFTER the player exists so k.get("player") resolves.
export function buildHouses(k, map) {
  for (const h of HOUSES) {
    const [wx, wy] = worldTile(ISLAND_BY_NPC[h.npc], h.door);
    addHouse(k, wx, wy, h, map);
  }
}

function addHouse(k, tx, ty, h, map) {
  const { W, D } = h;
  const color = COLOR_BY_NPC[h.npc] ?? [255, 255, 255];
  const tint = k.rgb(...color);
  const doorSprite = h.doorOpen ? "houseDoorOpen" : "houseDoor";

  // Foot point: centre of the door column, base at the door tile's bottom.
  const fx = tx * T + T / 2;
  const fy = ty * T + T;
  const halfW = (W * T) / 2;
  const leftX = -halfW;        // local x of the west edge (origin at the door foot)
  const topY = -D * T;         // local y of the north (back) edge
  const wpx = W * T;

  // Shared cutaway state: 0 = roof on (outside), 1 = open (inside).
  const state = { open: 0 };

  // Interior surface colours.
  const FLOOR = k.rgb(196, 162, 116);
  const PLANK = k.rgb(168, 132, 88);
  const SIDE = k.rgb(120, 86, 54);

  // --- ROOM: floor + walls + furniture, drawn behind an inside player --------
  k.add([
    k.pos(fx, fy),
    k.layer("objects"),
    k.z(fy + topY), // sort by the north edge: a player standing inside draws in front
    "house",
    {
      draw() {
        const a = state.open;
        if (a < 0.02) return;

        // Wooden floor with plank seams.
        k.drawRect({ pos: k.vec2(leftX, topY), width: wpx, height: D * T, color: FLOOR, opacity: a });
        for (let r = 1; r < D; r++)
          k.drawRect({ pos: k.vec2(leftX, topY + r * T), width: wpx, height: 1, color: PLANK, opacity: a * 0.6 });

        // Brick back wall along the north row.
        for (let i = 0; i < W; i++)
          k.drawSprite({ sprite: col(i, W, "wallMidL", "wallMidM", "wallMidR"), pos: k.vec2(leftX + i * T, topY), anchor: "topleft", opacity: a });

        // Thin side walls.
        k.drawRect({ pos: k.vec2(leftX, topY), width: 3, height: D * T, color: SIDE, opacity: a });
        k.drawRect({ pos: k.vec2(halfW - 3, topY), width: 3, height: D * T, color: SIDE, opacity: a });

        // Furniture on the floor (anchored at each item's foot).
        for (const f of INTERIORS[h.npc] ?? []) {
          const x = leftX + (f.ix + 0.5) * T;
          const y = topY + (f.iy + 1) * T;
          k.drawSprite({ sprite: f.s, pos: k.vec2(x, y), anchor: "bot", opacity: a });
        }
      },
    },
  ]);

  // --- SHELL: top-down roof + front wall + door, Y-sorted by the south foot ---
  const shell = k.add([
    k.pos(fx, fy),
    k.layer("objects"),
    k.z(fy),
    "house",
    {
      draw() {
        const a = 1 - state.open;
        if (a < 0.02) return;

        // Top-down shingled roof over the back D-1 rows (caps, shingles, eave),
        // tinted with the resident's colour.
        const roofRows = D - 1;
        for (let r = 0; r < roofRows; r++) {
          const y = topY + r * T;
          const band = r === 0 ? ["roofCapL", "roofCapM", "roofCapR"]
            : r === roofRows - 1 ? ["roofEaveL", "roofEaveM", "roofEaveR"]
            : ["roofShL", "roofShM", "roofShR"];
          for (let i = 0; i < W; i++)
            k.drawSprite({ sprite: col(i, W, band[0], band[1], band[2]), pos: k.vec2(leftX + i * T, y), anchor: "topleft", color: tint, opacity: a });
        }

        // Front wall (plank base) across the south row, with the door centred.
        for (let i = 0; i < W; i++)
          k.drawSprite({ sprite: col(i, W, "wallBotL", "wallBotM", "wallBotR"), pos: k.vec2(leftX + i * T, -T), anchor: "topleft", opacity: a });
        k.drawSprite({ sprite: doorSprite, pos: k.vec2(-T / 2, -T), anchor: "topleft", opacity: a });
      },
    },
  ]);

  // Open the roof while the player stands inside the footprint, ease it shut on
  // the way out. The walls keep the player out unless they use the door, so being
  // in this region reliably means "inside".
  shell.onUpdate(() => {
    const p = k.get("player")[0];
    let inside = false;
    if (p) {
      const dx = p.pos.x - fx;
      const dy = p.pos.y - fy;
      inside = dx > leftX && dx < halfW && dy < -2 && dy > topY - 4;
    }
    const target = inside ? 1 : 0;
    state.open += (target - state.open) * Math.min(1, k.dt() * 10);
  });

  // Solid walls around the footprint, leaving a door gap at the front centre.
  map.addBlocker({ x: fx + leftX - 2, y: fy + topY, w: 5, h: D * T });            // left wall
  map.addBlocker({ x: fx + halfW - 3, y: fy + topY, w: 5, h: D * T });            // right wall
  map.addBlocker({ x: fx + leftX, y: fy + topY - 2, w: wpx, h: 6 });              // back wall
  map.addBlocker({ x: fx + leftX, y: fy - 5, w: halfW - DOOR_HALF, h: 10 });      // front, left of door
  map.addBlocker({ x: fx + DOOR_HALF, y: fy - 5, w: halfW - DOOR_HALF, h: 10 });  // front, right of door

  return shell;
}
