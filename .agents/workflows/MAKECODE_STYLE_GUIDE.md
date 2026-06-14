---
description: MakeCode Arcade Style Guide
---

Use:

- simple functions

- numeric constants or enums for modes

- integer tile coordinates

- core APIs first

- small patches

- clear lifecycle helpers for sprites

Avoid:

- unsupported TypeScript features

- dynamic object fields

- extension dependency unless necessary

- per-frame allocation

- full rewrites

- duplicated event handlers

- hidden coupling between demo mode and manual controls

Naming:

- `updateX()` for per-frame or interval updates

- `spawnX()` for sprite creation

- `destroyX()` for lifecycle-safe cleanup

- `isXBlocked()` for collision checks

- `toTileX()` / `toTileY()` for coordinate conversion

Comments:

- Explain hardware constraints.

- Explain Static TypeScript workarounds.

- Explain non-obvious gameplay invariants.

- Do not comment obvious assignments.
