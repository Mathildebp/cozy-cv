// Procedural audio, synthesised live with the Web Audio API so we ship no
// copyrighted sound files. Two jobs:
//
//   1. A calm, endless ambient bed (Animal-Crossing-ish): a slow chord pad under
//      a sparse, gentle pentatonic melody, looping forever with light variation.
//   2. NPC "speech" blips (animalese): a short boop per revealed character while
//      dialogue types out, pitched per-speaker so each islander has a voice.
//
// Browsers won't let audio start without a user gesture, so the title screen
// calls unlockAudio()/startMusic() from the PLAY click/keypress.

let ctx = null;
let master = null; // overall volume
let musicGain = null; // ambient bed, ducked under dialogue / muted under YT clips
let voiceGain = null; // dialogue blips
let sfxGain = null; // world sound effects (footsteps, pickups, chest/book, chime)
let musicStarted = false;
let musicTimer = null;

const MUSIC_LEVEL = 0.85; // ambient level relative to master, when undisturbed
let ducked = false; // dialogue open -> lower the bed a touch
let mutedForClip = false; // Melodyssee's YouTube clip is audible -> bed out of the way

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();

  master = ctx.createGain();
  master.gain.value = muted ? 0 : MASTER_LEVEL;
  master.connect(ctx.destination);

  musicGain = ctx.createGain();
  musicGain.gain.value = 0; // faded in by startMusic()
  musicGain.connect(master);

  voiceGain = ctx.createGain();
  voiceGain.gain.value = 0.8;
  voiceGain.connect(master);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = 1.9; // sit clearly above the ambient bed
  sfxGain.connect(master);

  return ctx;
}

// Resume the (gesture-gated) audio context. Safe to call repeatedly.
export function unlockAudio() {
  ensureCtx();
  if (ctx.state === "suspended") ctx.resume();
}

// ----------------------------------------------------------------------------
// Master mute (HUD toggle)
// ----------------------------------------------------------------------------

const MASTER_LEVEL = 0.9;
let muted = false;

export function isMuted() {
  return muted;
}

// Flip mute on the whole mix (music + voices) and return the new state.
export function toggleMute() {
  setMuted(!muted);
  return muted;
}

export function setMuted(on) {
  muted = on;
  ensureCtx();
  unlockAudio(); // a click is a valid gesture; make sure audio can run
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.linearRampToValueAtTime(muted ? 0 : MASTER_LEVEL, ctx.currentTime + 0.2);
}

// ----------------------------------------------------------------------------
// Ambient music
// ----------------------------------------------------------------------------

// Warm I–vi–IV–V-ish progression of seventh chords, voiced low and close so the
// pad sits politely under everything. Frequencies in Hz.
const PROG = [
  [130.81, 164.81, 196.0, 246.94], // Cmaj7  : C3 E3 G3 B3
  [110.0, 130.81, 164.81, 196.0], // Am7    : A2 C3 E3 G3
  [87.31, 130.81, 174.61, 220.0], // Fmaj7  : F2 C3 F3 A3
  [98.0, 146.83, 196.0, 246.94], // G6/maj : G2 D3 G3 B3
];

// C-major pentatonic across two octaves for the sparse melody (C D E G A).
const MELODY = [
  261.63, 293.66, 329.63, 392.0, 440.0,
  523.25, 587.33, 659.25, 783.99, 880.0,
];

const BAR = 3.9; // seconds per chord

let barIndex = 0;

// A soft sustained pad chord with a long attack/release so changes glide.
function playPad(freqs, when, dur) {
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 850; // tame the higher partials -> warm, mellow
  filter.connect(musicGain);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, when);
  env.gain.linearRampToValueAtTime(0.16, when + 1.3); // slow swell in
  env.gain.setValueAtTime(0.16, when + dur - 1.3);
  env.gain.linearRampToValueAtTime(0, when + dur); // slow fade out
  env.connect(filter);

  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = f;
    osc.detune.value = i % 2 === 0 ? -5 : 5; // gentle chorus-y shimmer
    osc.connect(env);
    osc.start(when);
    osc.stop(when + dur + 0.1);
  });
}

// A single bell-ish melody note: sine fundamental + a quiet octave harmonic,
// quick attack and a soft decay.
function playNote(freq, when) {
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, when);
  env.gain.exponentialRampToValueAtTime(0.13, when + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, when + 0.95);
  env.connect(musicGain);

  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(env);
  osc.start(when);
  osc.stop(when + 1.0);

  const harm = ctx.createOscillator();
  harm.type = "sine";
  harm.frequency.value = freq * 2.01;
  const harmEnv = ctx.createGain();
  harmEnv.gain.setValueAtTime(0.0001, when);
  harmEnv.gain.exponentialRampToValueAtTime(0.045, when + 0.02);
  harmEnv.gain.exponentialRampToValueAtTime(0.0001, when + 0.55);
  harmEnv.connect(musicGain);
  harm.connect(harmEnv);
  harm.start(when);
  harm.stop(when + 0.6);
}

// Schedule one bar, then queue the next. Self-perpetuating loop.
function scheduleBar() {
  const when = ctx.currentTime + 0.06;
  playPad(PROG[barIndex % PROG.length], when, BAR);

  // 0–2 melody notes per bar, dropped at random offsets, so it never feels
  // mechanical and leaves plenty of restful space.
  const notes = Math.random() < 0.65 ? (Math.random() < 0.4 ? 2 : 1) : 0;
  for (let n = 0; n < notes; n++) {
    const f = MELODY[Math.floor(Math.random() * MELODY.length)];
    playNote(f, when + Math.random() * (BAR - 1.1));
  }

  barIndex += 1;
  musicTimer = setTimeout(scheduleBar, BAR * 1000);
}

export function startMusic() {
  ensureCtx();
  unlockAudio();
  if (musicStarted) return;
  musicStarted = true;
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.setValueAtTime(0, ctx.currentTime);
  musicGain.gain.linearRampToValueAtTime(MUSIC_LEVEL, ctx.currentTime + 3); // ease in
  scheduleBar();
}

// Recompute the bed level from the two things that can lower it.
function applyMusicLevel() {
  if (!ctx || !musicGain || !musicStarted) return;
  let level = MUSIC_LEVEL;
  if (ducked) level *= 0.5; // a chat is happening
  if (mutedForClip) level = 0; // a real soundtrack clip is playing
  musicGain.gain.cancelScheduledValues(ctx.currentTime);
  musicGain.gain.linearRampToValueAtTime(level, ctx.currentTime + 0.4);
}

// Lower the bed while dialogue is open so the blips read clearly.
export function duckMusic(on) {
  ducked = on;
  applyMusicLevel();
}

// Fully step the bed aside while Melodyssee streams a YouTube clip.
export function muteMusicForClip(on) {
  mutedForClip = on;
  applyMusicLevel();
}

// ----------------------------------------------------------------------------
// NPC speech blips ("animalese")
// ----------------------------------------------------------------------------

// Map a speaker name to a stable base "vocal-cord" pitch so each islander sounds
// distinct. Kept fairly high for that bright, chipper Animal-Crossing register.
function voiceBase(speaker) {
  let h = 0;
  for (let i = 0; i < speaker.length; i++) h = (h * 31 + speaker.charCodeAt(i)) >>> 0;
  return 250 + (h % 14) * 22; // ~250–536 Hz, in steps
}

// Vowel formant pairs (F1, F2) in Hz: the two resonances that make a buzzy
// source read as a spoken vowel. Mapping each character onto one of these is
// what turns the chatter into "speech" rather than plain beeping.
const VOWELS = {
  a: [800, 1150],
  e: [500, 1900],
  i: [320, 2500],
  o: [500, 900],
  u: [330, 740],
};
const VOWEL_KEYS = ["a", "e", "i", "o", "u"];

// The vowel colour for a character: real vowels keep theirs; consonants borrow
// one deterministically so the same word always babbles the same way.
function vowelFor(ch) {
  const c = ch.toLowerCase();
  if (VOWELS[c]) return VOWELS[c];
  const code = c.charCodeAt(0);
  return VOWELS[VOWEL_KEYS[(Number.isNaN(code) ? 0 : code) % 5]];
}

// One spoken "syllable" of animalese. A buzzy sawtooth (the vocal-cord source)
// at the speaker's pitch is shaped by two formant band-passes into a vowel, with
// a short pitch fall and a quick on/off envelope so it reads as a little word.
export function speakBlip(speaker = "", ch = "a") {
  ensureCtx(); // self-initialise: talking (Space/E) is itself a valid gesture
  if (ctx.state === "suspended") ctx.resume();
  if (muted) return;

  const now = ctx.currentTime;
  const base = voiceBase(speaker);
  // A little per-letter pitch movement so the line "sings" instead of droning.
  const code = ch.toLowerCase().charCodeAt(0);
  const step = Number.isNaN(code) ? 0 : (code % 5) - 2; // -2..+2 semitones
  const f0 = base * Math.pow(2, step / 12) * (0.98 + Math.random() * 0.05);

  // Glottal-buzz source: a sawtooth is rich in harmonics for the formants to
  // carve, like vocal-cord buzz passing through a vocal tract. The small fall
  // gives each syllable a natural, talky inflection.
  const src = ctx.createOscillator();
  src.type = "sawtooth";
  src.frequency.setValueAtTime(f0 * 1.05, now);
  src.frequency.exponentialRampToValueAtTime(f0 * 0.92, now + 0.1);

  // Amplitude envelope: snappy attack, soft release -> a clipped syllable.
  // Peaks high because the formant band-passes shed a lot of the buzz's energy.
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(0.9, now + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  env.connect(voiceGain);

  // Two parallel band-passes resonate at the vowel's formants, colouring the
  // buzz into an "ah/ee/oh"-like sound. F1 carries more weight than F2.
  const [f1, f2] = vowelFor(ch);
  for (const [freq, q, gain] of [[f1, 7, 2.0], [f2, 11, 0.9]]) {
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(bp);
    bp.connect(g);
    g.connect(env);
  }

  src.start(now);
  src.stop(now + 0.14);
}

// ----------------------------------------------------------------------------
// World sound effects (footsteps, pickups, chest/book, brick chime)
// ----------------------------------------------------------------------------
//
// All synthesised on the fly through sfxGain so they respect the master mute and
// never need an audio file. Each entry point self-initialises the context, since
// the player triggers them with the same gestures (walking / pressing E) that are
// valid to unlock audio.

// True only when sound can actually be produced right now. Centralises the
// gesture/mute guard every SFX shares.
function sfxReady() {
  ensureCtx();
  if (ctx.state === "suspended") ctx.resume();
  return !muted;
}

// A short burst of white noise (used for soft, un-pitched textures like a foot on
// grass or a page turning).
function noiseBuffer(dur) {
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * dur)), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

// One short pitched blip with a snappy attack and soft decay, optionally gliding
// in pitch. The building block for the melodic cues below.
function blip({ freq, type = "sine", at, dur, peak = 0.18, glideTo }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(peak, at + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(env);
  env.connect(sfxGain);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

// A soft footfall on grass, Animal-Crossing style: a warm little "tup" rather
// than a dry noise tap. A short, low pitched body (a sine that drops quickly)
// gives the rounded thump, and a whisper of heavily low-passed noise adds the
// soft "earthy" texture on top. Pitch and timing wobble per step so a walk
// cycle never sounds mechanical. Kept quiet on purpose - it sits under the bed.
export function playStep() {
  if (!sfxReady()) return;
  const now = ctx.currentTime;
  const dur = 0.11;

  // Rounded body: a low sine thump with a quick downward glide -> a soft "tup".
  const f0 = 175 + Math.random() * 50; // gentle per-step pitch wobble
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(f0, now);
  osc.frequency.exponentialRampToValueAtTime(f0 * 0.55, now + dur);
  const oscEnv = ctx.createGain();
  oscEnv.gain.setValueAtTime(0.0001, now);
  oscEnv.gain.exponentialRampToValueAtTime(0.16, now + 0.008);
  oscEnv.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(oscEnv);
  oscEnv.connect(sfxGain);
  osc.start(now);
  osc.stop(now + dur + 0.02);

  // Soft earthy texture: a brief puff of very-low-passed noise under the thump.
  const noiseDur = 0.05;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(noiseDur);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 500 + Math.random() * 200;
  const nEnv = ctx.createGain();
  nEnv.gain.setValueAtTime(0.0001, now);
  nEnv.gain.exponentialRampToValueAtTime(0.06, now + 0.004);
  nEnv.gain.exponentialRampToValueAtTime(0.0001, now + noiseDur);
  src.connect(lp);
  lp.connect(nEnv);
  nEnv.connect(sfxGain);
  src.start(now);
  src.stop(now + noiseDur);
}

// Picking something up: a bright two-note rise, like a cheerful "got it".
export function playPickup() {
  if (!sfxReady()) return;
  const t = ctx.currentTime;
  blip({ freq: 659.25, type: "sine", at: t, dur: 0.10, peak: 0.30 });
  blip({ freq: 987.77, type: "sine", at: t + 0.07, dur: 0.12, peak: 0.30 });
}

// Opening a chest: a wooden thunk as the lid lifts, then a small sparkle reveal.
export function playChest() {
  if (!sfxReady()) return;
  const t = ctx.currentTime;
  blip({ freq: 200, type: "triangle", at: t, dur: 0.16, peak: 0.34, glideTo: 120 });
  blip({ freq: 783.99, type: "sine", at: t + 0.10, dur: 0.20, peak: 0.22 });
  blip({ freq: 1174.66, type: "sine", at: t + 0.18, dur: 0.20, peak: 0.18 });
}

// Opening a book: a short, soft page-turn - band-passed noise swept upward.
export function playBook() {
  if (!sfxReady()) return;
  const t = ctx.currentTime;
  const dur = 0.18;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(dur);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(900, t);
  bp.frequency.exponentialRampToValueAtTime(2600, t + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.20, t + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp);
  bp.connect(env);
  env.connect(sfxGain);
  src.start(t);
  src.stop(t + dur);
}

// Earning a Memory Brick: a warm rising major arpeggio (C–E–G–C) with a quiet
// octave shimmer, to underscore the celebration flourish.
export function playBrickEarned() {
  if (!sfxReady()) return;
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    const at = t + i * 0.11;
    blip({ freq: f, type: "triangle", at, dur: 0.5, peak: 0.26 });
    blip({ freq: f * 2, type: "sine", at, dur: 0.4, peak: 0.09 });
  });
}
