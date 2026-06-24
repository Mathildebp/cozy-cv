// The one and only exploration scene. The whole archipelago is a single map:
// terrain, props, NPCs, items and bridges are all built once at world
// coordinates, and the camera simply follows the player across it. Crossing a
// bridge is just walking - no scene swap.
//
// Responsibilities: compose + build the world, spawn the player and every
// island's NPCs (and collectible items), follow with the camera, draw the HUD,
// a soft mood tint that eases to match whichever island you're on, an
// island-name banner as you arrive, and route the single "interact" button to
// whatever the player is standing next to (NPC or lost item).

import { TILE_SIZE } from "../tilesets.js";
import { buildMap, attachYSort } from "../renderMap.js";
import { ISLANDS, ISLAND_BY_ID, START, composeWorld, worldTile, GAME_CHESTS, ALL_BOOKS, GUESTBOOK } from "../data/islands.js";
import { NPCS } from "../npcs.js";
import { buildHouses } from "../houses.js";
import { MINIGAMES } from "../minigames/index.js";
import { addHud } from "../ui/hud.js";
import { addTouchControls, touchControls } from "../ui/touchControls.js";
import { drawBrick } from "../ui/brick.js";
import { say, dialogue, CANCELLED } from "../ui/dialogue.js";
import { earnBrick, hasBrick, brickFor, allBricksEarned } from "../state.js";
import { runtime } from "../runtime.js";
import { track } from "../analytics.js";
import { openGuestbook } from "../ui/guestbook.js";
import { playStep, playPickup, playChest, playBook, playBrickEarned } from "../audio/sound.js";

const IDLE_FRAME = { down: 0, up: 4, left: 8, right: 12 };
const SPEED = 80;
const INTERACT_DIST = 22;
const LABEL_DIST = 28;

const tilePos = (tx, ty) => k_vec(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE);
let k_vec = null; // set in registerWorld so helpers can build vecs

function dirTo(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
}

// Which island (if any) a world tile belongs to - used for the mood tint and
// the arrival banner. Returns null over water/bridges.
function islandAt(tx, ty) {
  for (const isl of ISLANDS) {
    const [ox, oy] = isl.origin;
    const lx = tx - ox;
    const ly = ty - oy;
    if (ly >= 0 && ly < isl.terrain.length && lx >= 0 && lx < isl.terrain[0].length) {
      const ch = isl.terrain[ly][lx];
      if (ch === "g" || ch === "d") return isl;
    }
  }
  return null;
}

export function registerWorld(k) {
  k_vec = (x, y) => k.vec2(x, y);

  k.scene("world", () => {
    const comp = composeWorld();
    const map = buildMap(k, { terrain: comp.terrain, objects: comp.objects, bridges: comp.bridges });

    // A home for every islander (decorative structures + foot blockers).
    buildHouses(k, map);

    // Soft full-screen mood tint that eases toward the current island's colour.
    const tint = { r: 255, g: 224, b: 150, a: 0 };
    const startIsl = islandAt(START.spawn[0], START.spawn[1]);
    if (startIsl?.ambient) {
      const [r, g, b, a] = startIsl.ambient;
      Object.assign(tint, { r, g, b, a });
    }
    k.add([k.fixed(), k.layer("ui"), k.z(0), {
      draw() { k.drawRect({ width: k.width(), height: k.height(), color: k.rgb(tint.r, tint.g, tint.b), opacity: tint.a }); },
    }]);

    // --- Player ---
    const player = k.add([
      k.sprite("character"),
      k.pos(tilePos(START.spawn[0], START.spawn[1])),
      k.anchor(k.vec2(0, 1 / 3)),
      k.layer("objects"),
      k.z(0),
      "player", // houses read this to fade their roof when you step inside
    ]);
    attachYSort(player);
    player.frame = IDLE_FRAME[START.face] ?? 0;

    // Props carrying a `label` (e.g. the puzzle clues) reveal their text as a
    // small plate above them when the player stands close, fading in with range.
    // Only the single closest labeled prop shows its plate, so adjacent clues
    // never overlap their text.
    const labeled = k.get("labeled");
    for (const prop of labeled) {
      prop.onDraw(() => {
        const d = player.pos.dist(prop.pos);
        if (d > LABEL_DIST) return;
        // Suppress this label if another labeled prop is strictly closer.
        for (const other of labeled) {
          if (other !== prop && player.pos.dist(other.pos) < d) return;
        }
        const fade = Math.min(1, (LABEL_DIST - d) / 8);
        const measured = k.formatText({ text: prop.labelText, font: "sprout", size: 8 });
        k.drawRect({ pos: k.vec2(0, -26), width: measured.width + 8, height: 13, radius: 3, anchor: "center", color: k.rgb(40, 30, 22), opacity: 0.6 * fade });
        k.drawText({ text: prop.labelText, font: "sprout", size: 8, pos: k.vec2(0, -26), anchor: "center", color: k.rgb(255, 255, 255), opacity: fade });
      });
    }

    // --- NPCs (every island, placed at world coordinates) ---
    // Tracks the closest NPC within reach so a "press E" prompt can float above
    // them; recomputed each frame in the update loop below.
    let ctaNpc = null;
    const npcs = NPCS.map((def) => {
      const [wx, wy] = worldTile(def.island, def.tile);
      const obj = k.add([
        k.sprite("character"),
        k.color(...def.color),
        k.pos(tilePos(wx, wy)),
        k.anchor(k.vec2(0, 1 / 3)),
        k.layer("objects"),
        k.z(0),
        { def, facing: def.facing, home: tilePos(wx, wy), t: k.rand(1, 3), target: null },
      ]);
      attachYSort(obj);
      obj.frame = IDLE_FRAME[def.facing];
      map.addBlocker({ x: obj.pos.x - 5, y: obj.pos.y - 6, w: 10, h: 6 });
      attachNpcBehavior(k, obj, map);
      obj.onDraw(() => {
        if (obj === ctaNpc) drawNpcCta(k, def.color, def.name);
        if (hasBrick(def.id)) return;
        const bob = Math.sin(k.time() * 3) * 2;
        k.drawCircle({ pos: k.vec2(0, -22 + bob), radius: 4, color: k.rgb(...def.color), opacity: 0.95, anchor: "center" });
        k.drawCircle({ pos: k.vec2(0, -22 + bob), radius: 7, color: k.rgb(...def.color), opacity: 0.25, anchor: "center" });
      });
      return obj;
    });

    // --- Collectible items (Empathus's lost things, at world coordinates) ---
    const items = [];
    for (const isl of ISLANDS) {
      const [ox, oy] = isl.origin;
      for (const it of isl.items ?? []) {
        if (runtime.pickedItems.has(it.id)) continue;
        const wx = ox + it.x;
        const wy = oy + it.y;
        const obj = k.add([
          k.sprite(it.type),
          k.pos(tilePos(wx, wy)),
          k.anchor("bot"),
          k.layer("objects"),
          k.z(0),
          { item: it },
        ]);
        attachYSort(obj);
        obj.onDraw(() => {
          const bob = Math.sin(k.time() * 3 + wx) * 1.5;
          k.drawCircle({ pos: k.vec2(0, -14 + bob), radius: 3, color: k.rgb(255, 244, 200), opacity: 0.9, anchor: "center" });
        });
        items.push(obj);
      }
    }

    // --- Memory chests (XP Rience's, opened in the world like a pickup) ---
    // A bubble bobs over each closed chest; opening it swaps to the open-lid
    // sprite (kept open), drops the bubble, and reveals a game memory or junk.
    const chests = [];
    for (const isl of ISLANDS) {
      const [ox, oy] = isl.origin;
      for (const ch of isl.chests ?? []) {
        const wx = ox + ch.x;
        const wy = oy + ch.y;
        const obj = k.add([
          k.sprite(runtime.openedChests.has(ch.id) ? "chestOpen" : "chestClosed"),
          k.pos(tilePos(wx, wy)),
          k.anchor("bot"),
          k.layer("objects"),
          k.z(0),
          { chest: ch, opened: runtime.openedChests.has(ch.id) },
        ]);
        attachYSort(obj);
        obj.onDraw(() => {
          if (obj.opened) return;
          const bob = Math.sin(k.time() * 3 + wx) * 1.5;
          k.drawCircle({ pos: k.vec2(0, -18 + bob), radius: 3, color: k.rgb(255, 244, 200), opacity: 0.9, anchor: "center" });
        });
        chests.push(obj);
      }
    }

    // --- Books (Tome Raider's, read in the world like a pickup) ---
    // There is no book sprite in the asset set, so each book is drawn as a small
    // primitive: an upright closed book with a bobbing bubble while unread, then
    // an open spread (bubble gone) once read. Reading them all lets Tome Raider
    // hand over the Imagination brick (see minigames/index.js).
    const books = [];
    for (const isl of ISLANDS) {
      const [ox, oy] = isl.origin;
      for (const bk of isl.books ?? []) {
        const wx = ox + bk.x;
        const wy = oy + bk.y;
        const obj = k.add([
          k.pos(tilePos(wx, wy)),
          k.anchor("bot"),
          k.layer("objects"),
          k.z(0),
          { book: bk, read: runtime.readBooks.has(bk.id) },
        ]);
        attachYSort(obj);
        obj.onDraw(() => {
          drawBook(k, bk.color, obj.read);
          if (obj.read) return;
          const bob = Math.sin(k.time() * 3 + wx) * 1.5;
          k.drawCircle({ pos: k.vec2(0, -18 + bob), radius: 3, color: k.rgb(255, 244, 200), opacity: 0.9, anchor: "center" });
        });
        books.push(obj);
      }
    }

    // --- Guestbook mailbox (hub): an always-open spot to leave a free-text
    // note, drawn as a small primitive (no mailbox sprite in the asset set, same
    // as the books). A bobbing bubble invites interaction; a "Guestbook" plate
    // appears when the player is near. Interacting opens the guestbook overlay.
    const [gbx, gby] = worldTile(GUESTBOOK.island, GUESTBOOK.tile);
    const mailbox = k.add([
      k.pos(tilePos(gbx, gby)),
      k.anchor("bot"),
      k.layer("objects"),
      k.z(0),
      "guestbook",
    ]);
    attachYSort(mailbox);
    map.addBlocker({ x: mailbox.pos.x - 7, y: mailbox.pos.y - 12, w: 14, h: 12 });
    mailbox.onDraw(() => {
      drawMailbox(k);
      const near = player.pos.dist(mailbox.pos) <= LABEL_DIST;
      const bob = Math.sin(k.time() * 3) * 1.5;
      k.drawCircle({ pos: k.vec2(0, -30 + bob), radius: 3, color: k.rgb(255, 244, 200), opacity: near ? 1 : 0.7, anchor: "center" });
      if (near) {
        const text = "Guestbook · E";
        const measured = k.formatText({ text, font: "sprout", size: 8 });
        k.drawRect({ pos: k.vec2(0, -40), width: measured.width + 8, height: 13, radius: 3, anchor: "center", color: k.rgb(40, 30, 22), opacity: 0.6 });
        k.drawText({ text, font: "sprout", size: 8, pos: k.vec2(0, -40), anchor: "center", color: k.rgb(255, 255, 255) });
      }
    });

    addHud(k);

    // Banner for the island you start on.
    let currentIsland = startIsl?.id ?? null;
    if (startIsl) { showBanner(k, startIsl.name); track("island_entered", { island: startIsl.id, name: startIsl.name }); }

    // --- Movement ---
    let facing = START.face ?? "down";
    let walking = false;
    let fidgeting = false;
    let idleTimer = k.rand(2, 5);
    let interactLock = 0;
    let stepTimer = 0; // counts down to the next footstep blip while walking

    k.onUpdate(() => {
      k.setCamPos(player.pos);
      if (interactLock > 0) interactLock -= k.dt();

      // Highlight the nearest NPC in reach with an interact prompt.
      ctaNpc = null;
      if (!dialogue.active && interactLock <= 0) {
        let bd = INTERACT_DIST;
        for (const obj of npcs) {
          const d = player.pos.dist(obj.pos);
          if (d < bd) { ctaNpc = obj; bd = d; }
        }
      }

      // Ease the mood tint toward the island the player is on (clear over water).
      const here = islandAt(Math.floor(player.pos.x / TILE_SIZE), Math.floor((player.pos.y - 1) / TILE_SIZE));
      if (here && here.id !== currentIsland) { currentIsland = here.id; showBanner(k, here.name); track("island_entered", { island: here.id, name: here.name }); }
      const target = here?.ambient ?? [tint.r, tint.g, tint.b, 0];
      tint.r += (target[0] - tint.r) * Math.min(1, k.dt() * 3);
      tint.g += (target[1] - tint.g) * Math.min(1, k.dt() * 3);
      tint.b += (target[2] - tint.b) * Math.min(1, k.dt() * 3);
      tint.a += ((target[3] ?? 0) - tint.a) * Math.min(1, k.dt() * 3);

      if (dialogue.active) {
        if (walking) { walking = false; player.stop(); player.frame = IDLE_FRAME[facing]; }
        return;
      }

      const tdir = touchControls.moveDir;
      const dir = k.vec2(
        (k.isKeyDown("right") ? 1 : 0) - (k.isKeyDown("left") ? 1 : 0) + tdir.x,
        (k.isKeyDown("down") ? 1 : 0) - (k.isKeyDown("up") ? 1 : 0) + tdir.y,
      );

      if (dir.x === 0 && dir.y === 0) {
        if (walking) {
          walking = false; fidgeting = false; player.stop();
          player.frame = IDLE_FRAME[facing]; idleTimer = k.rand(1, 2);
        }
        if (!fidgeting) {
          idleTimer -= k.dt();
          if (idleTimer <= 0) {
            fidgeting = true;
            player.play("idle-" + facing, { onEnd: () => { fidgeting = false; player.frame = IDLE_FRAME[facing]; idleTimer = k.rand(1, 2); } });
          }
        }
        return;
      }

      // Move each axis, with a small perpendicular "slip" when blocked so the
      // player funnels into narrow openings (notably the 1-tile-wide vertical
      // bridge mouths) instead of getting stuck on the wide shore beside them.
      const SLIP = [2, -2, 4, -4, 6, -6];
      const step = dir.unit().scale(SPEED * k.dt());
      if (step.x !== 0) {
        if (map.canStand(player.pos.x + step.x, player.pos.y)) player.pos.x += step.x;
        else for (const n of SLIP)
          if (map.canStand(player.pos.x + step.x, player.pos.y + n) && map.canStand(player.pos.x, player.pos.y + n)) { player.pos.y += n; break; }
      }
      if (step.y !== 0) {
        if (map.canStand(player.pos.x, player.pos.y + step.y)) player.pos.y += step.y;
        else for (const n of SLIP)
          if (map.canStand(player.pos.x + n, player.pos.y + step.y) && map.canStand(player.pos.x + n, player.pos.y)) { player.pos.x += n; break; }
      }

      const next = Math.abs(dir.x) > Math.abs(dir.y) ? (dir.x < 0 ? "left" : "right") : dir.y < 0 ? "up" : "down";
      if (!walking || next !== facing) { walking = true; fidgeting = false; facing = next; player.play("walk-" + facing); stepTimer = 0; }

      // Footsteps, paced to the walk cycle (a soft tap every ~0.3s of walking).
      stepTimer -= k.dt();
      if (stepTimer <= 0) { playStep(); stepTimer = 0.3; }
    });

    // --- Interact button ---
    const interact = () => {
      if (dialogue.active || interactLock > 0) return;

      let best = null, bestD = INTERACT_DIST;
      for (const obj of items) {
        if (!obj.exists()) continue;
        const d = player.pos.dist(obj.pos);
        if (d < bestD) { best = { kind: "item", obj }; bestD = d; }
      }
      for (const obj of chests) {
        if (obj.opened) continue;
        const d = player.pos.dist(obj.pos);
        if (d < bestD) { best = { kind: "chest", obj }; bestD = d; }
      }
      for (const obj of books) {
        if (obj.read) continue;
        const d = player.pos.dist(obj.pos);
        if (d < bestD) { best = { kind: "book", obj }; bestD = d; }
      }
      for (const obj of npcs) {
        const d = player.pos.dist(obj.pos);
        if (d < bestD) { best = { kind: "npc", obj }; bestD = d; }
      }
      const dMail = player.pos.dist(mailbox.pos);
      if (dMail < bestD) { best = { kind: "guestbook", obj: mailbox }; bestD = dMail; }
      if (!best) return;

      if (best.kind === "item") {
        const it = best.obj.item;
        runtime.pickedItems.add(it.id);
        playPickup();
        toast(k, best.obj.pos.clone(), "Picked up the " + it.name);
        k.destroy(best.obj);
        return;
      }

      if (best.kind === "chest") {
        const obj = best.obj;
        const ch = obj.chest;
        obj.opened = true;
        obj.use(k.sprite("chestOpen"));
        runtime.openedChests.add(ch.id);
        playChest();
        if (ch.game) {
          revealGameChest(k, ch).then(() => { interactLock = 0.35; });
        } else {
          toast(k, obj.pos.clone(), ch.junk, 3.2);
        }
        return;
      }

      if (best.kind === "book") {
        const obj = best.obj;
        obj.read = true;
        runtime.readBooks.add(obj.book.id);
        playBook();
        const justFinished = !hasBrick("tomeraider") && ALL_BOOKS.every((b) => runtime.readBooks.has(b.id));
        readBook(k, obj.book).then(() => {
          interactLock = 0.35;
          if (!justFinished) return;
          // Already met Tome Raider? Hand the brick over now — don't make the
          // player walk all the way back. Otherwise nudge them toward him.
          if (runtime.metNpcs.has("tomeraider")) {
            earnBrick("tomeraider");
            celebrate(k, brickFor("tomeraider")).then(() => {
              if (allBricksEarned()) fadeTo(k, () => k.go("assembly"));
            });
          } else {
            toast(k, player.pos.clone(), "Every book read — go tell Tome Raider.", 3.2);
          }
        });
        return;
      }

      if (best.kind === "guestbook") {
        openHubGuestbook(k).then(() => { interactLock = 0.35; });
        return;
      }

      const npc = best.obj;
      npc.frame = IDLE_FRAME[dirTo(npc.pos, player.pos)];
      npc.target = null;
      runInteraction(k, npc.def).then(() => { interactLock = 0.35; });
    };
    k.onKeyPress("space", interact);
    k.onKeyPress("e", interact);
    addTouchControls(k, interact);

    k.setCamScale(2.5);
  });
}

// Walk an NPC around its home tile to convey personality, while leaving the
// player collision footprint where it started.
function attachNpcBehavior(k, npc, map) {
  const b = npc.def.behavior;
  if (b === "idle") {
    npc.onUpdate(() => {
      npc.t -= k.dt();
      if (npc.t <= 0) { npc.t = k.rand(2, 5); npc.play("idle-" + npc.facing, { onEnd: () => (npc.frame = IDLE_FRAME[npc.facing]) }); }
    });
    return;
  }
  npc.onUpdate(() => {
    if (!npc.target) {
      npc.t -= k.dt();
      if (npc.t <= 0) {
        npc.t = k.rand(1.5, 3.5);
        const range = b === "pace" ? k.vec2(14, 0) : k.vec2(8, 8);
        npc.target = npc.home.add(k.rand(k.vec2(-range.x, -range.y), range));
        npc.facing = dirTo(npc.pos, npc.target);
        npc.play("walk-" + npc.facing);
      }
      return;
    }
    const to = npc.target.sub(npc.pos);
    if (to.len() < 1.5) { npc.target = null; npc.stop(); npc.frame = IDLE_FRAME[npc.facing]; return; }
    const step = to.unit().scale(34 * k.dt());
    const nx = npc.pos.x + step.x, ny = npc.pos.y + step.y;
    if (map.canStand(nx, ny)) { npc.pos.x = nx; npc.pos.y = ny; }
    else { npc.target = null; npc.stop(); npc.frame = IDLE_FRAME[npc.facing]; }
  });
}

// Opening a game chest reveals its memory (game name + a line of why it stuck).
// When the last game chest is opened this is where the Curiosity brick is earned
// — mirroring runInteraction's earn/celebrate/assembly flow.
async function revealGameChest(k, chest) {
  try {
    await say(k, chest.lines, { speaker: chest.game, color: brickFor("xprience").color });
    const allOpened = GAME_CHESTS.every((c) => runtime.openedChests.has(c.id));
    if (allOpened && !hasBrick("xprience")) {
      earnBrick("xprience");
      await celebrate(k, brickFor("xprience"));
      if (allBricksEarned()) fadeTo(k, () => k.go("assembly"));
    }
  } catch (err) {
    if (err !== CANCELLED) throw err;
  }
}

// Reading a grove book just plays its blurb (spoken in the Imagination colour);
// the brick itself is handed over by Tome Raider once every book is read.
async function readBook(k, book) {
  try {
    await say(k, book.lines, { speaker: book.title, color: brickFor("tomeraider").color });
  } catch (err) {
    if (err !== CANCELLED) throw err;
  }
}

// Opening the hub guestbook freezes the player (dialogue.active) while the DOM
// overlay is up, then logs the note. The note is optional — a skipped/empty
// guestbook records nothing. `source` lets analytics tell hub notes apart from
// the end-of-game ones.
async function openHubGuestbook(k) {
  dialogue.active = true;
  track("guestbook_opened", { source: "hub_mailbox" });
  try {
    const note = await openGuestbook();
    if (note) track("feedback_note", { note, source: "hub_mailbox" });
  } finally {
    dialogue.active = false;
  }
}

// The guestbook mailbox, drawn as a small upright primitive anchored at its foot
// (y grows downward from 0): a post under a rounded red box with a mail slot and
// a little raised gold flag — reads as "leave a note here".
function drawMailbox(k) {
  const post = k.rgb(110, 78, 52);
  const body = k.rgb(178, 70, 84);
  const roof = k.rgb(140, 52, 66);
  const slot = k.rgb(40, 30, 22);
  const flag = k.rgb(240, 196, 90);
  k.drawRect({ pos: k.vec2(0, 0), width: 3, height: 14, anchor: "bot", color: post });
  k.drawRect({ pos: k.vec2(0, -12), width: 14, height: 11, radius: 3, anchor: "center", color: body });
  k.drawRect({ pos: k.vec2(0, -16), width: 14, height: 4, radius: 2, anchor: "center", color: roof });
  k.drawRect({ pos: k.vec2(0, -12), width: 8, height: 2, anchor: "center", color: slot });
  k.drawRect({ pos: k.vec2(7, -14), width: 2, height: 7, anchor: "bot", color: flag });
  k.drawRect({ pos: k.vec2(8.5, -20), width: 4, height: 3, anchor: "center", color: flag });
}

// Books have no sprite in the asset set, so they're drawn as small primitives
// anchored at their foot (y grows downward from 0): an upright closed book, or a
// flat open spread once read. `color` is the cover/spine tint.
function drawBook(k, color, open) {
  const [r, g, b] = color;
  const cover = k.rgb(r, g, b);
  const dark = k.rgb(Math.max(0, r - 55), Math.max(0, g - 55), Math.max(0, b - 55));
  const page = k.rgb(248, 240, 214);
  if (!open) {
    // Upright closed book: cover, page block peeking on the right, spine on the left.
    k.drawRect({ pos: k.vec2(0, 0), width: 9, height: 12, radius: 1, anchor: "bot", color: cover });
    k.drawRect({ pos: k.vec2(2, -1), width: 4, height: 10, anchor: "bot", color: page });
    k.drawRect({ pos: k.vec2(-3.5, 0), width: 2, height: 12, anchor: "bot", color: dark });
  } else {
    // Open spread lying flat: cover back, two pages, centre fold.
    k.drawRect({ pos: k.vec2(0, 0), width: 16, height: 3, radius: 1, anchor: "bot", color: cover });
    k.drawRect({ pos: k.vec2(-0.5, -2), width: 14, height: 7, radius: 1, anchor: "bot", color: page });
    k.drawRect({ pos: k.vec2(0, -2), width: 1, height: 7, anchor: "bot", color: dark });
  }
}

async function runInteraction(k, def) {
  try {
    track("npc_talked", { npc: def.id, name: def.name, already_earned: hasBrick(def.id) });
    runtime.metNpcs.add(def.id);
    if (hasBrick(def.id)) {
      await say(k, def.doneLines, { speaker: def.name, color: def.color });
      return;
    }
    const earned = await MINIGAMES[def.id](k, def);
    if (!earned) return;
    earnBrick(def.id);
    await celebrate(k, brickFor(def.id));
    if (allBricksEarned()) {
      fadeTo(k, () => k.go("assembly"));
    }
  } catch (err) {
    // Escape during any dialogue aborts the whole interaction; the player just
    // walks away with no brick earned. Re-throw anything that isn't a cancel.
    if (err !== CANCELLED) throw err;
  }
}

// Full-screen fade-out, run the callback. Sets dialogue.active so movement halts
// during the wipe.
function fadeTo(k, cb) {
  dialogue.active = true;
  let a = 0;
  const cover = k.add([k.fixed(), k.layer("ui"), k.z(200), {
    draw() { k.drawRect({ width: k.width(), height: k.height(), color: k.rgb(20, 14, 10), opacity: a }); },
  }]);
  const tick = k.onUpdate(() => {
    a += k.dt() * 2.2;
    if (a >= 1) { tick.cancel(); k.destroy(cover); dialogue.active = false; cb(); }
  });
}

function showBanner(k, name) {
  let life = 2.4;
  k.add([k.fixed(), k.layer("ui"), k.z(95), {
    update() { life -= k.dt(); if (life <= 0) k.destroy(this); },
    draw() {
      const alpha = Math.min(1, life, 2.4 - life + 0.4);
      const cx = k.width() / 2, cy = 46;
      const measured = k.formatText({ text: name, font: "sprout", size: 22 });
      k.drawRect({ pos: k.vec2(cx, cy), width: measured.width + 40, height: 36, radius: 8, anchor: "center", color: k.rgb(40, 30, 22), opacity: 0.5 * alpha });
      k.drawText({ text: name, font: "sprout", size: 22, pos: k.vec2(cx, cy), anchor: "center", color: k.rgb(255, 255, 255), opacity: alpha });
    },
  }]);
}

// A floating "press E" prompt drawn above the nearest NPC in reach. Bobs and
// pulses gently in the NPC's accent colour. Drawn in the NPC's local space.
// Shows the NPC's name on a plate above the key cap, like the guestbook mailbox.
function drawNpcCta(k, color, name) {
  const bob = Math.sin(k.time() * 4) * 1.5;
  const pulse = 0.75 + Math.sin(k.time() * 6) * 0.25;
  const y = -36 + bob;
  // Soft glow + dark key cap with the accent border.
  k.drawCircle({ pos: k.vec2(0, y), radius: 12, color: k.rgb(...color), opacity: 0.18 * pulse, anchor: "center" });
  k.drawRect({ pos: k.vec2(0, y), width: 15, height: 15, radius: 4, anchor: "center", color: k.rgb(...color), opacity: 0.95 });
  k.drawRect({ pos: k.vec2(0, y), width: 12, height: 12, radius: 3, anchor: "center", color: k.rgb(40, 30, 22), opacity: 0.92 });
  k.drawText({ text: "E", font: "sprout", size: 8, pos: k.vec2(0, y), anchor: "center", color: k.rgb(255, 255, 255) });
  if (name) {
    const ny = y - 14;
    const measured = k.formatText({ text: name, font: "sprout", size: 8 });
    k.drawRect({ pos: k.vec2(0, ny), width: measured.width + 8, height: 13, radius: 3, anchor: "center", color: k.rgb(40, 30, 22), opacity: 0.6 });
    k.drawText({ text: name, font: "sprout", size: 8, pos: k.vec2(0, ny), anchor: "center", color: k.rgb(255, 255, 255) });
  }
}

// A small world-space label that rises and fades (item pickups).
function toast(k, pos, text, life = 1.3) {
  const total = life;
  const start = pos.clone();
  k.add([k.layer("objects"), k.z(9000), {
    update() { life -= k.dt(); if (life <= 0) k.destroy(this); },
    draw() {
      const rise = (total - life) * 16;
      k.drawText({ text, font: "sprout", size: 8, pos: k.vec2(start.x, start.y - 18 - rise), anchor: "center", color: k.rgb(255, 255, 255), opacity: Math.min(1, life * 1.5) });
    },
  }]);
}

// Brick-earned flourish: the icon scales up at screen centre with its trait,
// glowing in the brick's colour, then fades. Freezes input while it plays.
function celebrate(k, brick) {
  return new Promise((resolve) => {
    dialogue.active = true;
    playBrickEarned();
    let life = 0;
    const TOTAL = 1.8;
    const node = k.add([k.fixed(), k.layer("ui"), k.z(150), {
      update() {
        life += k.dt();
        if (life >= TOTAL) { k.destroy(node); dialogue.active = false; resolve(); }
      },
      draw() {
        const cx = k.width() / 2, cy = k.height() / 2 - 10;
        const t = Math.min(1, life / 0.4);
        const fade = life > TOTAL - 0.4 ? (TOTAL - life) / 0.4 : 1;
        k.drawCircle({ pos: k.vec2(cx, cy), radius: 60 * t, color: k.rgb(...brick.color), opacity: 0.25 * fade });
        drawBrick(k, cx, cy, 72 * t, brick.color, fade);
        k.drawText({ text: brick.trait + " Brick earned!", font: "sprout", size: 18, pos: k.vec2(cx, cy + 56), anchor: "center", color: k.rgb(255, 255, 255), opacity: fade });
      },
    }]);
  });
}
