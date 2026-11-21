// Title screen: the game name, the tagline, a PLAY button (from the UI kit) and
// the controls. Space / click / the button start the post-PLAY intro, where
// Ganymede greets the player and gives the brief before the world opens.

import { resetProgress } from "../state.js";
import { resetRuntime } from "../runtime.js";
import { startMusic } from "../audio/sound.js";
import { armClipUnlock } from "../audio/youtube.js";
import { track } from "../analytics.js";
import { buildMap, attachYSort, attachShadow } from "../renderMap.js";
import { NPCS } from "../npcs.js";

export function registerTitle(k) {
  k.scene("title", () => {
    // Build the YouTube player now and prime it on the first tap, so Melodyssee's
    // clips are audible on mobile (which blocks non-gesture media playback).
    armClipUnlock();

    const cx = () => k.width() / 2;

    // Living diorama behind the title: a small island built with the same
    // tiles, props and characters as the real world, so the very first screen
    // already shows what the game looks like instead of a flat backdrop.
    const diorama = buildTitleDiorama(k);

    // Title card, anchored to the upper part of the screen over the sea.
    const cardY = () => Math.max(110, k.height() * 0.2);
    const tagline = "a little world to get to know me, one chat at a time";
    const titleSize = () => (k.width() < 520 ? 30 : 44);
    const tagSize = () => (k.width() < 520 ? 12 : 18);
    k.add([k.fixed(), k.layer("ui"), k.z(0.5), {
      draw() {
        const t = k.formatText({ text: "My World Quest", font: "sprout", size: titleSize() });
        const g = k.formatText({ text: tagline, font: "sprout", size: tagSize() });
        const w = Math.min(k.width() - 24, Math.max(t.width, g.width) + 56);
        const h = titleSize() + tagSize() + 62;
        const pos = k.vec2(cx(), cardY());
        // Drop shadow, wooden rim, then the cream paper of the card.
        k.drawRect({ pos: pos.add(0, 4), width: w, height: h, radius: 12, anchor: "center", color: k.rgb(40, 30, 22), opacity: 0.25 });
        k.drawRect({ pos, width: w, height: h, radius: 12, anchor: "center", color: k.rgb(150, 104, 70) });
        k.drawRect({ pos, width: w - 8, height: h - 8, radius: 9, anchor: "center", color: k.rgb(250, 241, 220) });
      },
    }]);
    k.add([
      k.text("My World Quest", { font: "sprout", size: 44, align: "center" }),
      k.color(74, 53, 38), k.anchor("center"), k.fixed(), k.layer("ui"), k.z(1),
      { update() { this.textSize = titleSize(); this.pos = k.vec2(cx(), cardY() - tagSize() / 2 - 12 + Math.sin(k.time() * 1.6) * 1.5); } },
    ]);
    k.add([
      k.text(tagline, { font: "sprout", size: 18, align: "center" }),
      k.color(110, 84, 60), k.anchor("center"), k.fixed(), k.layer("ui"), k.z(1),
      { update() { this.textSize = tagSize(); this.pos = k.vec2(cx(), cardY() + titleSize() / 2 - 2); } },
    ]);
    k.add([
      k.text("by Mathilde Belda", { font: "sprout", size: 12, align: "center" }),
      k.color(150, 104, 70), k.anchor("center"), k.fixed(), k.layer("ui"), k.z(1),
      { update() { this.pos = k.vec2(cx(), cardY() + titleSize() / 2 + tagSize() + 6); } },
    ]);

    // PLAY button (frames: 2 = PLAY, 3 = PLAY pressed), breathing gently so it
    // reads as the one thing to do on this screen.
    const btnY = () => cardY() + titleSize() / 2 + tagSize() + 70;
    const btn = k.add([
      k.sprite("playButton", { frame: 2 }),
      k.anchor("center"), k.scale(2), k.fixed(), k.layer("ui"), k.z(1),
      k.area(),
      { update() { this.pos = k.vec2(cx(), btnY()); this.scale = k.vec2(2 + Math.sin(k.time() * 3) * 0.06); } },
    ]);
    btn.onHover(() => { btn.frame = 3; k.setCursor("pointer"); });
    btn.onHoverEnd(() => { btn.frame = 2; k.setCursor("default"); });

    const controlsHint = k.isTouchscreen()
      ? "Drag the left side to move    ·    Tap the button to talk"
      : "Arrows / WASD to move    ·    Space or E to talk";
    const hintY = () => k.height() - 28;
    const hintSize = () => (k.width() < 520 ? 10 : 14);
    k.add([k.fixed(), k.layer("ui"), k.z(0.5), {
      draw() {
        const m = k.formatText({ text: controlsHint, font: "sprout", size: hintSize() });
        k.drawRect({ pos: k.vec2(cx(), hintY()), width: m.width + 28, height: 28, radius: 8, anchor: "center", color: k.rgb(40, 30, 22), opacity: 0.45 });
      },
    }]);
    k.add([
      k.text(controlsHint, { font: "sprout", size: 14, align: "center" }),
      k.color(255, 255, 255), k.anchor("center"), k.fixed(), k.layer("ui"), k.z(1),
      { update() { this.textSize = hintSize(); this.pos = k.vec2(cx(), hintY()); } },
    ]);

    const start = () => {
      k.setCursor("default");
      diorama.release();
      startMusic(); // first user gesture unlocks audio; the bed plays from here on
      track("game_started");
      resetProgress();
      resetRuntime();
      k.go("intro");
    };
    btn.onClick(start);
    k.onKeyPress(["space", "enter"], start);
  });
}

// A small hand-authored island (same tile language as data/islands.js:
// w = water, g = grass, d = dirt) dressed with props and the cast idling on it.
// prettier-ignore
const TITLE_TERRAIN = [
  "wwwwwwwwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwwwwwwwww",
  "wwwwwwwgggggggggggggwwwwww",
  "wwwwwgggggggggggggggggwwww",
  "wwwwggggggggddgggggggggwww",
  "wwwgggggggggddggggggggggww",
  "wwwggggddddddddddddgggggww",
  "wwwggggddddddddddddggggwww",
  "wwwwgggggggggddgggggggwwww",
  "wwwwwggggggggddggggggwwwww",
  "wwwwwwwggggggddgggggwwwwww",
  "wwwwwwwwwwggggggwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwwwwwwwww",
  "wwwwwwwwwwwwwwwwwwwwwwwwww",
];
const TITLE_OBJECTS = [
  { type: "treeBig", x: 5, y: 4 }, { type: "appleTree", x: 19, y: 4 },
  { type: "tree", x: 8, y: 3 }, { type: "tree", x: 17, y: 3 },
  { type: "tree", x: 4, y: 8 }, { type: "treeBig", x: 20, y: 8 },
  { type: "bush", x: 7, y: 5 }, { type: "bush", x: 16, y: 9 },
  { type: "flowersPink", x: 10, y: 4 }, { type: "flowersYellow", x: 15, y: 4 },
  { type: "flowerPink", x: 9, y: 9 }, { type: "flowerYellow", x: 6, y: 9 },
  { type: "mushroomsRed", x: 18, y: 9 }, { type: "grassTufts", x: 11, y: 10 },
  { type: "sign", x: 14, y: 5 }, { type: "sunflower", x: 21, y: 6 },
];
// Where the cast stands (tile coords): the player in the middle of the
// crossroads, the islanders spread around it.
const TITLE_PLAYER = [12.5, 7];
const TITLE_SPOTS = [[9, 6], [16, 6], [7, 8], [18, 8], [10, 9], [15, 9]];
const TS = 16;

function buildTitleDiorama(k) {
  buildMap(k, { terrain: TITLE_TERRAIN, objects: TITLE_OBJECTS });

  const addChar = (tx, ty, color, frame) => {
    const comps = [k.sprite("character", { frame }), k.pos(tx * TS + TS / 2, ty * TS + TS), k.anchor(k.vec2(0, 1 / 3)), k.layer("objects")];
    if (color) comps.push(k.color(...color));
    const c = k.add(comps);
    attachYSort(c);
    attachShadow(k, c);
    return c;
  };

  const player = addChar(...TITLE_PLAYER, null, 0);
  player.play("idle-down");

  // Islanders idle, then now and then take a few steps back and forth so the
  // scene feels alive without anyone wandering off the island.
  NPCS.forEach((def, i) => {
    const [tx, ty] = TITLE_SPOTS[i % TITLE_SPOTS.length];
    const npc = addChar(tx, ty, def.color, 0);
    const home = npc.pos.clone();
    let t = k.rand(1, 4);
    let dir = 0;
    npc.play("idle-down");
    npc.onUpdate(() => {
      t -= k.dt();
      if (t <= 0) {
        if (dir === 0) {
          dir = npc.pos.x > home.x ? -1 : 1;
          npc.play(dir > 0 ? "walk-right" : "walk-left");
          t = k.rand(0.6, 1.2);
        } else {
          dir = 0;
          npc.play("idle-down");
          t = k.rand(2, 5);
        }
      }
      if (dir !== 0) npc.pos.x = Math.max(home.x - 14, Math.min(home.x + 14, npc.pos.x + dir * 22 * k.dt()));
    });
  });

  // Frame the island in the lower part of the screen at a zoom that fits it,
  // leaving the sea above for the title card.
  const islandW = 20 * TS;
  const islandH = 10 * TS;
  const fit = () => {
    const s = Math.max(1.5, Math.min(4, k.width() / islandW, (k.height() * 0.5) / islandH));
    k.setCamScale(s);
    // Island centre (tile 13, 6.5) sits at ~68% of the screen height (62% in portrait).
    const centre = k.vec2(13 * TS, 6.5 * TS);
    const offsetY = (k.height() * (k.width() < k.height() ? 0.62 : 0.68) - k.height() / 2) / s;
    k.setCamPos(centre.x, centre.y - offsetY);
  };
  fit();
  const ev = k.onUpdate(fit);

  // The world scene sets its own camera; reset ours so nothing leaks into the
  // fixed-camera intro screen.
  return {
    release() {
      ev.cancel();
      k.setCamScale(1);
      k.setCamPos(k.width() / 2, k.height() / 2);
    },
  };
}
