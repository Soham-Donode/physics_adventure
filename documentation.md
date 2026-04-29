# PhysicsQuest Documentation

PhysicsQuest is a modular, 2D physics-based educational platformer built to teach core physics and mathematics concepts through interactive puzzles. Players navigate through various "missions," each focused on a specific scientific principle.

## 🚀 Overview

The game is designed with a retro pixel-art aesthetic and focuses on "learning by doing." Each level presents a challenge that requires understanding a physics concept—such as projectile motion or relative velocity—to solve.

### Key Features
- **Educational Puzzles**: Levels based on real-world physics and computer science algorithms.
- **Modular Design**: Each level is self-contained with its own logic and UI while sharing core assets.
- **Retro Aesthetics**: Uses pixel-art assets and a custom CSS-based UI for a "premium retro" feel.
- **Dynamic Audio**: Powered by the ZZFX sound engine for lightweight, procedural sound effects.

---

## 🛠 Tech Stack

- **Engine**: Vanilla JavaScript with HTML5 Canvas API.
- **Styling**: Modern CSS3 (Glow effects, Pixel-art borders, Animations).
- **Fonts**: Google Fonts (Press Start 2P).
- **Audio**: ZZFX ( procedural sound generator).
- **Physics**: Custom integration of kinematic equations and simple collision detection.

---

## 📂 Project Structure

```text
physics_adventure/
├── assets/             # Shared sprites, backgrounds, and UI elements
├── js/                 # Global shared scripts
│   ├── audio.js        # ZZFX integration and global sound definitions
│   ├── graphics.js     # Shared rendering utilities (backgrounds, tiles)
│   ├── menu.js         # Navigation and level selection logic
│   └── Player.js       # Player class definition and animation logic
├── levels/             # Level-specific code
│   ├── level1/         # Projectile Motion
│   ├── level2/         # Bresenham's Algorithm
│   ├── level3/         # Matrix Transformations
│   ├── level4/         # Relative Velocity
│   └── level5/         # Raycasting & Reflection
│       ├── index.html  # Level entry point & UI
│       ├── game.js     # Main game loop for the level
│       └── movement.js # Physics and input handling for the level
└── index.html          # Main Menu / Level Select
```

---

## 🎮 Levels & Mechanics

### Level 1: Cannonball Siege
- **Concept**: Projectile Motion ($y = y_0 + v_{y0}t + \frac{1}{2}gt^2$).
- **Goal**: Adjust the angle and power of a cannon to hit targets at a measured distance.
- **Mechanics**: Gravity simulation, distance measurement markers, and explosion particles.

### Level 2: Bresenham Bridge
- **Concept**: Bresenham's Line Algorithm.
- **Goal**: Plot the correct "pixels" (blocks) to build a bridge between two platforms.
- **Mechanics**: Coordinate-based building, custom pathing for the player to walk along the generated bridge.

### Level 3: Matrix Bridge
- **Concept**: Linear Algebra / Matrix Transformations.
- **Goal**: Apply scale, rotation, and translation matrices to bridge gaps.
- **Mechanics**: Interactive matrix input that transforms game objects in real-time.

### Level 4: Arrow Shielding
- **Concept**: Relative Velocity.
- **Goal**: Move at the correct speed to match the horizontal velocity of falling arrows, minimizing impact.
- **Mechanics**: Velocity vectors, area-of-effect shielding.

### Level 5: Light Reflector
- **Concept**: Raycasting and Law of Reflection ($\theta_i = \theta_r$).
- **Goal**: Rotate mirrors to bounce a laser beam into a sensor.
- **Mechanics**: Real-time raycasting, recursive reflection calculation.

---

## ⌨️ Controls

- **Movement**: `Arrow Keys` or `WASD`
- **Jump**: `Space` or `W`
- **Action/Interact**: `E`
- **Shoot (L1)**: `Enter`
- **Sprint**: `Shift`

---

## 🔊 Audio System

The game uses `audio.js` which initializes a ZZFX-based engine. Shared sounds include:
- `shoot()`: Cannon firing.
- `explode()`: Enemy destruction.
- `jump()`: Player jumping.
- `win()`: Level completion fanfare.
- `click()`: UI interaction.

---

## 🎨 Asset Management

Assets are loaded via `graphics.js` and `game.js`. Key assets include:
- `villian.png`: Enemy sprite.
- `cannon.png`: Cannon object.
- `idle.png` / `run.png`: Player animation spritesheets.
- `sky.png` / `mountains.png`: Parallax background elements.

---

## 🚀 Running the Project

1. Clone the repository.
2. Open `index.html` in any modern web browser.
3. No build step or server is strictly required, though a local server (like `Live Server` in VS Code) is recommended for asset loading consistency.
