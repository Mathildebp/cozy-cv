// Cardinal + diagonal (8-neighbour) blob autotiling.
//
// For a cell that belongs to some terrain, we look at all 8 neighbours and build
// an 8-bit mask of which ones share the same terrain. That mask indexes a blob
// table (GRASS_/DIRT_AUTOTILE_FRAMES) to pick the sprite frame whose edges and
// corners connect correctly - including concave (inner) corners where a single
// diagonal neighbour is water, which a 4-neighbour scheme would wrongly flatten
// into the center tile.

const N = 1, E = 2, S = 4, W = 8, NE = 16, SE = 32, SW = 64, NW = 128;

// `frames` is the 256-entry blob table for the terrain.
// `present` is (x, y) -> boolean: is this terrain present at that cell?
// Out-of-bounds counts as "not present" so map borders get clean coastlines.
export function autotileFrame(frames, present, x, y) {
  let mask = 0;
  if (present(x, y - 1)) mask |= N;
  if (present(x + 1, y)) mask |= E;
  if (present(x, y + 1)) mask |= S;
  if (present(x - 1, y)) mask |= W;
  if (present(x + 1, y - 1)) mask |= NE;
  if (present(x + 1, y + 1)) mask |= SE;
  if (present(x - 1, y + 1)) mask |= SW;
  if (present(x - 1, y - 1)) mask |= NW;
  return frames[mask];
}
