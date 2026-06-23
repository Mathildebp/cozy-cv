// Brick inventory HUD: a fixed row of seven slots in the top-left. Earned bricks
// show their coloured icon with a soft glow; unearned ones are dim placeholders.
// Reads live from state, so it reflects a brick the moment it is earned.

import { BRICKS, hasBrick, state } from "../state.js";
import { drawBrick } from "./brick.js";
import { toggleMute, setMuted, isMuted } from "../audio/sound.js";

const SLOT = 22;
const GAP = 4;
const ORIGIN = 14;

export function addHud(k) {
  const root = k.add([k.fixed(), k.layer("ui"), k.z(90)]);

  // Backing strip + per-slot glow, drawn so it tracks any canvas size.
  root.onDraw(() => {
    const n = BRICKS.length;
    const w = n * SLOT + (n - 1) * GAP + 12;
    k.drawRect({ pos: k.vec2(ORIGIN - 6, ORIGIN - 6), width: w, height: SLOT + 12, radius: 8, color: k.rgb(40, 30, 22), opacity: 0.35 });
    BRICKS.forEach((b, i) => {
      const cx = ORIGIN + i * (SLOT + GAP) + SLOT / 2;
      const cy = ORIGIN + SLOT / 2;
      if (hasBrick(b.npc)) {
        k.drawCircle({ pos: k.vec2(cx, cy), radius: SLOT * 0.7, color: k.rgb(...b.color), opacity: 0.3 });
        drawBrick(k, cx, cy, SLOT, b.color);
      } else {
        drawBrick(k, cx, cy, SLOT, b.color, 0.22);
      }
    });
  });

  // Completion counter to the right of the slots.
  const n = BRICKS.length;
  const counterX = ORIGIN + n * (SLOT + GAP) + 8;
  k.add([
    k.text("", { font: "sprout", size: 16 }),
    k.pos(counterX, ORIGIN + 3),
    k.color(255, 255, 255),
    k.fixed(),
    k.layer("ui"),
    k.z(91),
    {
      update() {
        this.text = `${state.collected.size}/${n}`;
      },
    },
  ]);

  addSoundToggle(k);

  return root;
}

// A small speaker button pinned to the top-right corner. Click it (or press M)
// to mute / unmute the whole mix; it draws sound waves when on and a red slash
// when muted.
const BTN = 26;
const BTN_MARGIN = 14;

function addSoundToggle(k) {
  const btn = k.add([
    k.rect(BTN, BTN, { radius: 6 }),
    k.color(40, 30, 22),
    k.opacity(0.35),
    k.anchor("topright"),
    k.pos(0, 0),
    k.area(),
    k.fixed(),
    k.layer("ui"),
    k.z(91),
    { update() { this.pos = k.vec2(k.width() - BTN_MARGIN, BTN_MARGIN); } },
  ]);

  btn.onDraw(() => {
    // Local space: anchor is top-right, so the box spans x in [-BTN, 0].
    const cx = -BTN * 0.5;
    const cy = BTN * 0.5;
    const on = !isMuted();
    const ink = k.rgb(255, 255, 255);
    // Speaker body: a small square + triangular cone.
    k.drawRect({ pos: k.vec2(cx - 5, cy - 3), width: 4, height: 6, color: ink });
    k.drawPolygon({
      pts: [k.vec2(cx - 1, cy - 6), k.vec2(cx - 1, cy + 6), k.vec2(cx + 4, cy + 4), k.vec2(cx + 4, cy - 4)],
      color: ink,
    });
    if (on) {
      // Two sound-wave arcs.
      k.drawLines({ pts: [k.vec2(cx + 6, cy - 4), k.vec2(cx + 7, cy), k.vec2(cx + 6, cy + 4)], width: 1.5, color: ink });
      k.drawLines({ pts: [k.vec2(cx + 9, cy - 6), k.vec2(cx + 10, cy), k.vec2(cx + 9, cy + 6)], width: 1.5, color: ink });
    } else {
      // Red slash through it when muted.
      k.drawLine({ p1: k.vec2(cx + 5, cy - 5), p2: k.vec2(cx + 11, cy + 5), width: 2, color: k.rgb(220, 90, 70) });
    }
  });

  btn.onHover(() => (btn.opacity = 0.55));
  btn.onHoverEnd(() => (btn.opacity = 0.35));
  btn.onClick(() => toggleMute());
  k.onKeyPress("m", () => setMuted(!isMuted()));
}
