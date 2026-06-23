// One continuous world made of five distinct islands floating in open sea,
// linked by walkable wooden bridges. Unlike the old per-island scenes, every
// island is stamped into a single large tile grid at a world `origin`, so the
// player simply walks across the whole archipelago - the camera follows, and
// there are no scene transitions.
//
// Each island authors its OWN topography as a small char grid:
//   w = open water   g = grass (sits on water)   d = dirt (sits on grass)
// Object / NPC / item coordinates are island-LOCAL tiles; composeWorld() and the
// scene translate them to world tiles by adding the island's origin.
//
// Bridges are physical structures spanning the 3-tile water gaps between islands.
// Their deck tiles become walkable 'b' tiles in the composed grid (see
// renderMap), and a bridge sprite is drawn on top. The hub sits in the middle
// with one bridge to each themed island.

// Layout (world tiles):
//                        island2 (rows 7-18)
//                             |  north bridge
//   island5 --- west --- [   hub   ] --- east --- island3
//   (rows 23-36)             |  south bridge       (rows 23-36)
//                        island4 (rows 41-53)

export const ISLANDS = [
  {
    id: "hub",
    name: "Ganymede Zone",
    origin: [24, 22],
    ambient: [255, 224, 150, 0.05],
    // 20x16 plaza island reaching all four edges at its mid-points so every
    // bridge attaches to solid grass. A dirt CROSSROADS runs through it - a
    // vertical road (cols 9-10) joining the north & south bridges and a
    // horizontal road (rows 7-8) joining the west & east bridges - making the
    // hub literally read as "bridges lead to every island".
    terrain: [
      "wwwwwgggdddggggwwwww",
      "wwwgggggdddggggggwww",
      "wwggggggdddgggggggww",
      "wgggggggdddggggggggw",
      "ggggggggdddggggggggg",
      "ggggggggdddggggggggg",
      "dddddddddddddddddddd",
      "dddddddddddddddddddd",
      "dddddddddddddddddddd",
      "ggggggggdddggggggggg",
      "ggggggggdddggggggggg",
      "ggggggggdddggggggggg",
      "wgggggggdddggggggggw",
      "wwggggggdddgggggggww",
      "wwwgggggdddggggggwww",
      "wwwwwgggdddggggwwwww",
    ],
    objects: [
      // The hub reads as a lush welcoming garden: each corner is a little grove
      // (shade tree + bushes + toadstools + a flower drift), the four shores are
      // softened with greenery, and the crossroads stays clear as the throughway.
      // ── NW grove ──
      { type: "appleTree", x: 2, y: 2 },
      { type: "tree", x: 4, y: 1 },
      { type: "treeBig", x: 1, y: 4 },
      { type: "bush", x: 3, y: 3 },
      { type: "bush", x: 5, y: 4 },
      { type: "mushroomsRed", x: 4, y: 3 },
      { type: "flowersPink", x: 6, y: 2 },
      { type: "flowerYellow", x: 5, y: 2 },
      { type: "grassTuft", x: 7, y: 3 },
      // ── NE grove ──
      { type: "appleTree", x: 16, y: 2 },
      { type: "tree", x: 16, y: 1 },
      { type: "treeBig", x: 17, y: 4 },
      { type: "bush", x: 16, y: 3 },
      { type: "bush", x: 16, y: 4 },
      { type: "mushroomsPurple", x: 14, y: 3 },
      { type: "flowersYellow", x: 12, y: 2 },
      { type: "flowerPink", x: 13, y: 2 },
      { type: "grassTufts", x: 12, y: 3 },
      // ── welcome gate at the north crossroads: a sign flanked by flower pots ──
      { type: "sign", x: 8, y: 6 },
      { type: "potPink", x: 7, y: 6 },
      { type: "potGreen", x: 11, y: 6 },
      { type: "flowersYellow", x: 7, y: 4 },
      { type: "flowersPink", x: 12, y: 4 },
      { type: "plantFlower", x: 6, y: 5 },
      { type: "plantFlower", x: 13, y: 5 },
      // ── SW: a shady grove ──
      { type: "treeBig", x: 2, y: 9 },
      { type: "tree", x: 4, y: 14 },
      { type: "bush", x: 6, y: 13 },
      { type: "mushroomRed", x: 5, y: 12 },
      { type: "flowerPink", x: 7, y: 11 },
      { type: "grassTuft", x: 2, y: 10 },
      // ── SE: a little flower bed behind a rail, framed by trees ──
      { type: "tree", x: 17, y: 12 },
      { type: "treeBig", x: 15, y: 9 },
      { type: "appleTree", x: 13, y: 13 },
      { type: "bush", x: 12, y: 12 },
      { type: "fenceLeft", x: 11, y: 11 },
      { type: "fenceMid", x: 12, y: 11 },
      { type: "fenceRight", x: 13, y: 11 },
      { type: "flowerYellow", x: 11, y: 10 },
      { type: "flowerPink", x: 12, y: 10 },
      { type: "flowersYellow", x: 13, y: 10 },
      { type: "mushroomsRed", x: 16, y: 13 },
      { type: "grassTufts", x: 15, y: 10 },
    ],
  },

  {
    id: "island2",
    name: "Imaginary Archipelago",
    origin: [25, 7],
    ambient: [120, 120, 225, 0.13],
    // 18x12 soft oval tapering to a southern dock (col 8) for the north bridge.
    // A small lily pond is carved into the east side (rows 5-6, cols 11-12) -
    // the quiet water the reader gazes at between chapters.
    terrain: [
      "wwwwwwggggggwwwwww",
      "wwwwggggggggggwwww",
      "wwwggggggggggggwww",
      "wwggggggggggggggww",
      "wwggggggggggggggww",
      "wwwggggggggwwggwww",
      "wwwggggdddgwwggwww",
      "wwwwgggdddggggwwww",
      "wwwwwggdddgggwwwww",
      "wwwwwwgdddggwwwwww",
      "wwwwwwwdddgwwwwwww",
      "wwwwwwwdddwwwwwwww",
    ],
    objects: [
      // ── the reading grove under the big shade tree (centre-west) ──
      { type: "treeBig", x: 4, y: 2 },
      { type: "dresser", x: 6, y: 3 },        // an outdoor bookshelf
      { type: "tableSmall", x: 7, y: 3 },     // reading desk
      { type: "stool", x: 6, y: 4 },
      { type: "rugWideGreen", x: 6, y: 5 },   // the reading blanket (flat)
      { type: "plantSmall", x: 5, y: 3 },
      { type: "painting", x: 9, y: 3 },       // a framed daydream
      // ── tall sunflowers like watch-towers of imagination ──
      { type: "sunflower", x: 4, y: 1 },
      { type: "sunflower", x: 12, y: 1 },
      { type: "sunflower", x: 3, y: 4 },
      // ── a soft ring of trees & bushes hugging the shore ──
      { type: "tree", x: 13, y: 2 },
      { type: "tree", x: 14, y: 3 },
      { type: "treeBig", x: 12, y: 7 },
      { type: "tree", x: 5, y: 1 },
      { type: "bush", x: 3, y: 3 },
      { type: "bush", x: 14, y: 4 },
      { type: "bush", x: 4, y: 7 },
      { type: "bush", x: 11, y: 8 },
      // ── storybook toadstools clustered in the shade ──
      { type: "mushroomsRed", x: 5, y: 7 },
      { type: "mushroomRed", x: 6, y: 7 },
      { type: "mushroomPurple", x: 4, y: 6 },
      { type: "mushroomsPurple", x: 9, y: 7 },
      { type: "mushroomPurple", x: 10, y: 7 },
      // ── the quiet lily pond on the east side (water cols 11-12) ──
      { type: "lilyPad", x: 11, y: 5 },
      { type: "lilyPads", x: 12, y: 6 },
      { type: "lilyPad", x: 12, y: 5 },
      // ── flower drifts & ground texture ──
      { type: "flowersPink", x: 13, y: 5 },
      { type: "flowerYellow", x: 13, y: 6 },
      { type: "flowerPinkSmall", x: 10, y: 6 },
      { type: "flowersPink", x: 9, y: 2 },
      { type: "flowerPink", x: 11, y: 2 },
      { type: "grassTuft", x: 7, y: 6 },
      { type: "grassTufts", x: 8, y: 8 },
      { type: "seedling", x: 10, y: 4 },
    ],
    // The reading grove's books, scattered so each is read in the world via the
    // pickup mechanic: a bubble bobs over an unread book; opening it plays its
    // blurb and leaves it lying open (bubble gone). Reading them all lets Tome
    // Raider hand over the Imagination brick (see minigames + world.js).
    books: [
      { id: "b_tog",  title: "Throne of Glass",   color: [178, 70, 84],
        lines: ["An assassin who refuses to lose herself.", "I read it in two breathless nights."], x: 5, y: 4 },
      { id: "b_nev",  title: "Nevernight",        color: [70, 66, 104],
        lines: ["A school for killers, prose sharp as the knives.", "Never quite trust the narrator."], x: 7, y: 4 },
      { id: "b_ppm",  title: "The Mirror Visitor", color: [86, 158, 176],
        lines: ["Mirrors that open like doors.", "A clumsy heroine who wins by noticing. My comfort read."], x: 5, y: 5 },
      { id: "b_lotr", title: "Lord of the Rings", color: [96, 132, 82],
        lines: ["The map I measure every other world against."], x: 9, y: 5 },
    ],
  },

  {
    id: "island3",
    name: "Adventure Camp",
    origin: [47, 23],
    ambient: [255, 168, 80, 0.09],
    // 16x14 with a western dock (rows 6-7, reaching col 0) for the east bridge.
    // A trodden dirt clearing (rows 6-8, cols 6-9) holds the campfire ring.
    terrain: [
      "wwwwwggggggwwwww",
      "wwwggggggggggwww",
      "wwggggggggggggww",
      "wwggggggggggggww",
      "wggggggggggggggw",
      "ddddddddddgggggw",
      "ddddddddddgggggw",
      "ddddddddddgggggw",
      "wgggggddddgggggw",
      "wggggggggggggggw",
      "wwggggggggggggww",
      "wwggggggggggggww",
      "wwwggggggggggwww",
      "wwwwwggggggwwwww",
    ],
    objects: [
      // ── the loot stash: six "memory" chests behind the camp (spawned as
      //    interactive chests from the `chests` list below), with a sign ──
      { type: "sign", x: 11, y: 3 },
      // ── the campfire ring on the dirt clearing ──
      { type: "stonePile", x: 7, y: 7 },   // the fire pit (centre)
      { type: "log", x: 6, y: 6 },
      { type: "log", x: 9, y: 6 },
      { type: "stump", x: 6, y: 8 },
      { type: "stumpSmall", x: 9, y: 8 },
      // ── expedition gear stacked at the edge of camp ──
      { type: "woodMaterial", x: 12, y: 8 },
      { type: "woodPlanks", x: 12, y: 9 },
      { type: "axe", x: 4, y: 9 },
      { type: "pickaxe", x: 13, y: 9 },
      // ── a rugged forest closing in from every shore (clustered groves) ──
      { type: "tree", x: 2, y: 3 },
      { type: "tree", x: 4, y: 4 },
      { type: "treeBig", x: 2, y: 5 },
      { type: "tree", x: 1, y: 9 },
      { type: "treeBig", x: 2, y: 11 },
      { type: "tree", x: 4, y: 12 },
      { type: "tree", x: 11, y: 1 },
      { type: "tree", x: 13, y: 3 },
      { type: "treeBig", x: 11, y: 2 },
      { type: "tree", x: 13, y: 8 },
      { type: "treeBig", x: 12, y: 12 },
      { type: "tree", x: 13, y: 11 },
      // ── mossy rocks & boulders strewn along the waterline ──
      { type: "rockBig", x: 13, y: 2 },
      { type: "rockSmall", x: 12, y: 2 },
      { type: "boulder", x: 2, y: 10 },
      { type: "rockSmall", x: 3, y: 10 },
      { type: "rockBig", x: 14, y: 9 },
      { type: "rockSmall", x: 1, y: 5 },
      // ── foraging at the camp's edge + toadstools in the shade ──
      { type: "berryBush", x: 3, y: 11 },
      { type: "bush", x: 3, y: 12 },
      { type: "berryBush", x: 13, y: 10 },
      { type: "mushroomRed", x: 3, y: 3 },
      { type: "mushroomPurple", x: 12, y: 5 },
      { type: "mushroomsRed", x: 4, y: 8 },
      { type: "grassTuft", x: 5, y: 9 },
      { type: "grassTufts", x: 10, y: 9 },
      { type: "seedling", x: 10, y: 4 },
      { type: "pebble", x: 11, y: 8 },
    ],
    // The "memory" chest stash behind the camp (a tidy 3x3 grid), opened via the
    // world pickup mechanic: a bubble marks each closed chest, and the lid stays
    // open afterwards. Some hold a game memory (name + a line of why it stuck);
    // the rest hold random junk (a one-off quip). You can't tell which is which
    // until you pry the lid — opening the last game chest earns the Curiosity
    // brick (see world.js). Junk chests are flavour only and don't count.
    chests: [
      // row 1 — all junk surprises
      { id: "c_sock",  x: 5, y: 1, junk: "A single sock. Where'd its pair go?" },
      { id: "c_duck",  x: 7, y: 1, junk: "A rubber duck. ...How'd that get in here?" },
      { id: "c_can",   x: 9, y: 1, junk: "A dented tin can. Hard pass." },
      // row 2 — game memories
      { id: "c_aoe",   x: 5, y: 2, game: "Age of Empires", lines: ["Wololo.", "Patience, really: build, lose, rebuild, repeat."] },
      { id: "c_dofus", x: 7, y: 2, game: "Dofus",          lines: ["A teenage classic of mine.", "I always end up coming back to it, sooner or later."] },
      { id: "c_anno",  x: 9, y: 2, game: "Anno",           lines: ["City-builder zen.", "Supply chains are weirdly soothing."] },
      // row 3 — one more game, then junk
      { id: "c_acnh",  x: 5, y: 3, game: "Animal Crossing", lines: ["2020. The little island", "that kept me company through the lockdown."] },
      { id: "c_boot",  x: 7, y: 3, junk: "Boots? Not sure those are any use here..." },
      { id: "c_rock",  x: 9, y: 3, junk: "Just a chipped pebble. We'll leave that one." },
    ],
  },

  {
    id: "island4",
    name: "Human Trace Garden",
    origin: [23, 41],
    ambient: [150, 210, 160, 0.11],
    // 22x13 broad garden with a northern dock (col 10) for the south bridge.
    // A picnic pond (rows 8-9, cols 9-12) sits just below the open central belt
    // so the walkway around it stays clear - the heart of the picnic scene.
    terrain: [
      "wwwwwwwwgdddgwwwwwwwww",
      "wwwwwggggdddggggwwwwww",
      "wwwggggggdddgggggggwww",
      "wwgggggggdddggggggggww",
      "wggggggggdddgggggggggw",
      "wggggggggdddgggggggggw",
      "gggggggggggggggggggggg",
      "gggggggggggggggggggggg",
      "wggggggggwwwwggggggggw",
      "wwgggggggwwwwgggggggww",
      "wwwggggggggggggggggwww",
      "wwwwwggggggggggggwwwww",
      "wwwwwwwwggggggwwwwwwww",
    ],
    objects: [
      // --- the tended kitchen garden (north-west): two neat rows behind a rail
      { type: "fenceLeft", x: 2, y: 3 },
      { type: "fenceMid", x: 3, y: 3 },
      { type: "fenceMid", x: 4, y: 3 },
      { type: "fenceMid", x: 5, y: 3 },
      { type: "fenceRight", x: 6, y: 3 },
      { type: "grainSprout", x: 2, y: 4 },
      { type: "grainYoung", x: 3, y: 4 },
      { type: "grainMature", x: 4, y: 4 },
      { type: "fruitSprout", x: 5, y: 4 },
      { type: "fruitFlower", x: 6, y: 4 },
      { type: "fruitMature", x: 2, y: 5 },
      { type: "grainSprout", x: 3, y: 5 },
      { type: "seedBagFruit", x: 4, y: 5 },
      { type: "seedBagGrain", x: 5, y: 5 },
      { type: "wateringCan", x: 6, y: 5 },
      // --- the picnic by the pond: blankets (carpets) + a set table for two ---
      { type: "rugWidePink", x: 5, y: 7 },   // big blanket (cols 5-6)
      { type: "rugWideGreen", x: 13, y: 6 }, // second blanket (cols 13-14)
      { type: "rugBlue", x: 8, y: 6 },
      { type: "tableSmall", x: 11, y: 6 },
      { type: "stoolSmall", x: 10, y: 6 },
      { type: "stool", x: 12, y: 7 },
      // the pond + its lily pads (water cols 9-12, rows 8-9)
      { type: "lilyPad", x: 9, y: 8 },
      { type: "lilyPads", x: 11, y: 9 },
      { type: "lilyPad", x: 12, y: 8 },
      // --- an orchard hugging the east side ---
      { type: "appleTree", x: 18, y: 4 },
      { type: "treeBig", x: 19, y: 6 },
      { type: "appleTree", x: 17, y: 8 },
      { type: "tree", x: 19, y: 9 },
      // --- shade trees on the south & west shores ---
      { type: "appleTree", x: 5, y: 11 },
      { type: "treeBig", x: 3, y: 10 },
      { type: "bush", x: 15, y: 10 },
      { type: "treeBig", x: 18, y: 3 },
      { type: "tree", x: 1, y: 7 },
      { type: "tree", x: 13, y: 11 },
      // --- sunflowers over the beds + a garden sign & pots ---
      { type: "sunflower", x: 8, y: 3 },
      { type: "sunflower", x: 14, y: 3 },
      { type: "sign", x: 9, y: 4 },
      { type: "potPink", x: 7, y: 5 },
      { type: "potGreen", x: 13, y: 5 },
      // --- flower drifts & ground texture (natural patches, not lines) ---
      { type: "flowersPink", x: 17, y: 10 },
      { type: "flowerYellow", x: 18, y: 9 },
      { type: "plantFlower", x: 19, y: 8 },
      { type: "flowerPink", x: 11, y: 10 },
      { type: "flowerYellow", x: 8, y: 10 },
      { type: "flowersYellow", x: 12, y: 11 },
      { type: "grassPlant", x: 4, y: 9 },
      { type: "grassTuft", x: 16, y: 7 },
      { type: "grassTufts", x: 2, y: 7 },
      { type: "seedling", x: 7, y: 10 },
    ],
    // The picnic's four "lost" things, staged as if someone just stepped away,
    // collected via the world pickup mechanic for Empathus's fetch quest.
    items: [
      { id: "d_cup", name: "cup", type: "milkFull", x: 6, y: 7 },
      { id: "d_notebook", name: "notebook", type: "woodPlanks", x: 9, y: 6 },
      { id: "d_letter", name: "letter", type: "painting", x: 14, y: 7 },
      { id: "d_scarf", name: "scarf", type: "rugPink", x: 16, y: 6 },
    ],
  },

  {
    id: "island5",
    name: "Creation & System",
    origin: [5, 23],
    ambient: [150, 160, 205, 0.11],
    // 16x14 with an eastern dock (rows 6-7, reaching col 15) for the west bridge.
    // Two plank-floor platforms (dirt) split the island: Gerard's debug
    // workshop on the left (cols 3-6) and Melodyssee's music stage on the right
    // (cols 9-12), with a grass aisle between them.
    terrain: [
      "wwwwwggggggwwwww",
      "wwwggggggggggwww",
      "wwggggggggggggww",
      "wwggggggggggggww",
      "wggggggggggggggw",
      "wggggggggddddddd",
      "wggddddggddddddd",
      "wggddddggddddddd",
      "wggddddggddddggw",
      "wggggggggggggggw",
      "wwggggggggggggww",
      "wwggggggggggggww",
      "wwwggggggggggwww",
      "wwwwwggggggwwwww",
    ],
    objects: [
      // --- Gerard's logic puzzle (left platform): the week clue ---
      // The riddle multiplies an insect's legs (6) by the days in a week (7) -> 42,
      // the answer Gerard asks for. The book is the in-world "week = 7" clue; the
      // "insect = 6" clue lives in Gerard's dialogue.
      // It sits on row 7, in FRONT of Gerard's house (whose footprint covers
      // cols 3-6 of row 6); placing the clue on row 6 hid it behind the house.
      // Walk near the book to reveal its title; "a week" -> 7 days. There is no
      // book sprite in the asset set, so it's drawn as a small primitive (see
      // renderMap.js); `color` tints its cover.
      { type: "book", x: 4, y: 7, color: [160, 140, 210], label: "\"Days of the Week\"" }, // the book (= 7)
      // --- Melodyssee's music stage (right platform) ---
      { type: "rugWideGreen", x: 9, y: 8 },  // the stage rug (cols 9-10)
      { type: "paintingNight", x: 9, y: 6 }, // three framed posters along the back
      { type: "painting", x: 10, y: 6 },
      { type: "paintingWide", x: 11, y: 6 },
      { type: "plantTall", x: 12, y: 6 },    // a leafy bit of stage dressing
      { type: "stool", x: 12, y: 8 },        // the performer's stool
      // --- shared dressing: a sign between the two stations ---
      { type: "sign", x: 7, y: 9 },
      { type: "potGreen", x: 2, y: 8 },
      { type: "potBlue", x: 13, y: 8 },
      // --- the two platforms nestled in a quiet wooded clearing ---
      // (the stations stay clean; the shores carry the greenery)
      { type: "treeBig", x: 3, y: 2 },
      { type: "tree", x: 4, y: 2 },
      { type: "tree", x: 2, y: 4 },
      { type: "tree", x: 1, y: 5 },
      { type: "treeBig", x: 13, y: 2 },
      { type: "tree", x: 14, y: 4 },
      { type: "tree", x: 13, y: 4 },
      { type: "tree", x: 14, y: 5 },
      { type: "treeBig", x: 3, y: 11 },
      { type: "tree", x: 5, y: 12 },
      { type: "tree", x: 11, y: 11 },
      { type: "treeBig", x: 12, y: 10 },
      // bushes & toadstools tucked at the platform corners
      { type: "bush", x: 2, y: 9 },
      { type: "bush", x: 13, y: 9 },
      { type: "bush", x: 9, y: 12 },
      { type: "bush", x: 8, y: 12 },
      { type: "mushroomRed", x: 3, y: 3 },
      { type: "mushroomPurple", x: 13, y: 3 },
      { type: "mushroomsPurple", x: 2, y: 10 },
      // flower drifts & ground texture
      { type: "flowersPink", x: 7, y: 4 },
      { type: "flowerYellow", x: 8, y: 4 },
      { type: "flowerPink", x: 6, y: 11 },
      { type: "flowersYellow", x: 9, y: 11 },
      { type: "grassTuft", x: 7, y: 5 },
      { type: "grassTufts", x: 8, y: 10 },
      { type: "seedling", x: 4, y: 5 },
      { type: "pebble", x: 11, y: 4 },
    ],
  },
];

export const ISLAND_BY_ID = Object.fromEntries(ISLANDS.map((i) => [i.id, i]));

// Every interactive chest across the archipelago, tagged with its island id so
// the world scene can place it and the XP Rience interaction can count progress.
export const ALL_CHESTS = ISLANDS.flatMap((isl) =>
  (isl.chests ?? []).map((c) => ({ ...c, island: isl.id })),
);
export const GAME_CHESTS = ALL_CHESTS.filter((c) => c.game);

// Every readable grove book across the archipelago, tagged with its island id so
// the world scene can place it and the Tome Raider interaction can count reads.
export const ALL_BOOKS = ISLANDS.flatMap((isl) =>
  (isl.books ?? []).map((b) => ({ ...b, island: isl.id })),
);

// Translate an island-local tile to a world tile.
export function worldTile(islandId, [lx, ly]) {
  const [ox, oy] = ISLAND_BY_ID[islandId].origin;
  return [ox + lx, oy + ly];
}

// Bridges spanning the 3-tile water gaps. Each deck tile becomes a walkable 'b'
// in the composed grid; a single bridge sprite is drawn over the gap.
//   orient "v": 1 tile wide, 3 tiles tall  (sprite bridgeVertical, 16x48)
//   orient "h": 3 tiles wide, 1 tile tall  (sprite bridgeHorizontal, 48x16)
// x/y are the top-left world tile of the deck. `label` names the destination.
export const BRIDGES = [
  { orient: "v", x: 33, y: 19, label: "Imaginary Archipelago" }, // hub <-> island2
  { orient: "v", x: 33, y: 38, label: "Human Trace Garden" },    // hub <-> island4
  { orient: "h", x: 44, y: 29, label: "Adventure Camp" },        // hub <-> island3
  { orient: "h", x: 21, y: 29, label: "Creation & System" },     // hub <-> island5
];

// Deck tiles a bridge occupies, as [x, y] world tiles.
export function bridgeDeck(b) {
  const tiles = [];
  if (b.orient === "v") {
    for (let dy = 0; dy < 3; dy++) tiles.push([b.x, b.y + dy]);
  } else {
    for (let dx = 0; dx < 3; dx++) tiles.push([b.x + dx, b.y]);
  }
  return tiles;
}

// The guestbook mailbox: an always-open spot in the hub where any visitor can
// drop a free-text note, even if they never finish the quest. Placed just off
// the spawn (which is hub-local [9, 11]) so it's in view from the first step,
// on clear grass beside the welcome gate and off the central road.
export const GUESTBOOK = { island: "hub", tile: [11, 9] };

// Where the player first appears (world tile) and which way they face.
// Spawn on column 33 — the same column as the north/south vertical bridges — so
// walking straight up or down from the start funnels directly onto a bridge.
export const START = { spawn: [33, 33], face: "up" };

// Stamp every island and bridge into a single world grid. Returns the composed
// terrain (array of strings), a flat list of world-space objects, the bridges,
// and the grid dimensions.
export function composeWorld() {
  const MARGIN = 3;
  let maxX = 0;
  let maxY = 0;
  for (const isl of ISLANDS) {
    const [ox, oy] = isl.origin;
    const h = isl.terrain.length;
    const w = isl.terrain[0].length;
    // Guard against hand-authoring typos: every row must be the same width.
    isl.terrain.forEach((row, r) => {
      if (row.length !== w)
        throw new Error(`island "${isl.id}" row ${r} is ${row.length} wide, expected ${w}`);
    });
    maxX = Math.max(maxX, ox + w);
    maxY = Math.max(maxY, oy + h);
  }
  const W = maxX + MARGIN;
  const H = maxY + MARGIN;

  const grid = Array.from({ length: H }, () => new Array(W).fill("w"));

  for (const isl of ISLANDS) {
    const [ox, oy] = isl.origin;
    isl.terrain.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch !== "w") grid[oy + r][ox + c] = ch;
      }
    });
  }

  for (const b of BRIDGES) {
    for (const [x, y] of bridgeDeck(b)) grid[y][x] = "b";
  }

  const objects = [];
  for (const isl of ISLANDS) {
    const [ox, oy] = isl.origin;
    for (const o of isl.objects ?? []) {
      objects.push({ ...o, x: ox + o.x, y: oy + o.y });
    }
  }

  return { terrain: grid.map((row) => row.join("")), objects, bridges: BRIDGES, width: W, height: H };
}
