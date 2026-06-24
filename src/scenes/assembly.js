// Final assembly. In an abstract neutral space the earned bricks drift to
// the centre and settle into a slowly turning ring. Then the reflective closing
// lines play.

import { BRICKS, state } from "../state.js";
import { say, choose, dialogue, CANCELLED } from "../ui/dialogue.js";
import { drawBrick } from "../ui/brick.js";
import { openGuestbook } from "../ui/guestbook.js";
import { track, elapsedSeconds } from "../analytics.js";

const easeOut = (p) => 1 - Math.pow(1 - p, 3);
const lerp = (a, b, p) => a + (b - a) * p;

export function registerAssembly(k) {
  k.scene("assembly", () => {
    state.assembled = true;
    track("game_completed", { bricks: state.collected.size, seconds: elapsedSeconds() });
    let t = 0;
    let narrated = false;

    const stage = k.add([k.fixed(), k.layer("ui"), k.z(10), {
      update() { t += k.dt(); },
      draw() {
        const cx = k.width() / 2, cy = k.height() / 2;

        // Neutral space: deep fade-in wash with a soft central glow.
        const bgFade = Math.min(1, t / 0.8);
        k.drawRect({ width: k.width(), height: k.height(), color: k.rgb(28, 24, 38), opacity: bgFade });
        k.drawCircle({ pos: k.vec2(cx, cy), radius: 140, color: k.rgb(80, 70, 120), opacity: 0.25 * bgFade });

        // The bricks: fly in, then orbit as a turning ring/crown.
        const spin = Math.max(0, t - 3) * 0.5;
        BRICKS.forEach((b, i) => {
          const ang = (i / BRICKS.length) * Math.PI * 2 - Math.PI / 2 + spin;
          const delay = i * 0.18;
          const p = easeOut(Math.min(1, Math.max(0, (t - delay) / 2.0)));
          const startR = 320, endR = 78;
          const rad = lerp(startR, endR, p);
          const x = cx + Math.cos(ang) * rad;
          const y = cy + Math.sin(ang) * rad * 0.9 - 8;
          k.drawCircle({ pos: k.vec2(x, y), radius: 12, color: k.rgb(...b.color), opacity: 0.35 });
          drawBrick(k, x, y, 28, b.color);
        });
      },
    }]);

    // Kick off the closing narration after the assembly settles.
    k.onUpdate(() => {
      if (narrated || t < 4.2 || dialogue.active) return;
      narrated = true;
      runEnding(k);
    });
  });
}

async function runEnding(k) {
  await say(k, [
    "Each brick came from one conversation.",
    "Put together, that's a fair picture of who I am.",
  ]);
  await askFeedback(k);
  const cue = k.isTouchscreen() ? "(tap to return to the title)" : "(press Space to return to the title)";
  await say(k, ["Thanks for stopping by.", cue]);
  k.onKeyPress(["space", "enter"], () => k.go("title"));
  k.onMousePress(() => k.go("title")); // tap also returns, for touch devices
}

// A reflective, in-universe feedback beat: a quick rating asked through the
// existing dialogue UI, then an optional free-text note via the guestbook
// overlay. Both are sent to analytics. Pressing Escape at any point (CANCELLED)
// just skips the rest — feedback is always optional and never blocks the return
// to the title.
const RATINGS = ["I loved it", "It was nice", "Not really my thing"];

async function askFeedback(k) {
  try {
    const idx = await choose(k, "Before you go - how was your visit?", RATINGS);
    track("feedback_rating", { rating: RATINGS[idx], score: RATINGS.length - idx });

    const wantsNote = await choose(k, "Want to leave a note in the guestbook?", ["Yes, I'll write one", "No thanks"]);
    if (wantsNote === 0) {
      const note = await openGuestbook();
      if (note) track("feedback_note", { note, rating: RATINGS[idx] });
    }
  } catch (err) {
    if (err !== CANCELLED) throw err;
  }
}
