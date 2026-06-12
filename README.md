# Minekraft

**Minekraft** is a 2D top-down survival, building, and exploration game built natively for [MakeCode Arcade](https://arcade.makecode.com/). Navigate procedurally generated tilemaps, harvest resources, build defensive structures, evade zombies, and seek out the Diamond tile to progress through infinite levels.

The project is highly optimized for MakeCode's Static TypeScript (STS) and hardware constraints, ensuring a smooth, memory-safe experience on physical devices like the EF08247.

## 🌟 Key Features

* **Procedural Map Generation:** Each level dynamically generates a 48x48 tilemap featuring grass, dirt, stone, iron ore, wood, tall grass, bedrock, and a guaranteed walkable path to the exit.
* **Smart Harvesting & Building:** 
    * **Always-On Cursor:** A permanent, floating targeting box indicates the exact tile you are interacting with.
    * **Instant Action:** Pressing `A` instantly swings the player's axe to harvest resources or build.
    * **Resource Transformation:** Collecting a raw resource transforms it into a specialized building material (e.g., Dirt ➔ Bricks, Stone ➔ Stone Blocks, Iron Ore ➔ Spikes, Wood ➔ Timber, Tall Grass ➔ Hay).
    * **Smart Surround Building:** If the target tile is blocked, the game automatically scans the 8 surrounding tiles and places your block on the nearest valid grass spot.
* **Dynamic Obstacles:** Progressively challenging constraints appear in later levels:
    * **Rivers:** Cross randomly generated water paths.
    * **Zombie Survival:** Survive an intense, timer-based horde attack before the diamond spawns.
    * **Toll Roads:** Pay a dynamically requested amount of harvested materials to proceed.
    * **Key Crawl:** Enter a procedurally generated sub-level dungeon, fight zombies with Zelda-like melee combat, and locate the key to unlock the diamond.
* **Persistent Save & Load System:** Utilizes the native MakeCode `settings` API to serialize the entire 2,304-tile map buffer, player stats, and precise zombie coordinates into device flash memory. Features a 5-slot FIFO queue and custom scrollable UI.
* **Automated Demo Mode:** A highly fluid AI state-machine that plays the game for you. It features 8-way diagonal steering, obstacle avoidance, dynamic harvesting/building, and natural "human-like" pauses.
* **Classic 16-Bit RPG Aesthetics:**
    * **Chibi Player:** A custom red-hooded protagonist with 4-directional walking and specific mining/attack frames.
    * **Undead Foes:** Purple-robed zombies that match the visual style.
    * **Custom UI:** 8x8 minimalist inventory icons aligned with the native MakeCode health hearts, classic golden UI navigation arrows, and a seamless scrolling inventory viewport.
* **Procedural Audio Engine:** Generates unique, theme-based background music and classic RPG sound effects without locking the hardware thread.

## 🎮 Controls

| Button | Action |
| :--- | :--- |
| **D-Pad** | Move the player and aim the targeting cursor. |
| **A** | **Harvest/Build:** Instantly interact with the tile you are facing.<br>**Menu:** Select options / Confirm. |
| **B** | **Inventory:** Open the scrollable inventory menu to select building materials.<br>**Menu:** Cancel / Go back. |

## 🛠️ How to Play

1.  **Start:** Select your starting health and level count in the `SETTINGS` menu, or turn on `DEMO` mode to watch the AI.
2.  **Explore:** Move around the map to find the hidden **Diamond** tile, which takes you to the next level.
3.  **Survive:** Watch out for zombies! If they get too close, they will charge and attack. 
4.  **Harvest & Build:** Face trees, rocks, iron ore, or dirt and press `A` to collect resources. Open your inventory (`B`), select a crafted material (Bricks, Stone Blocks, Timber, Hay, Spikes), and press `A` to build walls or deadly spikes to defend yourself against zombies.
5.  **Save Your Progress:** Open the inventory (`B`), scroll to the bottom, and select `Save Game`. Enter a 3-letter save name to store your exact map and game state. 

## 🏗️ Architecture

The codebase utilizes a modular, multi-file structure to improve maintainability while remaining fully compatible with MakeCode's Static TypeScript (STS):

* **`constants.ts`**: Global game state, tile indices, parallel arrays for sprite tracking, and shared configuration variables.
* **`world.ts`**: Procedural tilemap generation, 16-bit custom tile rendering, and the low-level tile data buffer logic.
* **`player.ts`**: Core animation system, player inputs, resource harvesting, smart building mechanics, and water bridge tracking.
* **`enemies.ts`**: Zombie spawning, skeleton Dijkstra pathfinding, collision, and damage logic.
* **`dungeon.ts`**: Procedural generation and logic for isolated sub-level dungeons, including single-path key/diamond logic.
* **`game_lifecycle.ts`**: High-level level progression, dynamic obstacle selection (River, Survive, Toll, Dungeon, None), and mode-specific conditions.
* **`save.ts`**: Handles memory serialization of the tilemap and game state to device flash memory, plus in-memory suspending/restoring for dungeon transitions.
* **`demo.ts`**: The autonomous Demo Mode AI and obstacle avoidance mechanics.
* **`ui.ts`**: Heads-up display, scrolling inventory, toll dialogs, and level lifecycle menus.
* **`audio.ts`**: Procedural theme-based music generation (overworld and dark dungeon variants) and retro sound effects.
* **`main.ts`**: The central entry point and primary `game.onUpdate` loops.
* **`assets/images.ts`**: Pre-compiled sprite artwork and animations for characters.

## 💻 Technical Details

This game is designed to bypass standard MakeCode extensions that often cause memory leaks or compiler errors on hardware. 
* **Core-API Compliant:** Relies purely on built-in STS methods. It avoids dynamic properties like `sprite.data` by using parallel arrays (`zombieRefs`, `zombieModes`), making it 100% stable.
* **State Management:** When entering a Dungeon, the overworld map and state are serialized into an `overworldBuffer` string to free up RAM, allowing the creation of an isolated sub-world. Exiting deserializes the overworld seamlessly.
* **Hardware Acceleration:** Utilizes integer math (`Math.floor`) instead of floating-point division.
* **Memory Management:** Strictly manages sprite lifespans, explicit destruction, and array garbage collection to prevent out-of-memory crashes on physical microcontrollers. Tilemap updates use optimized 5-bit packing for save files.

## 🚀 Installation

1.  Open [MakeCode Arcade](https://arcade.makecode.com/).
2.  Click **Import** on the home screen.
3.  Select **Import URL...** and paste the URL to this GitHub repository.
4.  The game will compile and run automatically in the simulator!

## 📜 Credits
* **Developer:** George Kraev
* **Game Design:** Luca Kraev
* **Platform:** Microsoft MakeCode Arcade
