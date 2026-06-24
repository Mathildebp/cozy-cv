// Title screen: name, tagline, a PLAY button (from the UI kit) and the controls.
// Space / click / the button all start the world at the hub.

import { resetProgress } from "../state.js";
import { resetRuntime } from "../runtime.js";
import { startMusic } from "../audio/sound.js";
import { armClipUnlock } from "../audio/youtube.js";
import { track } from "../analytics.js";

export function registerTitle(k) {
  k.scene("title", () => {
    // Build the YouTube player now and prime it on the first tap, so Melodyssee's
    // clips are audible on mobile (which blocks non-gesture media playback).
    armClipUnlock();

    // Warm backdrop.
    k.add([k.fixed(), k.layer("ui"), k.z(0), {
      draw() {
        k.drawRect({ width: k.width(), height: k.height(), color: k.rgb(244, 211, 160) });
        k.drawRect({ width: k.width(), height: k.height() / 2, color: k.rgb(168, 214, 196), opacity: 0.5 });
      },
    }]);

    const cx = () => k.width() / 2;

    k.add([
      k.text("My World Quest", { font: "sprout", size: 44, align: "center" }),
      k.color(74, 53, 38), k.anchor("center"), k.fixed(), k.layer("ui"), k.z(1),
      { update() { this.pos = k.vec2(cx(), k.height() * 0.3); } },
    ]);
    const tagline = "a little world to get to know me, one chat at a time";
    const taglineY = () => k.height() * 0.3 + 42;
    // Soft cream plate behind the tagline so the text reads clearly over the
    // muddy cream/teal blend of the upper backdrop.
    k.add([k.fixed(), k.layer("ui"), k.z(0.5), {
      draw() {
        const m = k.formatText({ text: tagline, font: "sprout", size: 18 });
        k.drawRect({ pos: k.vec2(cx(), taglineY()), width: m.width + 28, height: 30, radius: 10, anchor: "center", color: k.rgb(250, 241, 220), opacity: 0.7 });
      },
    }]);
    k.add([
      k.text(tagline, { font: "sprout", size: 18, align: "center" }),
      k.color(74, 53, 38), k.anchor("center"), k.fixed(), k.layer("ui"), k.z(1),
      { update() { this.pos = k.vec2(cx(), taglineY()); } },
    ]);
    k.add([
      k.text("by Mathilde Belda", { font: "sprout", size: 12, align: "center" }),
      k.color(110, 84, 60), k.anchor("center"), k.opacity(0.7), k.fixed(), k.layer("ui"), k.z(1),
      { update() { this.pos = k.vec2(cx(), k.height() * 0.3 + 62); } },
    ]);

    // PLAY button (frames: 2 = PLAY, 3 = PLAY pressed).
    const btn = k.add([
      k.sprite("playButton", { frame: 2 }),
      k.anchor("center"), k.scale(2), k.fixed(), k.layer("ui"), k.z(1),
      k.area(),
      { update() { this.pos = k.vec2(cx(), k.height() * 0.58); } },
    ]);
    btn.onHover(() => (btn.frame = 3));
    btn.onHoverEnd(() => (btn.frame = 2));

    const controlsHint = k.isTouchscreen()
      ? "Drag the left side to move    ·    Tap the button to talk"
      : "Arrows / WASD to move    ·    Space or E to talk";
    k.add([
      k.text(controlsHint, { font: "sprout", size: 14, align: "center" }),
      k.color(110, 84, 60), k.anchor("center"), k.fixed(), k.layer("ui"), k.z(1),
      { update() { this.pos = k.vec2(cx(), k.height() * 0.78); } },
    ]);

    const start = () => {
      startMusic(); // first user gesture unlocks audio; the bed plays from here on
      track("game_started");
      resetProgress();
      resetRuntime();
      k.go("world");
    };
    btn.onClick(start);
    k.onKeyPress(["space", "enter"], start);
  });
}
