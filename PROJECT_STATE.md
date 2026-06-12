# Minekraft - LLM Agent Project State

> **Notice to AI Agents:** Read this document immediately upon entering the workspace. It contains critical context, strict environmental constraints, and the current state of the project to enable seamless "vibe coding" handoffs between multiple agents in succession.

## 1. Project Vision
**Minekraft** is a 2D top-down survival, building, and exploration game built natively for Microsoft MakeCode Arcade. The game uses a classic 16-bit RPG aesthetic (high detail pixel art, highlighting/shadowing, Zelda-like dungeons) and relies purely on MakeCode's Static TypeScript (STS).

## 2. Strict Architectural Constraints (CRITICAL)
MakeCode Arcade runs on severely constrained hardware (like the EF08247 microcontroller). You **must** adhere to the following rules:
1. **No External Extensions:** Avoid using `arcade-animation`, `arcade-minimap`, etc. We have built custom arrays and `tickCoreAnimations()` loops to prevent hardware memory leaks.
2. **No Dynamic Properties (`sprite.data`):** The STS compiler will reject dynamic JS properties. **You must use parallel arrays** (e.g., `zombieRefs: Sprite[]` and `zombieModes: number[]`) to track state, and use `.indexOf()` or `.allOfKind()` for lookups.
3. **Strict Memory Management:** If you create visual effect sprites (like block-breaking), you **must** assign them a `lifespan` immediately. If you destroy a tracked sprite (like a zombie), you **must** manually `splice()` it from its parallel tracking arrays *before* calling `.destroy()`.
4. **Integer Math Only:** Avoid floating-point division for grid operations. Always wrap coordinate manipulation in `Math.floor()`.
5. **Tile Asset Design:** All tiles are drawn procedurally in `world.ts`. They must adhere to a strict RPG aesthetic (highlights on top/left, shadows on bottom/right), avoiding generic randomized scatter algorithms.

## 3. Codebase Structure
* **`constants.ts`:** Global variables, inventory, tile ID mappings, and parallel arrays for sprite tracking (zombies, skeletons, water bridges).
* **`world.ts`:** Procedural tilemap generation and the low-level rendering logic for the 16-color RPG tiles.
* **`player.ts`:** Player movement, animation, resource harvesting, smart building (with water bridge tracking to restore water instead of grass).
* **`enemies.ts`:** Zombie AI, skeleton Dijkstra pathfinding, combat logic.
* **`dungeon.ts`:** Procedural generation of Zelda-style sub-worlds (single-path dungeon, lock/key progression).
* **`game_lifecycle.ts`:** Level generation flow and obstacle management (`River`, `Survive`, `Toll`, `Dungeon`, `None`).
* **`save.ts`:** Flash memory serialization/deserialization. Contains `suspendOverworld` and `restoreOverworld` for seamless dungeon transitions.
* **`audio.ts`:** Procedural tone-based music generation (overworld theme, tension-building dark dungeon theme).
* **`ui.ts`:** Custom scrolling UI, inventory, Toll dialogs, and heads-up display logic.
* **`main.ts`:** Global lifecycle, entry point, and the master `game.onUpdate` loop.
* **`demo.ts`:** Autonomous AI state-machine that plays the game.

## 4. Current Project State & Recent Implementations
* **Automated Unit Testing:** Created a custom assert-based unit testing suite in `test.ts` to safely verify STS math and data logic.
* **Optimized Systems:** Flattened multi-dimensional arrays in `dungeon.ts` for memory performance, fixed Zelda combat `splice()` array iteration bugs, and updated HUD/Tile palettes for contrast.
* **RPG Visual Overhaul:** All primary tiles (Dirt, Stone, Bedrock, Wood, Leaves, Spikes, Iron Ore, Dungeon Floor, etc.) have been completely overhauled to feature high-detail 16-bit RPG styling.
* **Dungeon Sub-Levels:** The "Key Crawl" feature successfully suspends the main overworld into memory, loads an isolated procedural dungeon with skeletons, requires finding a key to unlock the exit, and smoothly restores the overworld upon exiting.
* **Procedural Dungeon Audio:** Dungeons now feature a unique, tension-building D-Phrygian dark ambient track.
* **Water Bridge Fix:** Placing blocks over `WATER` is now tracked via `waterBridgeCols`/`waterBridgeRows` in `constants.ts`. Destroying those blocks restores `WATER` instead of defaulting to `GRASS`.
* **Wood Resource Integration:** `MAT_WOOD` is now strictly required to build bridges over `WATER` obstacles, heavily increasing its value. The game validates this in `performTargetAction`.
* **Demo AI Intelligence Upgrade:** The autonomous bot now dynamically targets resources (Iron, Bone, Wood) when depleted, tracks dead ends in dungeons via LRU arrays, and strictly seeks `WOOD` when trapped by a river.
* **The Freezing Night (Campfires):** Added `OBSTACLE_FREEZE`. A temperature meter rapidly depletes, damaging the player if it reaches zero. Players must spend Wood & Hay to build a `CAMPFIRE` which restores temperature.
* **Hay Fuel Mechanic:** `MAT_GRASS` (Hay) has been repurposed as campfire fuel. Players can "build" Hay over an existing Campfire to restore its health, creating a synergy between Wood (structure) and Hay (consumable).
* **Scarecrows:** Added `SCARECROW` as a buildable structure (requires `SPIKES` + `HAY`). Scarecrows attract zombies within a radius, serving as an indestructible decoy to protect the player during combat.
* **Healing Station:** Standing on `HAY` tiles for 2 seconds consumes the Hay and restores 1 HP. If the player plays on "Infinite Health", the HUD displays `INFINITY` and health counts are hidden.

## 5. Development Workflow
If you modify code, compile it using:
```bash
pxt build && cp built/binary.js assets/js/binary.js
```
*Note: The local `index.html` simulator loads from `assets/js/binary.js`, so the copy step is mandatory after `pxt build` to see your changes.*

### Automated Testing Protocol
Because MakeCode Arcade couples logic to a hardware simulator, unit testing requires specific care:
1. **Update Unit Tests:** If you modify game state logic, tracking arrays, or math, add a new test case function into `test.ts` using the custom `assert()` method.
2. **Compile and Run Tests:** You **MUST** run `pxt test` and `pxt build` in the terminal after completing any code changes.
3. **Mandatory Pass Criteria:** An agent's task should be considered **complete ONLY after tests compile and run successfully**. If there is a compilation error or logic failure, you must attempt to fix the bug(s) before handing off the task or ending your turn.
4. **Execution:** The `test.ts` file compiles with the game. Full integration verification is done by checking the assertions within the browser simulator or by enabling the `demo.ts` autonomous bot to stress-test memory.

## 6. Handoff Notes for the Next Agent
* Review the `ui.ts` elements if you add new features to ensure they use consistent RPG themes (e.g., color 15 for dark text, color 5 for yellow highlights).
* If expanding the `dungeon.ts` generation logic, ensure that memory cleanup happens in `exitDungeon()` to prevent OOM errors on subsequent runs.
* Remember to run `pxt test` and `pxt build` after making logic adjustments, and keep `test.ts` updated with any newly introduced structural array logic.
* Update this document whenever a major structural change or new core mechanic is added.
