---
description: This gives the agent a measurable target instead of vague “optimise for hardware” language.
---

# Hardware Budget: Retro Arcade for Education

Target:

- Playable on Retro Arcade for Education hardware

- Responsive controls

- Avoid simulator-only assumptions

Budgets:

- Target frame rate: close to 30 fps

- Active sprites: aim below 25, avoid above 40

- Per-frame allocations: none in normal gameplay loops

- Pathfinding: bounded and interval-based

- Effects: lifespan-limited and sparse

- HUD: cached buffers, no per-frame image creation

- Tile scans: avoid during active gameplay

- Asset size: keep images and tilemaps compact

High-risk patterns:

- Creating sprites in `onUpdate`

- Creating images in renderables

- Rebuilding arrays every frame

- Many particles/effects

- Full-map scans during movement

- Complex pathfinding every frame

- Large full-screen images

- Extension-heavy solutions

Hardware review required when changing:

- rendering

- movement

- AI

- pathfinding

- tilemaps

- inventory

- particles/effects

- asset files
