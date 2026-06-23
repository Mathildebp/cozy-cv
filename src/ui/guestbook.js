// The guestbook: a small HTML overlay layered over the kaplay canvas so the
// visitor can leave a free-text note. Kaplay draws to a <canvas> and has no text
// input, so a real <textarea> is the simplest way to take typed feedback. Styled
// to match the in-game parchment so it still reads as part of the world.
//
// Resolves with the trimmed note string, or null if the visitor skips/closes.
// Pure DOM, no dependency on kaplay — the caller decides what to do with the note
// (we send it to analytics).

const PARCHMENT = "#e8d3a2";
const INK = "#4a3526";
const BORDER = "#7a5a3a";

export function openGuestbook() {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    Object.assign(backdrop.style, {
      position: "fixed",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(20, 14, 10, 0.55)",
      zIndex: "9999",
      fontFamily: "system-ui, sans-serif",
    });

    const card = document.createElement("div");
    Object.assign(card.style, {
      width: "min(440px, 88vw)",
      background: PARCHMENT,
      border: `3px solid ${BORDER}`,
      borderRadius: "12px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      padding: "22px",
      color: INK,
      boxSizing: "border-box",
    });

    const title = document.createElement("div");
    title.textContent = "Leave a note in the guestbook";
    Object.assign(title.style, { fontSize: "18px", fontWeight: "700", marginBottom: "4px" });

    const sub = document.createElement("div");
    sub.textContent = "What stuck with you? Anything you'd want me to know is welcome.";
    Object.assign(sub.style, { fontSize: "13px", opacity: "0.8", marginBottom: "12px" });

    const textarea = document.createElement("textarea");
    textarea.rows = 4;
    textarea.maxLength = 600;
    textarea.placeholder = "Write something kind, curious, or honest…";
    Object.assign(textarea.style, {
      width: "100%",
      boxSizing: "border-box",
      resize: "vertical",
      padding: "10px",
      fontSize: "14px",
      borderRadius: "8px",
      border: `2px solid ${BORDER}`,
      background: "#f3e6c6",
      color: INK,
      fontFamily: "inherit",
    });
    // Keep keystrokes from leaking to kaplay's global key handlers behind us
    // (otherwise typing w/a/s/d/e/m would move the player, interact, or mute).
    ["keydown", "keyup", "keypress"].forEach((ev) =>
      textarea.addEventListener(ev, (e) => e.stopPropagation()),
    );

    const row = document.createElement("div");
    Object.assign(row.style, { display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "14px" });

    const mkButton = (label, primary) => {
      const b = document.createElement("button");
      b.textContent = label;
      Object.assign(b.style, {
        padding: "9px 16px",
        fontSize: "14px",
        fontWeight: "600",
        borderRadius: "8px",
        cursor: "pointer",
        border: `2px solid ${BORDER}`,
        background: primary ? BORDER : "transparent",
        color: primary ? PARCHMENT : INK,
        fontFamily: "inherit",
      });
      return b;
    };

    const skip = mkButton("Skip", false);
    const send = mkButton("Send", true);

    let settled = false;
    const close = (value) => {
      if (settled) return;
      settled = true;
      document.body.removeChild(backdrop);
      resolve(value);
    };

    skip.addEventListener("click", () => close(null));
    send.addEventListener("click", () => {
      const note = textarea.value.trim();
      close(note.length ? note : null);
    });

    row.append(skip, send);
    card.append(title, sub, textarea, row);
    backdrop.append(card);
    document.body.append(backdrop);
    textarea.focus();
  });
}
