# GAME DESIGN BRIEF — “MY WORLD QUEST”
## Lead Game Design Document (for AI Engineer Agent)

---

# 1. HIGH-LEVEL CONCEPT

## Genre
Narrative exploration game (2D top-down, Pokémon / Animal Crossing inspired)

## Core Idea
The player explores a small interconnected world of islands, meets NPCs, and completes micro-interactions that reveal personal stories.

Each NPC interaction grants a **“Memory Brick”** representing a personal trait.

At the end, all bricks combine into a final symbolic entity (Alan mascot).

---

# 2. CORE GAME LOOP

```txt
Explore world → meet NPC → simple interaction → earn brick → return to map → complete all NPCs → final assembly scene
```

No failure states. No combat. No timers.

---

# 3. WORLD STRUCTURE (MAP DESIGN)

## Overview

The world is composed of **4 small islands + 1 central hub island**.

Connected via:
- wooden bridges
- small walking paths
- soft transitions (no loading screens if possible)

Camera: fixed top-down / slight tilt (Pokémon-like)

---

## ISLAND 1 — “HUB ISLAND (Kindor Zone)”

### Mood
Warm, welcoming, social entry point

### Role
Tutorial + social navigation hub

### Environment Direction
- central plaza
- soft grass terrain
- small signage system
- NPC visibility from distance

### NPC Located
- KINDOR (main hub NPC)

### Function
- introduces player to “help system”
- connects all other islands via bridges

---

## ISLAND 2 — “IMAGINARY ARCHIPELAGO”

### Mood
Mystical, calm, slow-paced fantasy

### Environment Direction
- floating vegetation elements
- soft lighting
- slightly surreal nature (trees, glowing elements)

### NPC Located
- TOME RAIDER

### Function
- literature-based exploration interaction

---

## ISLAND 3 — “ADVENTURE CAMP ISLAND”

### Mood
Energetic, exploratory, slightly messy

### Environment Direction
- campfire center
- travel objects (maps, crates)
- more dynamic layout than other islands

### NPC Located
- XP Rience

### Function
- game memory exploration

---

## ISLAND 4 — “HUMAN TRACE GARDEN”

### Mood
Quiet, emotional, reflective

### Environment Direction
- garden paths
- scattered objects
- soft ambient animations (wind, leaves)

### NPCs Located
- LYSANDRA
- DODUS

### Function
- observation + object retrieval gameplay

---

## ISLAND 5 — “CREATION & SYSTEM ISLAND”

### Mood
Structured, semi-mysterious, puzzle-oriented

### Environment Direction
- small enclosed rooms / structures
- organized objects
- slight “escape room” aesthetic but soft

### NPCs Located
- DEBUG GÉRARD
- MÉLODYSSÉE (adjacent amphitheater zone)

### Function
- logic puzzle + blind test interaction

---

# 4. NPC SYSTEM DESIGN

Each NPC has:
- a small interaction zone
- a micro-game (max 30–90 seconds)
- a reward brick
- unique tone + behavior rules

---

# 5. NPC SPECIFICATIONS

---

## 5.1 KINDOR (Hub NPC)

### Location
Central plaza on Hub Island

### Role
Helper / connector NPC

### Interaction Type
Simple assistance quests (3-step tasks)

### Gameplay
- deliver object to NPC
- activate environment element
- talk to another NPC

### Behavior
- always available
- visually scans environment
- reacts warmly to player

### Brick Reward
🧱 Kindness Brick

---

## 5.2 TOME RAIDER

### Location
Floating library grove (Island 2)

### House
None (nature-based entity)

### Gameplay
Click-based book exploration

Books:
- Throne of Glass
- Nevernight
- La Passe-Miroir
- Lord of the Rings
- Silo (secret)

### Behavior
- slow movement
- contemplative stance
- minimal animation

### Brick Reward
🧱 Imagination Brick

---

## 5.3 XP Rience

### Location
Adventure camp (Island 3)

### House
Small tent + campfire base

### Gameplay
Open 6 memory chests (games)

Includes:
- Age of Empires
- Dofus
- Anno
- League of Legends
- Assassin’s Creed
- Animal Crossing (COVID memory emphasis)

### Behavior
- constantly moving
- energetic pointing gestures

### Brick Reward
🧱 Curiosity Brick

---

## 5.4 LYSANDRA

### Location
Garden zone (Island 4)

### House
None (wandering observer in garden)

### Gameplay
Object observation (click & read)

Objects:
- cup
- letter
- scarf
- notebook

### Behavior
- slow walking loops
- pauses frequently
- looks at objects more than player

### Brick Reward
🧱 Attention Brick

---

## 5.5 DODUS

### Location
Small cluttered clearing (Island 4)

### House
Small messy hut (optional visual only)

### Gameplay
Retrieve lost items and return them

Items:
- cup
- notebook
- scarf
- letter

### Behavior
- forgetful loops
- confused idle animations
- reacts with surprise on item return

### Brick Reward
🧱 Carefulness Brick

---

## 5.6 DEBUG GÉRARD

### Location
System Room (Island 5)

### House
Puzzle workshop / small enclosed building

### Gameplay
Simple logic puzzle:
- book → 7
- clock → 3
- rule → order logic
- result → 37 unlocks chest

### Behavior
- observes silently
- minimal movement
- reacts only when puzzle progresses

### Brick Reward
🧱 Understanding Brick

---

## 5.7 MÉLODYSSÉE

### Location
Open amphitheater (Island 5)

### House
No house (performance space)

### Gameplay
Blind test (3-choice multiple choice)

Songs:
- Time (Inception)
- Songcord (Avatar)
- Forrest Gump theme
- Hobbit theme

### Behavior
- eyes closed while listening
- emotional reactions tied to music

### Brick Reward
🧱 Emotion Brick

---

# 6. BRICK SYSTEM

Each NPC gives exactly 1 brick.

Bricks are stored in inventory.

Visual representation:
- floating icons
- soft glow
- collectible UI

---

# 7. FINAL SCENE — ASSEMBLY

## Trigger
When all NPCs completed

---

## Location
Abstract neutral space (not tied to map)

---

## Mechanic
- all bricks float into center
- auto-alignment animation
- transformation sequence

---

## Result
A final “Alan Mascot” entity is created

Symbolizing:
- curiosity
- empathy
- logic
- creativity
- exploration
- emotion

---

## Final Message
Short reflective narrative:

> “Everything here came from small interactions.”
> “Together, they form something larger.”

---

# 8. TECHNICAL SIMPLICITY RULES

- no combat
- no failure states
- no complex inventory systems
- no crafting systems
- no branching narrative trees
- interactions must be linear and deterministic

---

# 9. UX PRINCIPLES

- every interaction ≤ 90 seconds
- no cognitive overload
- immediate feedback
- strong visual clarity
- NPC personality conveyed through behavior, not exposition

---

# 10. ART DIRECTION GUIDELINE

- Pokémon / Animal Crossing inspired top-down world
- soft colors, warm palette
- low-poly or pixel-art acceptable
- subtle animation loops (wind, water, idle NPC motion)
- readable silhouettes first

---

# 11. SUCCESS CRITERIA

The experience is successful if:
- a player can understand each NPC in < 10 seconds
- each interaction feels distinct
- the final assembly feels meaningful
- the world feels cohesive but small

---

END OF DOCUMENT
