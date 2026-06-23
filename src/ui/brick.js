// Shared "Memory Brick" icon, drawn procedurally so it reads as an actual brick
// (two running-bond courses set in light mortar) rather than reusing the heart/
// gem icons from the UI kit. Tinted with each trait's colour. Drawn centred at
// (cx, cy) with total width `w`; height follows a brick-ish 0.66 ratio.

export function drawBrick(k, cx, cy, w, color, opacity = 1) {
  const h = w * 0.66;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const [cr, cg, cb] = color;
  const base = k.rgb(cr, cg, cb);
  const hi = k.rgb(Math.min(255, cr + 45), Math.min(255, cg + 45), Math.min(255, cb + 45));
  const shade = k.rgb(Math.max(0, cr - 55), Math.max(0, cg - 55), Math.max(0, cb - 55));
  const mortar = k.rgb(232, 220, 198);

  const m = Math.max(1, w * 0.07); // mortar joint thickness
  const rowH = (h - m) / 2;
  const cap = Math.max(1, rowH * 0.28); // highlight / shadow band

  // Mortar backdrop; the gaps between cells below let it show through as joints.
  k.drawRect({ pos: k.vec2(x, y), width: w, height: h, radius: w * 0.08, color: mortar, opacity });

  const cell = (bx, by, bw) => {
    k.drawRect({ pos: k.vec2(bx, by), width: bw, height: rowH, color: base, opacity });
    k.drawRect({ pos: k.vec2(bx, by), width: bw, height: cap, color: hi, opacity: opacity * 0.6 });
    k.drawRect({ pos: k.vec2(bx, by + rowH - cap), width: bw, height: cap, color: shade, opacity: opacity * 0.6 });
  };

  // Top course: two equal bricks with a centre joint.
  const topW = (w - m * 3) / 2;
  cell(x + m, y, topW);
  cell(x + m * 2 + topW, y, topW);

  // Bottom course: offset half-brick / full-brick / half-brick (running bond).
  const span = w - m * 4;
  const fullW = span * 0.5;
  const sideW = span * 0.25;
  const botY = y + rowH + m;
  let bx = x + m;
  cell(bx, botY, sideW); bx += sideW + m;
  cell(bx, botY, fullW); bx += fullW + m;
  cell(bx, botY, sideW);
}
