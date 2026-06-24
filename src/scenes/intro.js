// Post-PLAY intro: Ganymede walks in from the left, hops a little hello, and
// gives the player the brief (what this little world is and what to do) one
// speech-bubble line at a time. Space / click / tap advances each line; after
// the last it enters the world. The walk-in can be skipped with the first press.

export function registerIntro(k) {
  k.scene("intro", () => {
    // Warm backdrop, same palette as the title.
    k.add([k.fixed(), k.layer("ui"), k.z(0), {
      draw() {
        k.drawRect({ width: k.width(), height: k.height(), color: k.rgb(244, 211, 160) });
        k.drawRect({ width: k.width(), height: k.height() / 2, color: k.rgb(168, 214, 196), opacity: 0.5 });
      },
    }]);

    const cx = () => k.width() / 2;
    const GANY = [231, 120, 90]; // Ganymede's signature tint, mirrors npcs.js
    const SPRITE_H = 2.6 * 48;   // scaled character height, for placing his head
    const groundY = () => k.height() * 0.66;
    const ganyX = () => cx();

    const brief = [
      "Hi there — I'm Ganymede!",
      "Welcome to a little world made\nto help you get to know me.",
      "Wander around and chat with the\nislanders — lend each a hand.",
      "Everyone shares a Memory Brick.\nGather all six. No rush, no losing.",
      "That's the brief! Off you go —",
    ];

    const gany = k.add([
      k.sprite("character"), k.color(...GANY), k.scale(2.6),
      k.anchor("bot"), k.pos(-70, groundY()),
      k.fixed(), k.layer("ui"), k.z(1),
    ]);
    gany.play("walk-right");

    let arrived = false;
    let line = 0;
    let hopT = 0;     // greeting-hop timer, re-armed on each new line
    let bubbleA = 0;  // speech-bubble fade-in for the current line

    gany.onUpdate(() => {
      if (!arrived) {
        gany.pos.y = groundY();
        gany.pos.x += 240 * k.dt();
        if (gany.pos.x >= ganyX()) { gany.pos.x = ganyX(); arrived = true; gany.play("idle-down"); hopT = 0; }
        return;
      }
      gany.pos.x = ganyX();
      hopT += k.dt();
      // A couple of quick bounces as a "hello" each time a new line appears.
      const hop = hopT < 0.9 ? -Math.abs(Math.sin(hopT * Math.PI * 2.6)) * 10 : 0;
      gany.pos.y = groundY() + hop;
      bubbleA = Math.min(1, bubbleA + k.dt() * 3);
    });

    // Speech bubble above Ganymede's head carrying the current brief line, with
    // a small tail pointing down to him. Fades in once he has arrived.
    k.add([k.fixed(), k.layer("ui"), k.z(1), {
      draw() {
        if (!arrived || bubbleA <= 0) return;
        const pad = 14;
        const text = brief[line];
        const m = k.formatText({ text, font: "sprout", size: 15, align: "center" });
        const w = m.width + pad * 2, h = m.height + pad * 2;
        const bx = ganyX();
        const headY = groundY() - SPRITE_H;
        const by = headY - h / 2 - 12;
        // Coral border, cream body, then the tail breaks the outline at the foot.
        k.drawRect({ pos: k.vec2(bx, by), width: w + 4, height: h + 4, radius: 13, anchor: "center", color: k.rgb(231, 120, 90), opacity: 0.9 * bubbleA });
        k.drawRect({ pos: k.vec2(bx, by), width: w, height: h, radius: 12, anchor: "center", color: k.rgb(255, 252, 244), opacity: 0.97 * bubbleA });
        k.drawTriangle({
          p1: k.vec2(bx - 14, by + h / 2 - 2), p2: k.vec2(bx + 6, by + h / 2 - 2), p3: k.vec2(bx - 2, headY + 8),
          color: k.rgb(255, 252, 244), opacity: 0.97 * bubbleA,
        });
        k.drawText({ text, font: "sprout", size: 15, align: "center", pos: k.vec2(bx, by), anchor: "center", color: k.rgb(74, 53, 38), opacity: bubbleA });
      },
    }]);

    // Blinking continue cue at the bottom.
    const cue = k.isTouchscreen() ? "tap to continue" : "Space to continue";
    k.add([
      k.text(cue, { font: "sprout", size: 13, align: "center" }),
      k.color(110, 84, 60), k.anchor("center"), k.fixed(), k.layer("ui"), k.z(1),
      { update() { this.pos = k.vec2(cx(), k.height() * 0.9); this.opacity = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(k.time() * 3)); } },
    ]);

    const advance = () => {
      // First press finishes the walk-in instead of skipping a line.
      if (!arrived) { gany.pos.x = ganyX(); arrived = true; gany.play("idle-down"); hopT = 0; bubbleA = 0; return; }
      if (line < brief.length - 1) { line += 1; hopT = 0; bubbleA = 0; }
      else k.go("world");
    };
    k.onKeyPress(["space", "enter"], advance);
    k.onMousePress(advance); // tap also advances, for touch devices
  });
}
