// Asset loading + tile metadata for the island map.
//
// Terrain sheets (Grass, Tilled_Dirt_Wide) are Sprout Lands "blob" autotile
// sheets: 11x7 grids of 16px tiles covering all 47 edge/corner cases, including
// the concave (inner) corners used where a single diagonal neighbour differs.
// We drive them from each cell's 8 neighbours - see autotile.js for the
// bitmask -> frame mapping.
//
// Water is a 4-frame full-tile animation. Objects (trees/flowers/rocks) come
// from a single transparent object sheet, loaded as a named atlas.

export const TILE_SIZE = 16;

// 8-neighbour blob lookup: index = bitmask of same-terrain neighbours
//   N=1, E=2, S=4, W=8, NE=16, SE=32, SW=64, NW=128.
// A diagonal only changes the tile when both its adjacent cardinals match (that
// is what turns a flat center into a concave/inner corner); the tables already
// fold in that rule, so any of the 256 raw masks indexes the correct frame.
//
// Grass and Dirt use near-identical sheets but a few frames sit in different
// slots, so each terrain gets its own table. Both were derived from the sheet
// pixels (see scripts in git history) rather than hand-authored.

// prettier-ignore
export const GRASS_AUTOTILE_FRAMES = [
  46,25,33,37, 3,14, 4,48,35,40,34,41, 7,51, 8,52,
  46,25,33,22, 3,14, 4,15,35,40,34,39, 7,51, 8,42,
  46,25,33,37, 3,14, 0,26,35,40,34,41, 7,51, 6,31,
  46,25,33,22, 3,14, 0,11,35,40,34,39, 7,51, 6,50,
  46,25,33,37, 3,14, 4,48,35,40,34,41, 2,29, 5,32,
  46,25,33,22, 3,14, 4,15,35,40,34,39, 2,29, 5, 9,
  46,25,33,37, 3,14, 0,26,35,40,34,41, 2,29, 1,30,
  46,25,33,22, 3,14, 0,11,35,40,34,39, 2,29, 1,28,
  46,25,33,37, 3,14, 4,48,35,24,34,38, 7,18, 8,43,
  46,25,33,22, 3,14, 4,15,35,24,34,23, 7,18, 8,19,
  46,25,33,37, 3,14, 0,26,35,24,34,38, 7,18, 6,20,
  46,25,33,22, 3,14, 0,11,35,24,34,23, 7,18, 6,17,
  46,25,33,37, 3,14, 4,48,35,24,34,38, 2,13, 5,49,
  46,25,33,22, 3,14, 4,15,35,24,34,23, 2,13, 5,16,
  46,25,33,37, 3,14, 0,26,35,24,34,38, 2,13, 1,27,
  46,25,33,22, 3,14, 0,11,35,24,34,23, 2,13, 1,12,
];

// prettier-ignore
export const DIRT_AUTOTILE_FRAMES = [
  36,25,33,37, 3,14, 4,48,35,40,34,41, 7,51, 8,52,
  36,25,33,22, 3,14, 4,15,35,40,34,39, 7,51, 8,42,
  36,25,33,37, 3,14, 0,26,35,40,34,41, 7,51, 6,31,
  36,25,33,22, 3,14, 0,11,35,40,34,39, 7,51, 6,50,
  36,25,33,37, 3,14, 4,48,35,40,34,41, 2,29, 5,32,
  36,25,33,22, 3,14, 4,15,35,40,34,39, 2,29, 5,20,
  36,25,33,37, 3,14, 0,26,35,40,34,41, 2,29, 1,30,
  36,25,33,22, 3,14, 0,11,35,40,34,39, 2,29, 1,28,
  36,25,33,37, 3,14, 4,48,35,24,34,38, 7,18, 8,43,
  36,25,33,22, 3,14, 4,15,35,24,34,23, 7,18, 8,19,
  36,25,33,37, 3,14, 0,26,35,24,34,38, 7,18, 6, 9,
  36,25,33,22, 3,14, 0,11,35,24,34,23, 7,18, 6,17,
  36,25,33,37, 3,14, 4,48,35,24,34,38, 2,13, 5,49,
  36,25,33,22, 3,14, 4,15,35,24,34,23, 2,13, 5,16,
  36,25,33,37, 3,14, 0,26,35,24,34,38, 2,13, 1,27,
  36,25,33,22, 3,14, 0,11,35,24,34,23, 2,13, 1,12,
];

// Object atlases. Each entry maps a source sheet (under assets/Objects) to its
// named regions in pixels. Every region's "foot" (base of trunk / shadow) sits
// at the bottom of its box, which is what we anchor on for Y-sorting. Region
// names double as the sprite name used by map objects (see renderMap + island
// JSON), so renaming one means updating the map data too.
//
// Coordinates were derived from connected-component analysis of each sheet's
// alpha channel, then snapped to the 16px tile grid. They're a usable first
// pass; refine boxes as individual props get split out.

// Basic_Grass_Biom_things.png (144x80) - 9x5 grid of natural decorations.
// Matches the _numbered_ reference sheet, item numbers noted in comments.
const GRASS_BIOM_ATLAS = {
  // trees (rows 0-1)
  tree:           { x: 0,   y: 0,  width: 16, height: 32 }, // #1 slim tree
  treeBig:        { x: 16,  y: 0,  width: 32, height: 32 }, // #2 large oak
  appleTree:      { x: 48,  y: 0,  width: 32, height: 32 }, // #4 apple tree
  // mushrooms (row 0)
  mushroomsRed:    { x: 80,  y: 0,  width: 16, height: 16 }, // #5
  mushroomRed:     { x: 96,  y: 0,  width: 16, height: 16 }, // #6
  mushroomPurple:  { x: 112, y: 0,  width: 16, height: 16 }, // #7
  mushroomsPurple: { x: 128, y: 0,  width: 16, height: 16 }, // #8
  // ground cover + rocks (row 1)
  grassTuft:      { x: 80,  y: 16, width: 16, height: 16 }, // #14
  grassTufts:     { x: 96,  y: 16, width: 16, height: 16 }, // #15
  rockSmall:      { x: 112, y: 16, width: 16, height: 16 }, // #16
  rockBig:        { x: 128, y: 16, width: 16, height: 16 }, // #17
  // small flora + stumps (row 2)
  flowersPink:    { x: 0,   y: 32, width: 16, height: 16 }, // #18
  berry:          { x: 16,  y: 32, width: 16, height: 16 }, // #19
  apple:          { x: 32,  y: 32, width: 16, height: 16 }, // #20
  stumpSmall:     { x: 48,  y: 32, width: 16, height: 16 }, // #21
  stump:          { x: 64,  y: 32, width: 16, height: 16 }, // #22
  log:            { x: 80,  y: 32, width: 16, height: 16 }, // #23
  flowersYellow:  { x: 96,  y: 32, width: 16, height: 16 }, // #24
  flowerYellow:   { x: 112, y: 32, width: 16, height: 16 }, // #25
  sunflower:      { x: 128, y: 32, width: 16, height: 32 }, // #26/#35 (tall)
  // bushes + accents (row 3)
  berryBush:      { x: 0,   y: 48, width: 16, height: 16 }, // #27
  bush:           { x: 16,  y: 48, width: 16, height: 16 }, // #28
  berryTiny:      { x: 32,  y: 48, width: 16, height: 16 }, // #29
  seedling:       { x: 48,  y: 48, width: 16, height: 16 }, // #30
  grapes:         { x: 64,  y: 48, width: 16, height: 16 }, // #31
  sign:           { x: 80,  y: 48, width: 16, height: 16 }, // #32
  flowerPinkSmall:{ x: 96,  y: 48, width: 16, height: 16 }, // #33
  flowerPink:     { x: 112, y: 48, width: 16, height: 16 }, // #34
  // hedges, boulders, water plants (row 4). Two hedges sit on this row with a
  // one-tile gap between them: a 2-tile hedge (cols 0-1) and a 3-tile hedgeBig
  // (cols 2-4). Each is a green mass with a small brown post at its right end.
  hedge:          { x: 0,   y: 64, width: 32, height: 16 }, // #36-37
  hedgeBig:       { x: 32,  y: 64, width: 48, height: 16 }, // #38-40
  boulder:        { x: 80,  y: 64, width: 16, height: 16 }, // #41
  pebble:         { x: 96,  y: 64, width: 16, height: 16 }, // #42
  lilyPad:        { x: 112, y: 64, width: 16, height: 16 }, // #43
  lilyPads:       { x: 128, y: 64, width: 16, height: 16 }, // #44
};

// Basic_Plants.png (96x32) - two crop rows, six growth stages each.
const PLANTS_ATLAS = {
  seedBagGrain:   { x: 0,  y: 0,  width: 16, height: 16 },
  grainSeedling:  { x: 16, y: 0,  width: 16, height: 16 },
  grainSprout:    { x: 32, y: 0,  width: 16, height: 16 },
  grainYoung:     { x: 48, y: 0,  width: 16, height: 16 },
  grainMature:    { x: 64, y: 0,  width: 16, height: 16 },
  grain:          { x: 80, y: 0,  width: 16, height: 16 },
  seedBagFruit:   { x: 0,  y: 16, width: 16, height: 16 },
  fruitSeedling:  { x: 16, y: 16, width: 16, height: 16 },
  fruitSprout:    { x: 32, y: 16, width: 16, height: 16 },
  fruitFlower:    { x: 48, y: 16, width: 16, height: 16 },
  fruitMature:    { x: 64, y: 16, width: 16, height: 16 },
  eggplant:       { x: 80, y: 16, width: 16, height: 16 },
};

// Basic_tools_and_meterials.png (48x32).
const TOOLS_ATLAS = {
  wateringCan:    { x: 0,  y: 0,  width: 16, height: 16 },
  axe:            { x: 16, y: 0,  width: 16, height: 16 },
  pickaxe:        { x: 32, y: 0,  width: 16, height: 16 },
  stonePile:      { x: 0,  y: 16, width: 16, height: 16 },
  woodMaterial:   { x: 16, y: 16, width: 16, height: 16 },
  woodPlanks:     { x: 32, y: 16, width: 16, height: 16 },
};

// Simple_Milk_and_grass_item.png (64x16).
const MILK_ATLAS = {
  milkFull:       { x: 0,  y: 0, width: 16, height: 16 },
  milkHalf:       { x: 16, y: 0, width: 16, height: 16 },
  milkEmpty:      { x: 32, y: 0, width: 16, height: 16 },
  grassPlant:     { x: 48, y: 0, width: 16, height: 16 },
};

// Basic_Furniture.png (144x96) - 9x6 grid of indoor furniture.
const FURNITURE_ATLAS = {
  // wall art + plants (rows 0-1)
  painting:       { x: 0,  y: 0,  width: 16, height: 16 },
  paintingWide:   { x: 16, y: 0,  width: 16, height: 16 },
  paintingNight:  { x: 32, y: 0,  width: 16, height: 16 },
  plantTall:      { x: 48, y: 0,  width: 16, height: 16 },
  plantSmall:     { x: 64, y: 0,  width: 16, height: 16 },
  plantFlower:    { x: 80, y: 0,  width: 16, height: 16 },
  potGreen:       { x: 48, y: 16, width: 16, height: 16 },
  potBlue:        { x: 64, y: 16, width: 16, height: 16 },
  potPink:        { x: 80, y: 16, width: 16, height: 16 },
  // beds (rows 1-2 and 4-5)
  bedGreen:       { x: 0,  y: 16, width: 16, height: 32 },
  bedBlue:        { x: 16, y: 16, width: 16, height: 32 },
  bedPink:        { x: 32, y: 16, width: 16, height: 32 },
  bedGreenMade:   { x: 0,  y: 51, width: 16, height: 29 },
  bedBlueMade:    { x: 16, y: 51, width: 16, height: 29 },
  bedPinkMade:    { x: 32, y: 51, width: 16, height: 29 },
  // seating + surfaces + clocks (rows 2-3)
  dresser:        { x: 48, y: 32, width: 16, height: 16 },
  chairLeft:      { x: 64, y: 32, width: 16, height: 16 },
  chairRight:     { x: 80, y: 32, width: 16, height: 16 },
  stool:          { x: 96, y: 32, width: 16, height: 16 },
  stoolSmall:     { x: 112,y: 32, width: 16, height: 16 },
  table:          { x: 48, y: 48, width: 16, height: 16 },
  tableSmall:     { x: 64, y: 48, width: 16, height: 16 },
  clockTall:      { x: 80, y: 48, width: 16, height: 16 },
  clock:          { x: 96, y: 48, width: 16, height: 16 },
  clockSmall:     { x: 112,y: 48, width: 16, height: 16 },
  // rugs (row 5)
  rugGreen:       { x: 0,  y: 80, width: 16, height: 16 },
  rugPink:        { x: 16, y: 80, width: 16, height: 16 },
  rugBlue:        { x: 32, y: 80, width: 16, height: 16 },
  rugWideGreen:   { x: 48, y: 80, width: 32, height: 16 },
  rugWidePink:    { x: 80, y: 80, width: 32, height: 16 },
  rugWideBlue:    { x: 112,y: 80, width: 32, height: 16 },
};

// Chest.png (240x96) - opening animation; expose just the useful end frames.
const CHEST_ATLAS = {
  chestClosed:    { x: 16,  y: 16, width: 16, height: 16 },
  chestOpen:      { x: 208, y: 12, width: 16, height: 20 },
};

// Wood_Bridge.png (80x48) - vertical strip + horizontal span. The sheet packs
// two stacked horizontal spans (y 0-15 and y 16-31); we use a single span so a
// horizontal bridge reads as one deck, mirroring the 1-tile-wide vertical one.
const BRIDGE_ATLAS = {
  bridgeVertical:   { x: 0,  y: 0, width: 16, height: 48 },
  bridgeHorizontal: { x: 32, y: 0, width: 48, height: 16 },
};

// Fences.png (64x64) - a 4x4 blob fence sheet. We expose the run pieces as
// discrete decorative props so a row/column of them reads as a continuous fence:
//   horizontal run -> fenceLeft (13) . fenceMid (14) . fenceRight (15)
//   vertical run   -> fenceTop (0)  . fenceVert (4) . fenceBottom (8)
//   fencePost (12) is a single standalone post.
const FENCE_ATLAS = {
  fenceTop:    { x: 0,  y: 0,  width: 16, height: 16 }, // #0
  fenceVert:   { x: 0,  y: 16, width: 16, height: 16 }, // #4
  fenceBottom: { x: 0,  y: 32, width: 16, height: 16 }, // #8
  fencePost:   { x: 0,  y: 48, width: 16, height: 16 }, // #12
  fenceLeft:   { x: 16, y: 48, width: 16, height: 16 }, // #13
  fenceMid:    { x: 32, y: 48, width: 16, height: 16 }, // #14
  fenceRight:  { x: 48, y: 48, width: 16, height: 16 }, // #15
};

// House construction tiles. Houses are assembled cell-by-cell (left / middle /
// right columns x top / middle / bottom rows) so cottages of any width and
// height fall out of these 3x3 blocks - see houses.js. The roof shingles get
// drawn tinted per resident, which is what makes each home read differently.

// Wooden_House_Roof_Tilset.png (112x80) - left 3x3 block: ridge caps (row 0),
// shingles (row 1), eave band (row 2).
const HOUSE_ROOF_ATLAS = {
  roofCapL:  { x: 0,  y: 0,  width: 16, height: 16 },
  roofCapM:  { x: 16, y: 0,  width: 16, height: 16 },
  roofCapR:  { x: 32, y: 0,  width: 16, height: 16 },
  roofShL:   { x: 0,  y: 16, width: 16, height: 16 },
  roofShM:   { x: 16, y: 16, width: 16, height: 16 },
  roofShR:   { x: 32, y: 16, width: 16, height: 16 },
  roofEaveL: { x: 0,  y: 32, width: 16, height: 16 },
  roofEaveM: { x: 16, y: 32, width: 16, height: 16 },
  roofEaveR: { x: 32, y: 32, width: 16, height: 16 },
};

// Wooden_House_Walls_Tilset.png (80x48) - left 3x3 block: top beam (row 0),
// brick infill (row 1), plank base (row 2).
const HOUSE_WALL_ATLAS = {
  wallTopL: { x: 0,  y: 0,  width: 16, height: 16 },
  wallTopM: { x: 16, y: 0,  width: 16, height: 16 },
  wallTopR: { x: 32, y: 0,  width: 16, height: 16 },
  wallMidL: { x: 0,  y: 16, width: 16, height: 16 },
  wallMidM: { x: 16, y: 16, width: 16, height: 16 },
  wallMidR: { x: 32, y: 16, width: 16, height: 16 },
  wallBotL: { x: 0,  y: 32, width: 16, height: 16 },
  wallBotM: { x: 16, y: 32, width: 16, height: 16 },
  wallBotR: { x: 32, y: 32, width: 16, height: 16 },
};

// Doors.png (16x64) - a closed door (row 1) and an ajar door (row 3).
const DOOR_ATLAS = {
  houseDoor:     { x: 0, y: 16, width: 16, height: 16 },
  houseDoorOpen: { x: 0, y: 48, width: 16, height: 16 },
};

const OBJECT_ATLASES = {
  "assets/Objects/Basic_Grass_Biom_things.png": GRASS_BIOM_ATLAS,
  "assets/Objects/Basic_Plants.png": PLANTS_ATLAS,
  "assets/Objects/Basic_tools_and_meterials.png": TOOLS_ATLAS,
  "assets/Objects/Simple_Milk_and_grass_item.png": MILK_ATLAS,
  "assets/Objects/Basic_Furniture.png": FURNITURE_ATLAS,
  "assets/Objects/Chest.png": CHEST_ATLAS,
  "assets/Objects/Wood_Bridge.png": BRIDGE_ATLAS,
  "assets/Tilesets/Fences.png": FENCE_ATLAS,
  "assets/Tilesets/Wooden_House_Roof_Tilset.png": HOUSE_ROOF_ATLAS,
  "assets/Tilesets/Wooden_House_Walls_Tilset.png": HOUSE_WALL_ATLAS,
  "assets/Tilesets/Doors.png": DOOR_ATLAS,
};

export function loadTilesets(k) {
  k.loadSprite("grass", "assets/Tilesets/Grass.png", { sliceX: 11, sliceY: 7 });
  k.loadSprite("dirt", "assets/Tilesets/Tilled_Dirt_Wide.png", { sliceX: 11, sliceY: 7 });
  k.loadSprite("water", "assets/Tilesets/Water.png", {
    sliceX: 4,
    sliceY: 1,
    anims: { flow: { from: 0, to: 3, loop: true, speed: 6 } },
  });

  for (const [path, atlas] of Object.entries(OBJECT_ATLASES)) {
    k.loadSpriteAtlas(path, atlas);
  }

  // Single-image / tiled sheets that aren't a grid of discrete props.
  k.loadSprite("chickenHouse", "assets/Objects/Free_Chicken_House.png");
  k.loadSprite("egg", "assets/Objects/Egg_item.png");
  k.loadSprite("path", "assets/Objects/Paths.png", { sliceX: 4, sliceY: 4 });
}
