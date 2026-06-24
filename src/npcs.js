// NPC roster. Each entry pins an islander to a tile on its island, gives it a
// signature tint (the shared character sprite, recoloured so each reads at a
// glance) and a behaviour the world scene animates. `doneLines` play on a
// revisit once their brick is already earned. The actual interaction content
// lives in minigames/index.js, keyed by the same id.

export const NPCS = [
  {
    id: "kindor",
    name: "Ganymede",
    island: "hub",
    tile: [10, 5],
    color: [231, 120, 90],
    facing: "down",
    behavior: "idle",
    doneLines: ["Bridges lead to every island. Take your time out there!"],
  },
  {
    id: "tomeraider",
    name: "Tome Raider",
    island: "island2",
    tile: [8, 4],
    color: [120, 160, 220],
    facing: "down",
    behavior: "idle",
    doneLines: ["...still reading. Always one more chapter."],
  },
  {
    id: "xprience",
    name: "Lore Looter",
    island: "island3",
    tile: [8, 7],
    color: [176, 200, 90],
    facing: "down",
    behavior: "wander",
    doneLines: ["Best loot of the day, right there! Catch you 'round!"],
  },
  {
    id: "empathus",
    name: "Empathus",
    island: "island4",
    tile: [15, 7],
    color: [210, 178, 120],
    facing: "down",
    behavior: "wander",
    doneLines: ["Everything's where it should be. Thank you again!"],
  },
  {
    id: "gerard",
    name: "Debug Gerard",
    island: "island5",
    tile: [6, 7],
    color: [160, 140, 210],
    facing: "down",
    behavior: "idle",
    doneLines: ["The lock is open. The logic holds."],
  },
  {
    id: "melodyssee",
    name: "Melodyssee",
    island: "island5",
    tile: [10, 7],
    color: [230, 120, 180],
    facing: "down",
    behavior: "idle",
    doneLines: ["...still humming. Music doesn't really end."],
  },
];
