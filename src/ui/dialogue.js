// Dialogue + choice UI, drawn in screen space (fixed) so it ignores the camera.
//
// Two promise-returning entry points cover every NPC interaction in the game:
//   say(k, lines, opts)      -> resolves once the player has read every line
//   choose(k, prompt, opts)  -> resolves to the index of the picked option
//
// While either is open, `dialogue.active` is true; the world scene checks this
// to freeze player movement. The panel is a warm parchment rounded rect (drawn,
// so it scales to any canvas size) with the pixel font on top and a blinking
// "continue" indicator borrowed from the UI kit.

import { speakBlip, duckMusic } from "../audio/sound.js";

export const dialogue = { active: false };

// Rejection value used when the player presses Escape to abort a conversation.
// Callers (runInteraction) catch this to unwind the whole NPC interaction
// instead of treating it as a real error.
export const CANCELLED = Symbol("dialogue-cancelled");

const PARCHMENT = [232, 211, 162];
const PARCHMENT_EDGE = [214, 187, 130];
const BORDER = [122, 90, 58];
const INK = [74, 53, 38];

// Shared tag on every dialogue object (panel, text, choice rows). Opening a new
// dialogue first wipes any still-standing one — both its objects and its input
// handlers — so two panels can never stack into the unreadable, overlapping
// text seen on mobile. kaplay's destroy() is immediate, so this fully clears the
// old UI the same frame the new one appears.
const DLG_TAG = "dialogueUi";
let activeCleanup = null; // cancels the on-screen dialogue's input handlers
function clearDialogueUi(k) {
  if (activeCleanup) { activeCleanup(); activeCleanup = null; }
  k.get(DLG_TAG).forEach((o) => k.destroy(o));
}

const PANEL_H = 116;
const MARGIN = 18;
const PAD = 16;

// Draw the shared parchment panel. Returns its on-screen rect each frame via the
// passed callback so children can position themselves against it. `panelH`
// defaults to PANEL_H but choice menus pass a taller value so every option fits.
function addPanel(k, onLayout, panelH = PANEL_H) {
  const panel = k.add([k.fixed(), k.layer("ui"), k.z(100), DLG_TAG]);
  panel.onDraw(() => {
    const w = k.width();
    const h = k.height();
    const x = MARGIN;
    const y = h - panelH - MARGIN;
    const pw = w - MARGIN * 2;
    // Soft drop shadow, parchment fill, then a double border for a cozy frame.
    k.drawRect({ pos: k.vec2(x + 3, y + 4), width: pw, height: panelH, radius: 10, color: k.rgb(0, 0, 0), opacity: 0.18 });
    k.drawRect({ pos: k.vec2(x, y), width: pw, height: panelH, radius: 10, color: k.rgb(...PARCHMENT_EDGE) });
    k.drawRect({ pos: k.vec2(x + 4, y + 4), width: pw - 8, height: panelH - 8, radius: 8, color: k.rgb(...PARCHMENT), outline: { color: k.rgb(...BORDER), width: 2 } });
    // Faint reminder, pinned bottom-left (the blinking continue cue owns the
    // bottom-right), that Escape leaves the conversation.
    k.drawText({ text: k.isTouchscreen() ? "Tap away: leave" : "Esc: leave", font: "sprout", size: 11, pos: k.vec2(x + 12, y + panelH - 12), anchor: "botleft", color: k.rgb(...BORDER), opacity: 0.55 });
    onLayout?.({ x, y, w: pw, h: panelH });
  });
  return panel;
}

// True when a tap/click lands outside the dialogue panel. Touch only: it lets
// players dismiss a dialogue (the Escape they have no key for) by tapping the
// world above the panel. Desktop keeps "click anywhere advances" untouched.
function tappedOutside(k, layout) {
  if (!k.isTouchscreen()) return false;
  const m = k.mousePos();
  return m.x < layout.x || m.x > layout.x + layout.w || m.y < layout.y || m.y > layout.y + layout.h;
}

// Collect input handlers so we can detach them when the dialogue closes. A tap
// outside the panel cancels (mobile leave); anywhere else advances.
function makeInput(k, onAdvance, onCancel, getLayout) {
  const onPress = () => (tappedOutside(k, getLayout()) ? onCancel() : onAdvance());
  const handles = [
    k.onKeyPress(["space", "enter"], onAdvance),
    k.onMousePress(onPress),
    k.onKeyPress("escape", onCancel),
  ];
  return () => handles.forEach((h) => h.cancel());
}

export function say(k, lines, opts = {}) {
  const list = Array.isArray(lines) ? lines : [lines];
  const speaker = opts.speaker ?? "";
  const tint = opts.color ?? BORDER;

  return new Promise((resolve, reject) => {
    clearDialogueUi(k); // never stack on top of a dialogue that's still up
    dialogue.active = true;
    duckMusic(true); // step the ambient bed back so the speech blips read clearly
    let layout = { x: MARGIN, y: 0, w: 200, h: PANEL_H };
    const panel = addPanel(k, (l) => (layout = l));

    const nameTag = k.add([
      k.text("", { font: "sprout", size: 18 }),
      k.color(...tint),
      k.pos(0, 0),
      k.fixed(),
      k.layer("ui"),
      k.z(101),
      DLG_TAG,
    ]);
    const body = k.add([
      k.text("", { font: "sprout", size: 18, lineSpacing: 6, width: 100 }),
      k.color(...INK),
      k.pos(0, 0),
      k.fixed(),
      k.layer("ui"),
      k.z(101),
      DLG_TAG,
    ]);
    const indicator = k.add([
      k.sprite("dialogNext", { anim: "blink" }),
      k.pos(0, 0),
      k.scale(2),
      k.fixed(),
      k.layer("ui"),
      k.z(101),
      k.opacity(0),
      DLG_TAG,
    ]);

    let i = 0;
    let shown = 0; // characters revealed of the current line
    let done = false; // current line fully revealed
    let blipped = 0; // index up to which we've emitted speech blips
    const CPS = 45; // typewriter speed (chars/sec)

    body.onUpdate(() => {
      const nameH = speaker ? 24 : 0;
      nameTag.pos = k.vec2(layout.x + PAD, layout.y + PAD - 4);
      body.pos = k.vec2(layout.x + PAD, layout.y + PAD + nameH);
      body.width = layout.w - PAD * 2;
      indicator.pos = k.vec2(layout.x + layout.w - 40, layout.y + layout.h - 30);

      if (!done) {
        shown += CPS * k.dt();
        const full = list[i];
        if (shown >= full.length) {
          shown = full.length;
          done = true;
          indicator.opacity = 1;
        }
        const reveal = Math.floor(shown);
        // One blip per newly revealed letter, but only every other character so
        // the chatter stays light; punctuation and spaces are silent beats.
        while (blipped < reveal) {
          const c = full[blipped];
          if (blipped % 2 === 0 && /[a-z0-9]/i.test(c)) speakBlip(speaker, c);
          blipped += 1;
        }
        body.text = full.slice(0, reveal);
      }
    });

    nameTag.text = speaker;

    const startLine = () => {
      shown = 0;
      blipped = 0;
      done = false;
      indicator.opacity = 0;
      body.text = "";
    };
    startLine();

    const teardown = () => {
      cleanup();
      if (activeCleanup === cleanup) activeCleanup = null;
      k.destroy(panel);
      k.destroy(nameTag);
      k.destroy(body);
      k.destroy(indicator);
      duckMusic(false); // restore the ambient bed
      dialogue.active = false;
    };

    const cleanup = makeInput(
      k,
      () => {
        if (!done) {
          // Reveal the rest of the line instantly on the first press, without
          // firing a burst of blips for every skipped character.
          shown = list[i].length;
          blipped = list[i].length;
          return;
        }
        i += 1;
        if (i >= list.length) {
          teardown();
          resolve();
        } else {
          startLine();
        }
      },
      () => {
        teardown();
        reject(CANCELLED);
      },
      () => layout,
    );
    activeCleanup = cleanup; // let the next dialogue tear this one's input down
  });
}

// A prompt line plus a vertical list of selectable options. Returns the chosen
// index. Up/Down (or W/S) move the cursor, Space/Enter/click confirm.
const ROW_H = 22;
const PROMPT_GAP = 14; // space between the prompt and the first option

export function choose(k, prompt, options) {
  return new Promise((resolve, reject) => {
    clearDialogueUi(k); // never stack on top of a dialogue that's still up
    dialogue.active = true;
    // Measure the prompt at its real wrap width so the options always sit BELOW
    // it, even when it spills onto several lines. A fixed gap was fine on wide
    // desktop (the prompt stayed one line) but on a narrow phone the long music
    // clues wrap to 2-3 lines and used to overlap the options.
    const wrapW = Math.max(40, k.width() - MARGIN * 2 - PAD * 2);
    const promptH = k.formatText({ text: prompt, font: "sprout", size: 18, width: wrapW }).height;
    // Grow the panel to fit the (possibly multi-line) prompt plus every option.
    const panelH = Math.max(PANEL_H, PAD + promptH + PROMPT_GAP + options.length * ROW_H + PAD);
    let layout = { x: MARGIN, y: 0, w: 200, h: panelH };
    const panel = addPanel(k, (l) => (layout = l), panelH);

    const promptText = k.add([
      k.text(prompt, { font: "sprout", size: 18, width: 100 }),
      k.color(...INK),
      k.pos(0, 0),
      k.fixed(),
      k.layer("ui"),
      k.z(101),
      DLG_TAG,
    ]);

    let sel = 0;
    const rows = options.map((opt, idx) =>
      k.add([
        k.text("", { font: "sprout", size: 17 }),
        k.color(...INK),
        k.pos(0, 0),
        k.fixed(),
        k.layer("ui"),
        k.z(101),
        DLG_TAG,
        { idx, label: opt },
      ]),
    );

    // Full-width invisible hit targets behind each option so a tap (or click)
    // selects that specific row — vital on touch, where there are no arrow keys.
    const hits = options.map((opt, idx) =>
      k.add([
        k.rect(10, ROW_H, { radius: 6 }),
        k.color(...BORDER),
        k.opacity(0),
        k.pos(0, 0),
        k.area(),
        k.fixed(),
        k.layer("ui"),
        k.z(99),
        DLG_TAG,
        { idx },
      ]),
    );

    const refresh = () => {
      rows.forEach((r) => {
        r.text = (r.idx === sel ? "> " : "  ") + r.label;
        r.color = r.idx === sel ? k.rgb(...BORDER) : k.rgb(...INK);
      });
      hits.forEach((h) => (h.opacity = h.idx === sel ? 0.14 : 0));
    };
    refresh();

    promptText.onUpdate(() => {
      promptText.pos = k.vec2(layout.x + PAD, layout.y + PAD - 4);
      promptText.width = layout.w - PAD * 2;
      const top = layout.y + PAD + promptH + PROMPT_GAP;
      rows.forEach((r, n) => (r.pos = k.vec2(layout.x + PAD + 8, top + n * ROW_H)));
      hits.forEach((h, n) => {
        h.pos = k.vec2(layout.x + PAD, top + n * ROW_H - 3);
        h.width = layout.w - PAD * 2;
      });
    });

    const cancelInput = () => handles.forEach((h) => h.cancel());
    const teardown = () => {
      cancelInput();
      if (activeCleanup === cancelInput) activeCleanup = null;
      k.destroy(panel);
      k.destroy(promptText);
      rows.forEach((r) => k.destroy(r));
      hits.forEach((h) => k.destroy(h));
      dialogue.active = false;
    };
    const finish = (idx) => {
      teardown();
      resolve(idx);
    };

    hits.forEach((h) => {
      h.onHover(() => { sel = h.idx; refresh(); });
      h.onClick(() => finish(h.idx));
    });

    const handles = [
      k.onKeyPress(["down", "s"], () => { sel = (sel + 1) % options.length; refresh(); }),
      k.onKeyPress(["up", "w"], () => { sel = (sel - 1 + options.length) % options.length; refresh(); }),
      k.onKeyPress(["space", "enter"], () => finish(sel)),
      k.onKeyPress("escape", () => { teardown(); reject(CANCELLED); }),
      // Mobile: a tap outside the panel leaves the menu (rows handle inside taps).
      k.onMousePress(() => { if (tappedOutside(k, layout)) { teardown(); reject(CANCELLED); } }),
    ];
    activeCleanup = cancelInput; // let the next dialogue tear this one's input down
  });
}
