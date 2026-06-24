// Thin wrapper over the YouTube IFrame Player API so the music NPC (Melodyssee)
// can play real soundtrack snippets without us hosting any copyrighted audio:
// YouTube streams the clip, we only drive play / seek / stop.
//
// The player lives in an off-screen 1x1 transparent div. It must stay in the DOM
// and rendered for audio to play, so we park it off-screen rather than using
// display:none (which suspends playback in some browsers).

let ready = null; // cached promise: API loaded + player constructed
let player = null;

function loadApi() {
  if (window.YT && window.YT.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

function ensurePlayer() {
  if (ready) return ready;
  ready = loadApi().then(
    () =>
      new Promise((resolve) => {
        const mount = document.createElement("div");
        Object.assign(mount.style, {
          position: "fixed",
          left: "-10px",
          top: "-10px",
          width: "1px",
          height: "1px",
          opacity: "0",
          pointerEvents: "none",
        });
        document.body.appendChild(mount);
        player = new window.YT.Player(mount, {
          width: "1",
          height: "1",
          playerVars: { playsinline: 1, controls: 0, disablekb: 1, origin: location.origin },
          events: {
            onReady: () => {
              // Mobile browsers won't autoplay an iframe's media; explicitly
              // allowing autoplay lets our gesture-primed playback through.
              try { player.getIframe().setAttribute("allow", "autoplay; encrypted-media"); } catch {}
              resolve();
            },
          },
        });
      }),
  );
  return ready;
}

// ---- Mobile audio unlock -----------------------------------------------------
// iOS/Android block media that isn't started from a user gesture, and a parent
// page's gesture isn't delegated to a cross-origin YouTube iframe. So on the
// first real tap/click/key we do a brief MUTED play of a real clip: that counts
// as a gesture-initiated play and unlocks the player, so later programmatic
// playClip() calls in Melodyssee are audible. No-op once primed.

const UNLOCK = { id: "c56t7upa8Bk", start: 1 }; // any real clip; only used to grant playback
let primed = false;

function primeOnGesture() {
  if (primed || !player || !player.loadVideoById) return; // not ready yet -> retry on next gesture
  primed = true;
  try {
    // Unmuted but at volume 0: iOS treats this as "wants to play audio" so it
    // consumes the user gesture and unlocks the player for the session, yet the
    // user hears nothing. Volume is restored for the real clips in playClip().
    player.unMute();
    player.setVolume(0);
    player.loadVideoById({ videoId: UNLOCK.id, startSeconds: UNLOCK.start });
    player.playVideo();
    setTimeout(() => {
      try { player.stopVideo(); } catch {}
    }, 80);
  } catch {
    primed = false; // let a later gesture try again
  }
}

// Arm one-shot listeners that prime the player on the user's first interaction.
// Call early (title screen) so the player is constructed and ready by then.
export function armClipUnlock() {
  ensurePlayer();
  if (primed) return;
  const onGesture = () => {
    primeOnGesture();
    if (primed) {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("touchend", onGesture, true);
      window.removeEventListener("keydown", onGesture, true);
    }
  };
  window.addEventListener("pointerdown", onGesture, true);
  window.addEventListener("touchend", onGesture, true);
  window.addEventListener("keydown", onGesture, true);
}

// Kick off the (one-time) API download ahead of the first clue so the first clip
// starts promptly. Safe to call repeatedly.
export function preloadClips() {
  ensurePlayer();
}

export async function playClip(videoId, startSec = 0) {
  await ensurePlayer();
  player.unMute(); // undo the silent unlock prime so the real clip is audible
  player.setVolume(100);
  player.loadVideoById({ videoId, startSeconds: startSec });
  player.playVideo();
}

export function stopClip() {
  if (player && player.stopVideo) player.stopVideo();
}
