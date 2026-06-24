// Post-PLAY intro: Ganymede is already standing centre-stage, waving hello with
// his hand, and gives the player the brief (what this little world is and what
// to do) one speech-bubble line at a time. Space / click / tap advances each
// line; after the last it enters the world.

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

    // Ganymede, already in place, breathing (idle) where he stands.
    const gany = k.add([
      k.sprite("character"), k.color(...GANY), k.scale(2.6),
      k.anchor("bot"), k.pos(ganyX(), groundY()),
      k.fixed(), k.layer("ui"), k.z(1),
    ]);
    gany.play("idle-down");

    let line = 0;
    let bubbleA = 0; // speech-bubble fade-in for the current line
    gany.onUpdate(() => {
      gany.pos.x = ganyX();
      gany.pos.y = groundY();
      bubbleA = Math.min(1, bubbleA + k.dt() * 3);
    });

    // Waving hand: a little arm + hand beside Ganymede that swings back and
    // forth (the character sheet has no wave frame, so it's drawn as primitives).
    // Drawn above the sprite (z 2) so it always reads as a raised, waving hand.
    k.add([k.fixed(), k.layer("ui"), k.z(2), {
      draw() {
        const shoulder = k.vec2(ganyX() + 20, groundY() - 80);
        const ang = -1.05 + Math.sin(k.time() * 7) * 0.42; // swing around an up-right rest pose
        const hand = shoulder.add(k.vec2(Math.cos(ang), Math.sin(ang)).scale(22));
        k.drawLine({ p1: shoulder, p2: hand, width: 5, color: k.rgb(...GANY) });
        k.drawCircle({ pos: hand, radius: 5.5, color: k.rgb(...GANY) });
        k.drawCircle({ pos: hand, radius: 5.5, outline: { color: k.rgb(150, 70, 52), width: 1 }, fill: false });
      },
    }]);

    // Speech bubble above Ganymede's head carrying the current brief line, with
    // a small tail pointing down to him.
    k.add([k.fixed(), k.layer("ui"), k.z(1), {
      draw() {
        if (bubbleA <= 0) return;
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
      if (line < brief.length - 1) { line += 1; bubbleA = 0; }
      else k.go("world");
    };
    k.onKeyPress(["space", "enter"], advance);
    k.onMousePress(advance); // tap also advances, for touch devices
  });
}
