// Global game state: the Memory Bricks the player has earned and which NPC
// interactions are complete. Kept as a plain module singleton so every scene
// (world, dialogue, HUD, assembly) reads and writes the same progress without
// threading it through kaplay scene args.
//
// Each NPC grants exactly one brick (see the design brief). A brick is keyed by
// the NPC id; its `color` is pulled straight from that NPC's signature tint (see
// npcs.js) so the brick always matches the islander who gave it - tinting the
// drawn brick icon (see ui/brick.js) and its soft glow in the HUD and the final
// assembly scene.

import { NPCS } from "./npcs.js";
import { track, elapsedSeconds } from "./analytics.js";

const npcColor = (id) => NPCS.find((n) => n.id === id).color;

export const BRICKS = [
  { npc: "kindor",     trait: "Kindness",      island: "hub" },
  { npc: "tomeraider", trait: "Imagination",   island: "island2" },
  { npc: "xprience",   trait: "Curiosity",     island: "island3" },
  { npc: "empathus",   trait: "Carefulness",   island: "island4" },
  { npc: "gerard",     trait: "Understanding", island: "island5" },
  { npc: "melodyssee", trait: "Emotion",       island: "island5" },
].map((b) => ({ ...b, color: npcColor(b.npc) }));

export const TOTAL_BRICKS = BRICKS.length;

export function brickFor(npcId) {
  return BRICKS.find((b) => b.npc === npcId);
}

// Mutable progress. `collected` holds the npc ids whose brick is earned.
export const state = {
  collected: new Set(),
  assembled: false, // set once the final scene has played, to avoid replaying
};

export function hasBrick(npcId) {
  return state.collected.has(npcId);
}

export function earnBrick(npcId) {
  if (state.collected.has(npcId)) return;
  state.collected.add(npcId);
  const brick = brickFor(npcId);
  track("brick_earned", {
    npc: npcId,
    trait: brick?.trait,
    earned_count: state.collected.size,
    total: TOTAL_BRICKS,
    seconds: elapsedSeconds(),
  });
}

export function allBricksEarned() {
  return state.collected.size >= TOTAL_BRICKS;
}

export function resetProgress() {
  state.collected.clear();
  state.assembled = false;
}
