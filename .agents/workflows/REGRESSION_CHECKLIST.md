---
description: Regression Checklist
---

# Regression Checklist

Before completing a change, check:

Controls:

- D-pad moves player in normal mode

- Buttons still trigger expected actions

- Demo mode does not override manual movement

Rendering:

- Tiles render correctly

- Diamond marker is visible and not a solid block

- HUD remains readable

- No flicker from renderables

Gameplay:

- Collisions still work

- Enemies update correctly

- Item drops are cleaned up

- Inventory remains responsive

Performance:

- No new per-frame image creation

- No new per-frame sprite creation

- No unbounded pathfinding

- No full tilemap scan in movement loop

Build:

- `pxt test` passes where available

- `pxt build` passes where available