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
          playerVars: { playsinline: 1, controls: 0, disablekb: 1 },
          events: { onReady: () => resolve() },
        });
      }),
  );
  return ready;
}

// Kick off the (one-time) API download ahead of the first clue so the first clip
// starts promptly. Safe to call repeatedly.
export function preloadClips() {
  ensurePlayer();
}

export async function playClip(videoId, startSec = 0) {
  await ensurePlayer();
  player.loadVideoById({ videoId, startSeconds: startSec });
  player.playVideo();
}

export function stopClip() {
  if (player && player.stopVideo) player.stopVideo();
}
