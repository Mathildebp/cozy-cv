// Central asset registration. Terrain + object sheets live in tilesets.js (the
// autotile tables are large and self-contained); everything else - the player
// and NPC character sheet, the pixel font, and the UI kit pieces we slice out -
// is loaded here so scenes can assume all assets exist after loadAllAssets().

import { loadTilesets } from "./tilesets.js";

// UI kit sheets, sliced into grids. Identified from the Sprout Lands "UI kit"
// folder (sizes confirmed against each PNG):
//   - UI Big Play Button.png 192x64 -> 2x2 of 96x32: [blank, blank-hover] on top
//     row, [PLAY, PLAY-pressed] on the bottom.
//   - the "click to continue" indicator is a 112x16 strip of seven 16px frames,
//     animated as a gentle blink under finished dialogue.
//   - All Icons.png 288x48 -> 18x3 grid of 16px misc UI glyphs.
export function loadAllAssets(k) {
  loadTilesets(k);

  // Player/NPC body: Sprout Lands "Basic Charakter", a 4x4 grid of 48px cells.
  // Rows are facings (down, up, left, right); col 0 idle, cols 2-3 the walk
  // cycle, col 1 a "breathing" idle variant. NPCs reuse this sprite tinted to a
  // signature colour so each reads distinctly from a distance.
  k.loadSprite("character", "sprites/character.png", {
    sliceX: 4,
    sliceY: 4,
    anims: {
      "walk-down": { from: 2, to: 3, loop: true, speed: 6 },
      "walk-up": { from: 6, to: 7, loop: true, speed: 6 },
      "walk-left": { from: 10, to: 11, loop: true, speed: 6 },
      "walk-right": { from: 14, to: 15, loop: true, speed: 6 },
      "idle-down": { from: 0, to: 1, pingpong: true, speed: 4 },
      "idle-up": { from: 4, to: 5, pingpong: true, speed: 4 },
      "idle-left": { from: 8, to: 9, pingpong: true, speed: 4 },
      "idle-right": { from: 12, to: 13, pingpong: true, speed: 4 },
    },
  });

  // Pixel font that ships with the pack (matches the UI art).
  k.loadFont("sprout", "assets/fonts/pixelFont-7-8x14-sproutLands.ttf");

  // Misc UI glyphs.
  k.loadSprite("uiIcons", "assets/UI kit/Icons/All Icons.png", {
    sliceX: 18,
    sliceY: 3,
  });

  // Title-screen play button.
  k.loadSprite("playButton", "assets/UI kit/UI Big Play Button.png", {
    sliceX: 2,
    sliceY: 2,
  });

  // "Click to continue" blink for dialogue.
  k.loadSprite("dialogNext", "assets/UI kit/Dialouge UI/dialog box character finished talking click to continue indicator - spritesheet .png", {
    sliceX: 7,
    sliceY: 1,
    anims: { blink: { from: 0, to: 6, loop: true, speed: 8 } },
  });
}
