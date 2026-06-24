// On-screen touch controls for phones/tablets, drawn in screen space (fixed) so
// they ride above the world. Two pieces:
//   - a floating joystick on the left: touch anywhere on the left half to drop a
//     base, drag to steer. Its vector feeds `touchControls.moveDir`, which the
//     world scene adds to the keyboard movement axis.
//   - an action button bottom-right that fires the same interact() as Space/E.
//     It only appears (and only responds to taps) when something is actually in
//     reach, via the `canInteract` predicate the world scene passes in.
//
// Nothing renders or registers on non-touch devices, so desktop is untouched.
// Both are hidden while a dialogue is open (taps advance the dialogue instead).

import { dialogue } from "./dialogue.js";

// Shared with the world scene's movement read. Reset each time controls mount so
// a replay never inherits a stale push.
export const touchControls = { moveDir: { x: 0, y: 0 } };

const PARCHMENT = [232, 211, 162];
const BORDER = [122, 90, 58];
const INK = [74, 53, 38];

const JOY_RADIUS = 56; // how far the knob can travel from the base
const KNOB_RADIUS = 26;
const DEADZONE = 0.22; // ignore tiny pushes so resting a thumb doesn't drift
const BTN_RADIUS = 40;
const BTN_MARGIN = 30;

export function addTouchControls(k, onInteract, canInteract = () => true) {
  touchControls.moveDir.x = 0;
  touchControls.moveDir.y = 0;
  if (!k.isTouchscreen()) return; // desktop: keyboard + mouse only

  const btnCenter = () => k.vec2(k.width() - BTN_MARGIN - BTN_RADIUS, k.height() - BTN_MARGIN - BTN_RADIUS);
  const idleJoyBase = () => k.vec2(BTN_MARGIN + JOY_RADIUS, k.height() - BTN_MARGIN - JOY_RADIUS);

  let joyId = null; // identifier of the touch driving the joystick
  let base = idleJoyBase(); // where the base sits while active
  let knob = base.clone(); // current knob position

  const releaseJoystick = () => {
    joyId = null;
    touchControls.moveDir.x = 0;
    touchControls.moveDir.y = 0;
  };

  k.onTouchStart((pos, t) => {
    if (dialogue.active) return; // let the tap fall through to dialogue advance
    // Action button wins if the touch lands on it — but only when it's actually
    // showing (something in reach). Otherwise the tap is free to drive movement.
    if (canInteract() && pos.dist(btnCenter()) <= BTN_RADIUS + 8) { onInteract(); return; }
    // Otherwise a touch on the left half grabs (or re-grabs) the joystick.
    if (joyId === null && pos.x < k.width() * 0.5) {
      joyId = t.identifier;
      base = pos.clone();
      knob = pos.clone();
      updateVec();
    }
  });

  k.onTouchMove((pos, t) => {
    if (t.identifier !== joyId) return;
    const off = pos.sub(base);
    knob = off.len() > JOY_RADIUS ? base.add(off.unit().scale(JOY_RADIUS)) : pos.clone();
    updateVec();
  });

  const onEnd = (pos, t) => { if (t.identifier === joyId) releaseJoystick(); };
  k.onTouchEnd(onEnd);

  function updateVec() {
    const v = knob.sub(base).scale(1 / JOY_RADIUS); // [-1,1] each axis
    const mag = Math.min(1, v.len());
    if (mag < DEADZONE) { touchControls.moveDir.x = 0; touchControls.moveDir.y = 0; return; }
    const u = v.unit();
    touchControls.moveDir.x = u.x * mag;
    touchControls.moveDir.y = u.y * mag;
  }

  // Draw the joystick (faint when idle, lit when steering) and the action button.
  const ui = k.add([k.fixed(), k.layer("ui"), k.z(95)]);
  ui.onDraw(() => {
    if (dialogue.active) return;
    const active = joyId !== null;
    const b = active ? base : idleJoyBase();
    const kn = active ? knob : b;
    k.drawCircle({ pos: b, radius: JOY_RADIUS, color: k.rgb(40, 30, 22), opacity: active ? 0.32 : 0.18 });
    k.drawCircle({ pos: kn, radius: KNOB_RADIUS, color: k.rgb(...PARCHMENT), opacity: active ? 0.9 : 0.5, outline: { color: k.rgb(...BORDER), width: 3 } });

    // The action button only shows when there's something in reach to act on.
    if (canInteract()) {
      const c = btnCenter();
      k.drawCircle({ pos: c, radius: BTN_RADIUS, color: k.rgb(...PARCHMENT), opacity: 0.9, outline: { color: k.rgb(...BORDER), width: 4 } });
      drawSpeechBubble(k, c);
    }
  });
}

// A small "talk" icon for the action button: a rounded speech bubble with a
// little tail and three dots, reading as "interact / chat" at a glance.
function drawSpeechBubble(k, c) {
  const ink = k.rgb(...INK);
  k.drawRect({ pos: c.add(k.vec2(-19, -16)), width: 38, height: 27, radius: 9, color: ink });
  k.drawPolygon({ pts: [c.add(k.vec2(-7, 9)), c.add(k.vec2(-13, 20)), c.add(k.vec2(3, 10))], color: ink });
  for (const dx of [-9, 0, 9]) {
    k.drawCircle({ pos: c.add(k.vec2(dx, -3)), radius: 2.6, color: k.rgb(...PARCHMENT) });
  }
}
