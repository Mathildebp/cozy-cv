// Thin wrapper around PostHog so the rest of the game can call track() without
// caring whether analytics is configured. If no key is set (local dev, or a
// fork without a PostHog project) every call is a silent no-op and the game runs
// exactly as before — analytics is never allowed to break play.
//
// The key is a PostHog *public* project key: it is meant to ship in client code.
// Config comes from Vite env vars (see .env.example):
//   VITE_POSTHOG_KEY   - project API key (required to enable analytics)
//   VITE_POSTHOG_HOST  - ingestion host (defaults to EU cloud)

import posthog from "posthog-js";

let enabled = false;
const startedAt = Date.now();

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST || "https://eu.i.posthog.com";

  if (!key) {
    console.info("[analytics] disabled — set VITE_POSTHOG_KEY to enable");
    return;
  }

  posthog.init(key, {
    api_host: host,
    persistence: "localStorage", // no first-party cookies needed for a static game
    autocapture: false,          // a <canvas> game has no meaningful DOM to autocapture
    capture_pageview: true,
  });
  enabled = true;
}

export function track(event, props = {}) {
  if (!enabled) return;
  posthog.capture(event, props);
}

// Seconds since the page loaded — attached to milestone events so funnels carry
// a rough sense of pacing without a separate timing system.
export function elapsedSeconds() {
  return Math.round((Date.now() - startedAt) / 1000);
}
