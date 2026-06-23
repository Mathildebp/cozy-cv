// Per-NPC micro-interactions. Each is an async function (k, npc) that runs the
// interaction and returns true when the NPC's brick has just been earned (the
// world scene then plays the brick celebration). They lean on the dialogue +
// choice UI so they share one consistent look and stay well under 90 seconds.

import { say, choose } from "../ui/dialogue.js";
import { runtime } from "../runtime.js";
import { GAME_CHESTS, ALL_BOOKS } from "../data/islands.js";
import { playClip, stopClip, preloadClips } from "../audio/youtube.js";
import { muteMusicForClip } from "../audio/sound.js";

export const MINIGAMES = {
  // GANYMEDE (id "kindor") - Kindness. Tutorial NPC; helping the player IS the interaction.
  async kindor(k, npc) {
    await say(k, [
      "Oh — a new face! Welcome to the islands.",
      "I'm Ganymede. I help folks find their way around here.",
      "Every islander keeps a Memory Brick. Chat with them, lend a hand,",
      "and they'll share one with you. Seven in all.",
    ], { speaker: npc.name, color: npc.color });

    const pick = await choose(k, "Need a hand getting started?", [
      "Where should I go?",
      "I'll just explore!",
    ]);
    if (pick === 0) {
      await say(k, [
        "Four bridges leave this hub, one to each island.",
        "A misty grove, a noisy camp, a quiet garden, a workshop.",
        "No rush. There's no way to lose here.",
      ], { speaker: npc.name, color: npc.color });
    } else {
      await say(k, ["That's the spirit. Wander wherever the path pulls you."], { speaker: npc.name, color: npc.color });
    }

    await say(k, [
      "Here — take this. A Kindness Brick,",
      "for letting me help. It's how everything starts.",
    ], { speaker: npc.name, color: npc.color });
    return true;
  },

  // TOME RAIDER - Imagination. The books are physical props scattered around the
  // grove, read in the world via the pickup mechanic (a bubble marks each unread
  // book; opening it leaves it lying open). This just checks progress and hands
  // over the brick once every book has been read.
  async tomeraider(k, npc) {
    const read = ALL_BOOKS.filter((b) => runtime.readBooks.has(b.id)).length;
    const total = ALL_BOOKS.length;

    if (read === 0) {
      await say(k, [
        "Oh. Hello. Lost in a good book again.",
        "There are books scattered around the grove —",
        "walk up to each one and open it. Then come tell me.",
      ], { speaker: npc.name, color: npc.color });
      return false;
    }

    if (read < total) {
      await say(k, [
        "You're at " + read + " of " + total + " books.",
        "Keep reading — there's more out among the trees.",
      ], { speaker: npc.name, color: npc.color });
      return false;
    }

    await say(k, [
      "You read every one. Whole worlds, held in your head at once.",
      "Take the Imagination Brick. Worlds are for sharing.",
    ], { speaker: npc.name, color: npc.color });
    return true;
  },

  // XP RIENCE - Curiosity. Points the player at the real chests behind camp;
  // the brick is earned out in the world by opening the last game chest (see
  // world.js). This only guides progress, and acts as a safety net that hands
  // over the brick if every game chest is open but it was never claimed (e.g.
  // the player dismissed the final reveal).
  async xprience(k, npc) {
    const opened = GAME_CHESTS.filter((c) => runtime.openedChests.has(c.id)).length;
    const total = GAME_CHESTS.length;

    if (opened === 0) {
      await say(k, [
        "Hey hey! Over here!",
        "A whole stash of chests behind camp — go crack 'em open.",
        "Some hold a game I loved. Most just hold junk.",
      ], { speaker: npc.name, color: npc.color });
      return false;
    }

    if (opened < total) {
      await say(k, [
        opened + " of " + total + " game memories dug up so far.",
        "Keep prying those lids — there's more back there.",
      ], { speaker: npc.name, color: npc.color });
      return false;
    }

    await say(k, [
      "Every memory uncovered! That curiosity of yours — keep it.",
      "Here: the Curiosity Brick.",
    ], { speaker: npc.name, color: npc.color });
    return true;
  },

  // EMPATHUS - Carefulness. Spatial fetch quest: the four items are scattered on
  // the island and collected via the world's pickup mechanic.
  async empathus(k, npc) {
    const items = [
      { id: "d_cup", name: "cup" },
      { id: "d_letter", name: "letter" },
      { id: "d_scarf", name: "scarf" },
      { id: "d_notebook", name: "notebook" },
    ];
    const missing = items.filter((it) => !runtime.pickedItems.has(it.id));

    if (missing.length === items.length) {
      await say(k, [
        "Oh dear, oh dear. I've lost four things again.",
        "A cup, a letter, a scarf, a notebook —",
        "somewhere out here in the garden.",
        "Could you find them and bring them back? Walk around and pick them up.",
      ], { speaker: npc.name, color: npc.color });
      return false;
    }

    if (missing.length > 0) {
      await say(k, [
        "Let's see... you've found " + (items.length - missing.length) + " of 4.",
        "Still out there: " + missing.map((m) => m.name).join(", ") + ".",
      ], { speaker: npc.name, color: npc.color });
      return false;
    }

    // All four carried back.
    items.forEach((it) => runtime.pickedItems.delete(it.id));
    await say(k, [
      "You found them all? Oh, thank you, thank you!",
      "I really must learn to be more careful...",
      "Please — the Carefulness Brick. You've earned it twice over.",
    ], { speaker: npc.name, color: npc.color });
    return true;
  },

  // DEBUG GERARD - Understanding. Order-of-clues logic puzzle: clock = 3 (its hands:
  // hour/minute/second), book = 7 (days in a week). Read left-to-right -> 37.
  // No fail state: wrong guesses just get a hint.
  async gerard(k, npc) {
    await say(k, [
      "A visitor. Good. This lock needs a mind, not a key.",
      "Two clues stand before you, left to right:",
      "  A clock sweeps its face: hour, minute, second.",
      "  A book of days spans one full week.",
      "Read them in order. What number opens the chest?",
    ], { speaker: npc.name, color: npc.color });

    for (;;) {
      const pick = await choose(k, "The chest expects...", ["10", "37", "73", "21"]);
      if (pick === 1) break;
      await say(k, ["Not quite.", "Count the clock's hands, then the days in the week."], { speaker: npc.name, color: npc.color });
    }

    await say(k, [
      "...thirty-seven. The chest clicks open.",
      "You saw how the pieces fit. That's understanding.",
      "Take the brick. You read the world correctly.",
    ], { speaker: npc.name, color: npc.color });
    return true;
  },

  // MELODYSSEE - Emotion. Blind test; every answer is revealed (no failure),
  // the reward is for listening through to the end. Each round streams a real
  // soundtrack snippet via YouTube (see ../audio/youtube.js); `start` is the
  // second to drop into for the most recognisable phrase (tweak by ear).
  async melodyssee(k, npc) {
    preloadClips(); // warm up the YouTube player while she sets the scene
    await say(k, [
      "Shh. Close your eyes and just listen.",
      "Three guesses each. Name what your heart hears.",
    ], { speaker: npc.name, color: npc.color });

    const rounds = [
      { video: "c56t7upa8Bk", start: 120, clue: "♪ a slow tide of strings, rising, and rising...", opts: ["Time — Inception", "The Dark Knight", "Gladiator"], answer: 0, react: ["Inception. It always feels like waking up."] },
      { video: "0lDvyER0E6Y", start: 17, clue: "♪ a voice woven straight into the forest...", opts: ["Pirates of the Caribbean", "Songcord — Avatar", "Titanic"], answer: 1, react: ["Avatar's Songcord. The whole world sings back."] },
      { video: "bpa9YbzCF3c", start: 9, clue: "♪ a children's choir circling a bubbling cauldron...", opts: ["Amélie", "Harry Potter — Double Trouble", "Up"], answer: 1, react: ["Double Trouble. Something wicked — and you heard it coming."] },
      { video: "BEm0AjTbsac", start: 10, clue: "♪ low voices carrying over a far green hill...", opts: ["The Hobbit — Misty Mountains", "Skyrim", "Game of Thrones"], answer: 0, react: ["The Misty Mountains. Home, and the ache to leave it."] },
    ];

    let correct = 0;
    try {
      for (const r of rounds) {
        muteMusicForClip(true); // get the ambient bed out of the clip's way
        playClip(r.video, r.start);
        const pick = await choose(k, r.clue, r.opts);
        stopClip();
        muteMusicForClip(false);
        if (pick === r.answer) {
          correct++;
          await say(k, ["Yes — exactly that.", ...r.react], { speaker: npc.name, color: npc.color });
        } else {
          await say(k, ["Not this time. It was: " + r.opts[r.answer] + ".", ...r.react], { speaker: npc.name, color: npc.color });
        }
      }
    } finally {
      stopClip(); // never let a clip keep playing if the player escapes mid-round
      muteMusicForClip(false); // and always restore the ambient bed
    }

    if (correct < rounds.length) {
      await say(k, [
        "Your heart wandered on a few of those.",
        "Come listen again when you're ready.",
      ], { speaker: npc.name, color: npc.color });
      return false;
    }

    await say(k, [
      "Every one — exactly right. You truly heard them.",
      "The Emotion Brick is yours.",
    ], { speaker: npc.name, color: npc.color });
    return true;
  },
};
