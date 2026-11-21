# 🏡 Village CV: An Interactive Portfolio Adventure

An immersive, cozy, top-down web game inspired by *Animal Crossing*, designed as a playable interactive CV. Instead of reading a static document, players explore a charming village to uncover a professional journey, skills, and personal interests.

---

## 🎯 Project Goal

The objective of this project is to redefine the traditional resume into an engaging, narrative-driven discovery experience. By navigating a small, vibrant world, potential employers and players learn about the creator through meaningful interactions rather than bullet points.

### Core Gameplay Mechanics:
* **Cozy Exploration:** Free-roaming, top-down exploration using a grid-aligned village layout.
* **Narrative Discovery:** Rather than fighting monsters, gameplay centers around talking to custom NPCs (Non-Player Characters).
* **Themed Villagers:** Each NPC represents a distinct chapter of the creator's background:
  * **The Tech Blacksmith:** Explains technical skills and core programming stacks.
  * **The Wise Elder:** Shares professional work experience and past milestones.
  * **The Resident Hobbyist:** Chats about personal passions, side-projects, and interests outside of work.

---

## 🛠️ Tech Stack & Architectural Choices

To bring this narrative portfolio to life efficiently, the development relies on lightweight, web-native technologies:

### 🎮 Game Engine: Kaplay.js (formerly Kaboom.js)
We chose **Kaplay.js** over heavy game suites because of its incredible agility for UI and dialogue handling.
* **Why Kaplay?** Its component-based layout system makes it remarkably simple to handle text-boxes, player proximity detection, and basic interactive triggers without bloated boilerplate.
* **Web-Optimized:** It delivers fast load times directly in any modern web browser, ensuring frictionless access for busy hiring managers.

### 🎨 Visual Assets: Sprout Lands by Cup Nooble
The visual universe is powered entirely by the popular **Sprout Lands Asset Pack** from Itch.io.
* **Why Sprout Lands?** Its cozy, 16x16 pixel-art houses, farming tiles, and cute character designs match the non-violent, welcoming spirit of *Animal Crossing*.
* **Atmospheric Polish:** The vibrant environment instantly establishes a warm, approachable, and creative first impression.

---

## 🚀 Getting Started

Requires Node 22.

```sh
npm install
npm run dev      # dev server on http://localhost:3001
npm run build    # production build in dist/
```

Analytics (PostHog) are optional: copy `.env.example` to `.env` and fill in the keys. Without them the game runs the same.

Pixel-art assets: [Sprout Lands](https://cupnooble.itch.io/sprout-lands-asset-pack) by Cup Nooble.
