with open('player.ts', 'r') as f:
    content = f.read()

# First, extract the old performTargetAction
start_idx = content.find("function performTargetAction() {")
if start_idx == -1:
    print("Could not find performTargetAction()")
    exit(1)

# Find the end of performTargetAction. We know it ends before `function isDemoActive` or `controller.A.onEvent`
# Let's search for the next function definition after it, which is `function movePlayer` or similar
end_idx = content.find("controller.up.onEvent", start_idx)
if end_idx == -1:
    end_idx = content.find("function", start_idx + 10)

# Replace the performTargetAction block with the new short/long split
new_actions = """function performShortAction() {
    if (player == null) return

    let frontCol = playerCol() + facingDx
    let frontRow = playerRow() + facingDy
    let frontId = getTileId(frontCol, frontRow)

    let hitEnemy = false
    if (inDungeon) {
        for (let i = zombieRefs.length - 1; i >= 0; i--) {
            let z = zombieRefs[i]
            let zc = Math.floor(z.x / TILE)
            let zr = Math.floor(z.y / TILE)
            if (Math.abs(zc - frontCol) <= 1 && Math.abs(zr - frontRow) <= 1) {
                forgetZombie(z)
                z.destroy(effects.disintegrate, 150)
                hitEnemy = true
            }
        }
        if (hitEnemy) {
            playPlayerAttack(facingDx, facingDy)
            music.playTone(262, 50)
            return
        }
    }

    if (frontId == KEY_HOLE) {
        if (hasDungeonKey) {
            setTile(frontCol, frontRow, GRASS)
            for (let dwx = goalCol - 2; dwx <= goalCol + 2; dwx++) {
                for (let dwy = 42; dwy <= 46; dwy++) {
                    if (getTileId(dwx, dwy) == DUNGEON_WALL) {
                        setTile(dwx, dwy, GRASS)
                    }
                }
            }
            music.playTone(523, 500)
            showBanner("DUNGEON UNLOCKED")
        } else {
            music.playTone(131, 40)
            showBanner("NEEDS KEY")
        }
        return
    }

    if (isHarvestable(frontId)) {
        if (frontId == DIRT) invDirt += 1
        else if (frontId == STONE) invStone += 1
        else if (frontId == IRON_ORE) invIron += 1
        else if (frontId == WOOD) invWood += 1
        else if (frontId == TALL_GRASS) invGrass += 1
        else if (frontId == BONE) invBones += 1
        else if (frontId == BRICKS || frontId == STONE_BLOCK || frontId == TIMBER || frontId == HAY || frontId == SPIKES) {
            breakEffect(frontCol, frontRow, frontId)
        }

        let restoreTile = inDungeon ? DUNGEON_FLOOR : GRASS
        if (wasWaterBridge(frontCol, frontRow)) {
            restoreTile = WATER
            forgetWaterBridge(frontCol, frontRow)
        }
        setTile(frontCol, frontRow, restoreTile)
        playPlayerAttack(facingDx, facingDy)
        music.playTone(262, 50)
        harvestCount++
        return
    }

    if (matCount() > 0 && selectedMat != MAT_SAVE) {
        if (frontId == GRASS || frontId == WATER || frontId == DUNGEON_FLOOR) {
            if (frontId == WATER && selectedMat != MAT_WOOD) {
                music.playTone(131, 40)
                showBanner("NEEDS WOOD")
                return
            }
            buildBlock(frontCol, frontRow, facingDx, facingDy)
            return
        }

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx == 0 && dy == 0) continue
                let c = playerCol() + dx
                let r = playerRow() + dy

                let cid = getTileId(c, r)
                if (cid == GRASS || cid == WATER || cid == DUNGEON_FLOOR) {
                    if (cid == WATER && selectedMat != MAT_WOOD) {
                        continue
                    }
                    buildBlock(c, r, dx, dy)
                    return
                }
            }
        }
        music.playTone(131, 40)
    }
}

function performLongAction() {
    if (player == null) return

    let frontCol = playerCol() + facingDx
    let frontRow = playerRow() + facingDy
    let frontId = getTileId(frontCol, frontRow)

    if (matCount() > 0 && selectedMat != MAT_SAVE) {
        if ((selectedMat == MAT_BONE && frontId == HAY) || (selectedMat == MAT_GRASS && frontId == SPIKES)) {
            if (inDungeon) {
                music.playTone(131, 40)
                showBanner("NOT IN DUNGEON")
                return
            }
            if (selectedMat == MAT_BONE) invBones += -1
            else invGrass += -1

            setTile(frontCol, frontRow, SCARECROW)
            playPlayerAttack(facingDx, facingDy)
            music.playTone(392, 100)
            let fx = new sprites.BaseSprite(frontCol * TILE + 8, frontRow * TILE + 8, null)
            fx.startEffect(effects.starField, 500)
            return
        }

        if ((selectedMat == MAT_WOOD && frontId == HAY) || (selectedMat == MAT_GRASS && frontId == TIMBER) || frontId == CAMPFIRE) {
            if (inDungeon) {
                music.playTone(131, 40)
                showBanner("NOT IN DUNGEON")
                return
            }
            if (frontId != CAMPFIRE) {
                if (selectedMat == MAT_WOOD) invWood += -1
                else invGrass += -1
                setTile(frontCol, frontRow, CAMPFIRE)
            } else {
                if (selectedMat == MAT_WOOD) invWood += -1
                else if (selectedMat == MAT_GRASS) invGrass += -1
                else return
            }

            playPlayerAttack(facingDx, facingDy)
            music.playTone(175, 100)
            
            let fx = new sprites.BaseSprite(frontCol * TILE + 8, frontRow * TILE + 8, null)
            fx.startEffect(effects.fire, 1500)
            
            health = Math.min(100, health + 20)
            freezeLevel = Math.max(0, freezeLevel - 40)
            return
        }
    }
}
"""

# Find the exact chunk to replace by regex or slicing
import re
# The performTargetAction is a long function. We can replace from "function performTargetAction" up to the next "controller.up.onEvent"
pattern = r"function performTargetAction\(\) \{.*?controller\.up\.onEvent"
match = re.search(pattern, content, re.DOTALL)
if match:
    content = content[:match.start()] + new_actions + "\ncontroller.up.onEvent" + content[match.end():]
else:
    print("Could not match performTargetAction block")
    exit(1)

# Now update the button bindings for short/long press
# controller.A.onEvent(ControllerButtonEvent.Pressed ...
controller_A_pressed_pattern = r"controller\.A\.onEvent\(ControllerButtonEvent\.Pressed, function \(\) \{.*?\n\}\)"

new_controller_A_pressed = """
let aPressStart = 0
let aLongPressTriggered = false
let aRepeatCount = 0

controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == VICTORY || gameState == GAMEOVER) {
        returnToTitleFromVictory()
        return
    }

    if (gameState == TITLE) {
        if (titleChoice == 0) startGame()
        else { gameState = OPTIONS; menuScrollY = 0 }
        return
    }

    if (gameState == OPTIONS) {
        if (optionChoice == 0 || optionChoice == 1) {
            isEditingOption = !isEditingOption
        } else if (optionChoice == 2) {
            // demoMode toggle was here, removed
        } else if (optionChoice == 3) {
            gameState = DIFFICULTY
            difficultyChoice = 0
            menuScrollY = 0
        }
        return
    }

    if (gameState == DIFFICULTY) {
        if (difficultyChoice == 0) selectedLevels = 10
        else if (difficultyChoice == 1) selectedLevels = 20
        else if (difficultyChoice == 2) selectedLevels = 50
        else selectedLevels = INFINITY
        gameState = OPTIONS
        menuScrollY = 0
        return
    }

    if (gameState == LOADING) {
        if (loadChoices.length > 0) {
            let svName = loadChoices[loadChoicePos]
            if (!loadGame(svName)) {
                gameState = OPTIONS
            }
        }
        return
    }

    if (gameState != PLAYING) return

    if (inventoryOpen) {
        if (inventoryCursor == MAT_SAVE) {
            gameState = SAVING
            saveNameIndices = [0, 0, 0]
            saveNamePos = 0
            return
        }
        selectedMat = inventoryCursor
        inventoryOpen = false
        resumeEnemies()
        resumePlayer()
        return
    }

    aLongPressTriggered = false
    aRepeatCount = 0
    controller.setRepeatDefault(500, 500)
})

controller.A.onEvent(ControllerButtonEvent.Repeated, function () {
    if (gameState != PLAYING || inventoryOpen) return
    aRepeatCount++
    if (aRepeatCount >= 1 && !aLongPressTriggered) {
        aLongPressTriggered = true
        performLongAction()
    }
})

controller.A.onEvent(ControllerButtonEvent.Released, function () {
    if (gameState != PLAYING || inventoryOpen) return
    if (!aLongPressTriggered) {
        performShortAction()
    }
    aLongPressTriggered = false
    aRepeatCount = 0
})
"""

# Replace the existing controller.A.onEvent
content = re.sub(controller_A_pressed_pattern, new_controller_A_pressed, content, flags=re.DOTALL)

with open('player.ts', 'w') as f:
    f.write(content)

