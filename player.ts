// --------------------------------------------------------------------------
// Core-API Safe Animation System
// Bypasses the need for standard extensions to guarantee successful compile.

// --------------------------------------------------------------------------
function flipX(source: Image): Image {
    let out = image.create(16, 16)
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            out.setPixel(15 - x, y, source.getPixel(x, y))
        }
    }
    return out
}

let pDownFlipped = flipX(pDown)
let pDown1Flipped = flipX(pDown1)
let pDown2Flipped = flipX(pDown2)
let pSideFlipped = flipX(pSide)
let pAttackFlipped = flipX(pAttack)

let animSprites: Sprite[] = []
let animFrames: Image[][] = []
let animIntervals: number[] = []
let animTimers: number[] = []
let animIndices: number[] = []
let animLoops: boolean[] = []

function playCoreAnimation(target: Sprite, frames: Image[], interval: number, loop: boolean) {
    if (!target) return
    let found = false
    for (let i = 0; i < animSprites.length; i++) {
        if (animSprites[i] == target) {
            animFrames[i] = frames
            animIntervals[i] = interval
            animTimers[i] = game.runtime() + interval
            animIndices[i] = 0
            animLoops[i] = loop
            found = true
            break
        }
    }
    if (!found) {
        animSprites.push(target)
        animFrames.push(frames)
        animIntervals.push(interval)
        animTimers.push(game.runtime() + interval)
        animIndices.push(0)
        animLoops.push(loop)
    }
    target.setImage(frames[0])
}

function stopCoreAnimation(target: Sprite) {
    if (!target) return
    for (let i = 0; i < animSprites.length; i++) {
        if (animSprites[i] == target) {
            animSprites.splice(i, 1)
            animFrames.splice(i, 1)
            animIntervals.splice(i, 1)
            animTimers.splice(i, 1)
            animIndices.splice(i, 1)
            animLoops.splice(i, 1)
            break
        }
    }
}

/** Ticks all active manual animations bound to the global loop. */
function tickCoreAnimations() {
    for (let i = animSprites.length - 1; i >= 0; i--) {
        let target = animSprites[i]

        // Memory-safe cleanup check
        if (!target) {
            animSprites.splice(i, 1)
            animFrames.splice(i, 1)
            animIntervals.splice(i, 1)
            animTimers.splice(i, 1)
            animIndices.splice(i, 1)
            animLoops.splice(i, 1)
            continue
        }

        if (animFrames[i].length > 1 && game.runtime() > animTimers[i]) {
            animIndices[i]++
            if (animIndices[i] >= animFrames[i].length) {
                if (animLoops[i]) animIndices[i] = 0
                else animIndices[i] = animFrames[i].length - 1
            }
            target.setImage(animFrames[i][animIndices[i]])
            animTimers[i] = game.runtime() + animIntervals[i]
        }
    }
}

function setPlayerAnim(name: string, frames: Image[], interval: number, loop: boolean) {
    if (player == null || playerAnim == name) return
    playerAnim = name
    if (frames.length == 1) {
        stopCoreAnimation(player)
        player.setImage(frames[0])
    } else {
        playCoreAnimation(player, frames, interval, loop)
    }
}

function updatePlayerAnim() {
    if (player == null || gameState != PLAYING || game.runtime() < playerAttackUntil) return

    let moving = player.vx != 0 || player.vy != 0

    if (!moving) {
        if (facingDy < 0) setPlayerAnim("idle-up", [pUp], 120, false)
        else if (facingDx < 0) setPlayerAnim("idle-left", [pDownFlipped], 120, false)
        else if (facingDx > 0) setPlayerAnim("idle-right", [pDown], 120, false)
        else setPlayerAnim("idle-down", [pDown], 120, false)
        return
    }

    if (Math.abs(player.vx) > Math.abs(player.vy)) {
        if (player.vx < 0) setPlayerAnim("walk-left", [pDown1Flipped, pDownFlipped, pDown2Flipped, pDownFlipped], 130, true)
        else setPlayerAnim("walk-right", [pDown1, pDown, pDown2, pDown], 130, true)
    } else {
        if (player.vy < 0) setPlayerAnim("walk-up", [pUp1, pUp, pUp2, pUp], 140, true)
        else setPlayerAnim("walk-down", [pDown1, pDown, pDown2, pDown], 140, true)
    }
}

function playPlayerAttack(dx: number, dy: number) {
    if (player == null) return
    playerAttackUntil = game.runtime() + ATTACK_DURATION_MS
    playerAnim = "attack"

    if (dx < 0) {
        playCoreAnimation(player, [pAttackFlipped, pDownFlipped], 110, false)
    } else if (dx > 0) {
        playCoreAnimation(player, [pAttack, pDown], 110, false)
    } else if (dy < 0) {
        playCoreAnimation(player, [pAttackUp, pUp], 110, false)
    } else {
        playCoreAnimation(player, [pAttackDown, pDown], 110, false)
    }
}


// --------------------------------------------------------------------------
// Math Helpers (Core API Compliance)

// --------------------------------------------------------------------------
function getSign(val: number): number {
    if (val > 0) return 1
    if (val < 0) return -1
    return 0
}


// --------------------------------------------------------------------------
// Player grid position and targeting helpers.

// --------------------------------------------------------------------------
function playerCol(): number {
    if (player == null) return 0
    return Math.floor(player.x / TILE)
}

function playerRow(): number {
    if (player == null) return 0
    return Math.floor(player.y / TILE)
}

function updateFacing() {
    if (inventoryOpen || gameState != PLAYING) return

    if (controller.left.isPressed()) {
        facingDx = -1
        facingDy = 0
    } else if (controller.right.isPressed()) {
        facingDx = 1
        facingDy = 0
    } else if (controller.up.isPressed()) {
        facingDx = 0
        facingDy = -1
    } else if (controller.down.isPressed()) {
        facingDx = 0
        facingDy = 1
    }
}

function autoAlignPlayer() {
    if (player == null || gameState != PLAYING || inventoryOpen) return
    
    // Auto-align gently pushes the player to the center of the column or row they are traveling in,
    // so that they don't get snagged on the corners of solid blocks.
    let px = player.x
    let py = player.y
    let centerColX = Math.floor(px / TILE) * TILE + 8
    let centerRowY = Math.floor(py / TILE) * TILE + 8
    
    let isMovingX = Math.abs(player.vx) > 0
    let isMovingY = Math.abs(player.vy) > 0

    let alignSpeed = 2

    // Only align if moving purely on one axis (not diagonally)
    if (isMovingX && !isMovingY) {
        if (Math.abs(py - centerRowY) > 1) {
            player.y += getSign(centerRowY - py) * alignSpeed
        } else {
            player.y = centerRowY
        }
    } else if (isMovingY && !isMovingX) {
        if (Math.abs(px - centerColX) > 1) {
            player.x += getSign(centerColX - px) * alignSpeed
        } else {
            player.x = centerColX
        }
    }
}

function updateTargetCursor() {
    if (targetCursor == null) return

    if (gameState != PLAYING || inventoryOpen) {
        targetCursor.setFlag(SpriteFlag.Invisible, true)
        return
    }

    targetCursor.setFlag(SpriteFlag.Invisible, false)
    targetCursor.setPosition((playerCol() + facingDx) * TILE + 8, (playerRow() + facingDy) * TILE + 8)
}


// --------------------------------------------------------------------------
// Resource and building logic (Smart Targeting Mechanics)

// --------------------------------------------------------------------------
function isHarvestable(id: number): boolean {
    return id == DIRT || id == BRICKS || id == STONE || id == STONE_BLOCK || 
           id == IRON_ORE || id == SPIKES || id == WOOD || id == TIMBER || 
           id == TALL_GRASS || id == HAY || id == BONE || id == BRIDGE
}

function matCount(): number {
    if (selectedMat == MAT_DIRT) return invDirt
    else if (selectedMat == MAT_STONE) return invStone
    else if (selectedMat == MAT_IRON) return invIron
    else if (selectedMat == MAT_WOOD) return invWood
    else if (selectedMat == MAT_GRASS) return invGrass
    else return invBones
}

function selectedTile(): number {
    if (selectedMat == MAT_DIRT) return BRICKS
    else if (selectedMat == MAT_STONE) return STONE_BLOCK
    else if (selectedMat == MAT_IRON) return SPIKES
    else if (selectedMat == MAT_WOOD) return TIMBER
    else if (selectedMat == MAT_GRASS) return HAY
    else return BONE
}

function breakEffect(col: number, row: number, tileId: number) {
    let fx = sprites.create(tileImages[tileId], SpriteKind.Food)
    fx.setPosition(col * TILE + 8, row * TILE + 8)
    fx.lifespan = 250
    fx.startEffect(effects.disintegrate, 250)
}

function buildBlock(col: number, row: number, dirX: number, dirY: number) {
    // Track if we are building over water so we can restore it on destruction
    if (getTileId(col, row) == WATER) {
        waterBridgeCols.push(col)
        waterBridgeRows.push(row)
    }

    // Determine which inventory to debit based on the currently selected material
    if (selectedMat == MAT_DIRT) {
        invDirt += -1
        setTile(col, row, BRICKS)
    } else if (selectedMat == MAT_STONE) {
        invStone += -1
        setTile(col, row, STONE_BLOCK)
    } else if (selectedMat == MAT_IRON) {
        invIron += -1
        setTile(col, row, SPIKES)
    } else if (selectedMat == MAT_WOOD) {
        invWood += -1
        if (getTileId(col, row) == WATER) {
            setTile(col, row, BRIDGE)
        } else {
            setTile(col, row, TIMBER)
        }
    } else if (selectedMat == MAT_GRASS) {
        invGrass += -1
        setTile(col, row, HAY)
    } else if (selectedMat == MAT_BONE) {
        invBones += -1
        spawnSkeleton(col, row)
    }

    playPlayerAttack(dirX, dirY)
    music.playTone(175, 50)
}

/** 
 * Returns true if (col, row) was previously a water tile before a block was placed on it.
 * This is used to guarantee that breaking a bridge over a river restores the WATER tile 
 * instead of generating generic GRASS, which would allow players to easily bypass obstacles.
 */
function wasWaterBridge(col: number, row: number): boolean {
    for (let i = 0; i < waterBridgeCols.length; i++) {
        if (waterBridgeCols[i] == col && waterBridgeRows[i] == row) return true
    }
    return false
}

/** Remove a position from the water bridge list after the tile is restored. */
function forgetWaterBridge(col: number, row: number) {
    for (let i = 0; i < waterBridgeCols.length; i++) {
        if (waterBridgeCols[i] == col && waterBridgeRows[i] == row) {
            waterBridgeCols.splice(i, 1)
            waterBridgeRows.splice(i, 1)
            return
        }
    }
}

/** 
 * Instant Action Executor (Triggered by 'B' button)
 * ------------------------------------------------
 * This single function orchestrates Harvesting, Zelda-style Combat, and Building.
 * 1. Checks if the tile in front of the player is an enemy (if in dungeon).
 * 2. Checks if the tile is a Keyhole and unlocks it if a Key is held.
 * 3. Checks if the tile is harvestable and extracts the resource.
 * 4. If none of the above, and a resource is selected, it attempts to Build.
 *    If the tile directly in front is blocked, it performs an auto-search 
 *    around the player's 8 adjacent tiles to find the nearest valid build spot.
 */
function performShortAction() {
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
        else if (frontId == BRICKS || frontId == STONE_BLOCK || frontId == TIMBER || frontId == HAY || frontId == SPIKES || frontId == BRIDGE) {
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
        if ((selectedMat == MAT_IRON && frontId == HAY) || (selectedMat == MAT_GRASS && frontId == SPIKES)) {
            if (inDungeon) {
                music.playTone(131, 40)
                showBanner("NOT IN DUNGEON")
                return
            }
            if (selectedMat == MAT_IRON) invIron += -1
            else invGrass += -1

            setTile(frontCol, frontRow, GRASS)
            spawnScarecrow(frontCol, frontRow)
            playPlayerAttack(facingDx, facingDy)
            music.playTone(392, 100)
            let fx = sprites.create(blank16, SpriteKind.Food)
            fx.setPosition(frontCol * TILE + 8, frontRow * TILE + 8)
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
                campfireCols.push(frontCol)
                campfireRows.push(frontRow)
                campfireHealths.push(3000)
            } else {
                if (selectedMat == MAT_WOOD) invWood += -1
                else if (selectedMat == MAT_GRASS) invGrass += -1
                else return
                
                for (let i = 0; i < campfireCols.length; i++) {
                    if (campfireCols[i] == frontCol && campfireRows[i] == frontRow) {
                        let fuelAmt = (selectedMat == MAT_WOOD) ? 4500 : 1500
                        campfireHealths[i] += fuelAmt
                        break
                    }
                }
            }

            playPlayerAttack(facingDx, facingDy)
            music.playTone(175, 100)
            
            let fx = sprites.create(blank16, SpriteKind.Food)
            fx.setPosition(frontCol * TILE + 8, frontRow * TILE + 8)
            fx.z = 20
            fx.lifespan = 500
            fx.startEffect(effects.fire, 500)
            return
        }
    }
}

function navigateMenu(dir: number) {
    if (gameState == TITLE) {
        titleChoice = dir > 0 ? 1 : 0
        return
    }
    if (gameState == OPTIONS) {
        if (isEditingOption) return
        optionChoice = (optionChoice + dir + 4) % 4
        return
    }
    if (gameState == DIFFICULTY) {
        difficultyChoice = (difficultyChoice + dir + 3) % 3
        return
    }
    if (gameState == OBSTACLES) {
        obstacleChoicePos = (obstacleChoicePos + dir + 5) % 5
        return
    }
    if (gameState == SAVING) {
        saveNameIndices[saveNamePos] = (saveNameIndices[saveNamePos] - dir + 36) % 36
        return
    }
    if (gameState == LOADING) {
        if (loadChoices.length > 0) {
            loadChoicePos = (loadChoicePos + dir + loadChoices.length) % loadChoices.length
        }
        return
    }
    if (gameState == PLAYING && inventoryOpen) {
        moveInventorySelection(dir)
        return
    }
}

function adjustSetting(dir: number) {
    if (gameState == OPTIONS) {
        if (!isEditingOption) return
        if (dir < 0) {
            if (optionChoice == 0) {
                if (selectedLevels == INFINITY) selectedLevels = 10
                else if (selectedLevels > 1) selectedLevels--
            } else if (optionChoice == 1) {
                if (selectedHealth == INFINITY) selectedHealth = 7
                else if (selectedHealth > 1) selectedHealth--
            }
        } else {
            if (optionChoice == 0) {
                if (selectedLevels == INFINITY) selectedLevels = 1
                else {
                    selectedLevels++
                    if (selectedLevels > 10) selectedLevels = INFINITY
                }
            } else if (optionChoice == 1) {
                if (selectedHealth == INFINITY) selectedHealth = 1
                else {
                    selectedHealth++
                    if (selectedHealth > 7) selectedHealth = INFINITY
                }
            }
        }
        return
    }

    if (gameState == DIFFICULTY) {
        if (dir < 0) {
            if (difficultyChoice == 0) {
                if (diffZombieSpeedLevel > 1) diffZombieSpeedLevel--
            } else if (difficultyChoice == 1) {
                if (diffZombieCountOffset > -5) diffZombieCountOffset--
            }
        } else {
            if (difficultyChoice == 0) {
                if (diffZombieSpeedLevel < 5) diffZombieSpeedLevel++
            } else if (difficultyChoice == 1) {
                if (diffZombieCountOffset < 5) diffZombieCountOffset++
            }
        }
        return
    }

    if (gameState == OBSTACLES) {
        if (obstacleChoicePos == 0) optRiver = !optRiver
        else if (obstacleChoicePos == 1) optSurvive = !optSurvive
        else if (obstacleChoicePos == 2) optToll = !optToll
        else if (obstacleChoicePos == 3) optDungeon = !optDungeon
        else if (obstacleChoicePos == 4) optFreeze = !optFreeze
        return
    }
}

controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState != PLAYING || inventoryOpen) {
        navigateMenu(-1)
        return
    }
    if (gameState == PLAYING && !inventoryOpen) {
        facingDx = 0
        facingDy = -1
    }
})

controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState != PLAYING || inventoryOpen) {
        navigateMenu(1)
        return
    }
    if (gameState == PLAYING && !inventoryOpen) {
        facingDx = 0
        facingDy = 1
    }
})

controller.left.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState != PLAYING || inventoryOpen) {
        adjustSetting(-1)
        return
    }
    if (gameState == PLAYING && !inventoryOpen) {
        facingDx = -1
        facingDy = 0
    }
})

controller.right.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState != PLAYING || inventoryOpen) {
        adjustSetting(1)
        return
    }
    if (gameState == PLAYING && !inventoryOpen) {
        facingDx = 1
        facingDy = 0
    }
})

// INSTANT ACTION TRIGGER

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
            gameState = DIFFICULTY
            difficultyChoice = 0
            menuScrollY = 0
        } else if (optionChoice == 3) {
            gameState = LOADING
            loadChoices = []
            for (let i = 1; i <= 3; i++) {
                let svName = settings.readString("save_" + i + "_name")
                if (svName && svName.length > 0) loadChoices.push(svName)
            }
            loadChoicePos = 0
            menuScrollY = 0
        }
        return
    }

    if (gameState == DIFFICULTY) {
        if (difficultyChoice == 2) {
            gameState = OBSTACLES
            obstacleChoicePos = 0
            menuScrollY = 0
        } else {
            gameState = OPTIONS
            menuScrollY = 0
        }
        return
    }

    if (gameState == OBSTACLES) {
        if (obstacleChoicePos == 0) optRiver = !optRiver
        else if (obstacleChoicePos == 1) optSurvive = !optSurvive
        else if (obstacleChoicePos == 2) optToll = !optToll
        else if (obstacleChoicePos == 3) optDungeon = !optDungeon
        else if (obstacleChoicePos == 4) optFreeze = !optFreeze
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
        // Prevent the release of 'A' from triggering a block placement
        aLongPressTriggered = true
        return
    }

    aLongPressTriggered = false
    aRepeatCount = 0
    controller.setRepeatDefault(300, 300)
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


controller.B.onEvent(ControllerButtonEvent.Pressed, function () {

    if (gameState == TOLL_DIALOG) {
        gameState = PLAYING
        // Bounce player so they don't immediately re-trigger
        let dx = player.x - (goalCol * TILE + 8)
        let dy = player.y - (goalRow * TILE + 8)
        if (dx === 0 && dy === 0) dx = 1
        player.x += Math.sign(dx) * 8
        player.y += Math.sign(dy) * 8
        resumeEnemies()
        resumePlayer()
        return
    }

    if (gameState == SAVING) {
        if (saveNamePos > 0) {
            saveNamePos--
        } else {
            gameState = PLAYING
            inventoryOpen = true
        }
        return
    }

    if (gameState == LOADING) {
        gameState = OPTIONS
        return
    }

    if (gameState == DIFFICULTY) {
        gameState = OPTIONS
        return
    }

    if (gameState == OBSTACLES) {
        gameState = OPTIONS
        return
    }

    if (gameState == OPTIONS) {
        if (isEditingOption) {
            isEditingOption = false
            return
        }
        gameState = TITLE
        return
    }

    if (gameState != PLAYING) return

    if (!inventoryOpen) {
        inventoryOpen = true
        inventoryCursor = selectedMat
        menuScrollY = 0
        stopPlayer()
        stopEnemies()
    } else {
        inventoryOpen = false
        resumeEnemies()
        resumePlayer()
    }
})


// --------------------------------------------------------------------------
// Collision and damage.

// --------------------------------------------------------------------------
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite: Sprite, otherSprite: Sprite) {
    if (invincible || gameState != PLAYING) return

    invincible = true
    scene.cameraShake(4, 300)

    if (selectedHealth != INFINITY) {
        info.changeLifeBy(-1)
    }

    // Scatter resources on hit — drops random inventory items as tiles near the player
    let scatterCount = randint(1, 3)
    for (let sc = 0; sc < scatterCount; sc++) {
        // Pick a random non-empty material to drop
        let dropMat = -1
        let scAttempts = 0
        while (scAttempts < 10) {
            let pick = randint(0, 5)
            if (pick == 0 && invDirt > 0) { invDirt--; dropMat = DIRT; break }
            if (pick == 1 && invStone > 0) { invStone--; dropMat = STONE; break }
            if (pick == 2 && invWood > 0) { invWood--; dropMat = WOOD; break }
            if (pick == 3 && invGrass > 0) { invGrass--; dropMat = TALL_GRASS; break }
            if (pick == 4 && invBones > 0) { invBones--; dropMat = BONE; break }
            if (pick == 5 && invIron > 0) { invIron--; dropMat = IRON_ORE; break }
            scAttempts++
        }
        if (dropMat >= 0) {
            // Find a nearby grass tile to drop onto
            let dc = playerCol() + randint(-2, 2)
            let dr = playerRow() + randint(-2, 2)
            if (inBounds(dc, dr) && getTileId(dc, dr) == GRASS) {
                setTile(dc, dr, dropMat)
            }
        }
    }

    let pushX = getSign(sprite.x - otherSprite.x)
    let pushY = getSign(sprite.y - otherSprite.y)

    if (pushX == 0 && pushY == 0) {
        pushX = 1
    }

    let nextX = sprite.x + pushX * 14
    let nextY = sprite.y + pushY * 14
    let nextCol = Math.floor(nextX / TILE)
    let nextRow = Math.floor(nextY / TILE)
    let currentCol = Math.floor(sprite.x / TILE)
    let currentRow = Math.floor(sprite.y / TILE)

    if (!isSolid(getTileId(nextCol, currentRow))) {
        sprite.x += pushX * PUSH_DISTANCE
    }
    if (!isSolid(getTileId(currentCol, nextRow))) {
        sprite.y += pushY * PUSH_DISTANCE
    }

    forgetZombie(otherSprite)
    otherSprite.destroy(effects.disintegrate, 150)

    control.runInParallel(function () {
        pause(INVINCIBILITY_MS)
        invincible = false
    })
})

sprites.onOverlap(SpriteKind.Skeleton, SpriteKind.Enemy, function (skel: Sprite, zombie: Sprite) {
    if (gameState != PLAYING) return
    forgetZombie(zombie)
    zombie.destroy(effects.fire, 200)
    forgetSkeleton(skel)
    skel.destroy(effects.fire, 200)
    music.playTone(131, 50)
    updateSkeletonTargeting()
})

info.onLifeZero(function () {
    gameState = GAMEOVER
    destroyLevelSprites()
    playDeathSound()
})


