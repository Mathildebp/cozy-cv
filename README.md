# 🏝️ My World Quest — a playable CV

A small top-down exploration game, inspired by Pokémon and Animal Crossing, that works as an interactive CV. Instead of reading a resume, you walk around five islands, meet the islanders and learn who I am through short interactions.

Built with [Claude Code](https://claude.com/claude-code) as a prototyping exercise.

---

## 🎮 How it plays

```txt
Explore → meet an islander → short interaction → earn a Memory Brick → collect all six → final assembly
```

No combat, no timer, no game over. Each interaction takes under 90 seconds.

| Island | Islander | Interaction | Brick |
|---|---|---|---|
| Ganymede Zone (hub) | Ganymede | Welcome and orientation | Kindness |
| Imaginary Archipelago | Tome Raider | Find and open the books scattered around the grove | Imagination |
| Adventure Camp | Lore Looter | Open chests to dig up the video games that shaped me | Curiosity |
| Human Trace Garden | Empathus | Find four lost objects and bring them back | Carefulness |
| Mystery & Melody | Debug Gerard | Solve a small logic lock | Understanding |
| Mystery & Melody | Melodyssee | Soundtrack blind test | Emotion |

Once all six bricks are collected, they come together in a final scene, followed by a short guestbook.

**Controls:** arrows / WASD to move, Space or E to talk. On mobile, drag the left side of the screen to move and tap the button to talk.

---

## 🛠️ Tech

- **[KAPLAY](https://kaplayjs.com)** (formerly Kaboom.js): a lightweight web game library, so the game runs in the browser with nothing to install.
- **Vite** for the dev server and build.
- **PostHog** (optional) for anonymous play analytics.
- **[Sprout Lands](https://cupnooble.itch.io/sprout-lands-asset-pack)** pixel-art asset pack by Cup Nooble.

The full design intent lives in [`doc/game_design_brief.md`](doc/game_design_brief.md).

---

## 🚀 Getting Started

Requires Node 22.

```sh
npm install
npm run dev      # dev server on http://localhost:3001
npm run build    # production build in dist/
```

Analytics (PostHog) are optional: copy `.env.example` to `.env` and fill in the keys. Without them the game runs the same.
