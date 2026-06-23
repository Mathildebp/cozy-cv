// Ephemeral per-playthrough scratch state that is NOT part of saved progress
// (which lives in state.js). Used by spatial minigames that need to remember
// things across the world<->dialogue boundary within a single run, e.g. which of
// Empathus's lost items the player has picked up.

export const runtime = {
  pickedItems: new Set(),  // ids of collectible items currently carried
  openedChests: new Set(), // ids of memory chests whose lid has been opened
  readBooks: new Set(),    // ids of grove books the player has opened and read
};

export function resetRuntime() {
  runtime.pickedItems.clear();
  runtime.openedChests.clear();
  runtime.readBooks.clear();
}
