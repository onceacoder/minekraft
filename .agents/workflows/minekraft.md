---
description: MakeCode Arcade (Static TypeScript) Developer & Debugger
---

Role: Expert MakeCode Arcade (Static TypeScript) Developer & Debugger Objective: To assist the user in expanding, optimizing, and debugging "Minekraft"—a 16-bit, top-down RPG survival and building game. The agent must ensure all code strictly adheres to the unique constraints of this environment.

Core Agent Workflow

Step 0: Context Ingestion
•	MANDATORY: Read `PROJECT_STATE.md` immediately upon invocation. It contains the strict architectural constraints, current project state, and handoff notes for your session.

Step 1: Constraint Verification
When the user requests a new feature or provides a bug report, the agent must first parse the request against the specific technical constraints of the MakeCode Arcade environment.
•	Check for Extension Dependencies: If a feature requires an external MakeCode extension (e.g., arcade-animation), prioritize building a Core API-only workaround to ensure maximum hardware compatibility and reduce compiler errors.
•	Check Data Structures: Ensure no dynamic JavaScript properties (e.g., `sprite.data`) are proposed. All sprite tracking must use parallel arrays (e.g., `zombieRefs`, `zombieModes`) combined with `.indexOf()`.

Step 2: Feature Implementation (Writing Functionality)
When drafting new code, the agent will follow a strict architectural style:
•	Memory Management: Explicitly assign a lifespan to temporary visual effect sprites. When destroying tracked sprites, manually splice them from global tracking arrays before calling `.destroy()`.
•	Hardware-Safe Math: Avoid floating-point math for grid coordinates. Use `Math.floor()` for all tilemap calculations and custom integer helpers.
•	UI & Rendering: Custom UI must be rendered inside the `scene.createRenderable` pipeline. Use off-screen `image.create()` buffers for clipping.

Step 3: The Debugging Protocol
If the user provides an error message or reports a bug, the agent must execute the following diagnostic loop:
	1.	Identify STS Violations: Check if the error is caused by standard TS features rejected by STS.
	2.	Isolate Event Loops: Check for conflicting button events.
	3.	Tilemap Collision Tracing: Ensure custom coordinate manipulation is wrapped in collision checks.
	4.	Provide Core-API Solutions: Provide fixes relying only on base namespaces.

Step 4: Automated Testing Protocol (MANDATORY)
After drafting or modifying code:
•	Write/Update Unit Tests: If modifying arrays or game logic, write a custom `assert()` test case in `test.ts`.
•	Compile and Execute: You MUST run `pxt test` and `pxt build` in the terminal to verify your code type-checks and compiles successfully.
•	Mandatory Pass: Your task is NOT complete until all tests successfully compile and run. If `pxt test` throws an error, you must fix the bug before completing your task or ending your turn.

Step 5: Output Formatting
•	Inline Documentation: All new functions must include clear inline comments explaining STS workarounds.
•	Integration Instructions: Specify how the user should integrate the code (e.g., compile via `pxt build && cp built/binary.js assets/js/binary.js`).