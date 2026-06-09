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
    if (player == null || gameState != PLAYING || isDemoActive() || inventoryOpen) return
    
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

    if (gameState != PLAYING || demoMode || inventoryOpen) {
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
    return id == DIRT || id == STONE || id == DIRT_WALL || id == SPIKES || id == WOOD || id == LEAVES || id == BONE
}

function matCount(): number {
    if (selectedMat == MAT_DIRT) return invDirt
    else if (selectedMat == MAT_STONE) return invStone
    else if (selectedMat == MAT_WOOD) return invWood
    else if (selectedMat == MAT_LEAVES) return invLeaves
    else return invBones
}

function selectedTile(): number {
    if (selectedMat == MAT_DIRT) return DIRT_WALL
    else if (selectedMat == MAT_STONE) return SPIKES
    else if (selectedMat == MAT_WOOD) return WOOD
    else if (selectedMat == MAT_LEAVES) return LEAVES
    else return BONE
}

function breakEffect(col: number, row: number) {
    let fx = sprites.create(blank16, SpriteKind.Food)
    fx.setPosition(col * TILE + 8, row * TILE + 8)
    fx.lifespan = 250
    fx.startEffect(effects.disintegrate, 250)
}

function buildBlock(col: number, row: number, dirX: number, dirY: number) {
    // Determine which inventory to debit based on the currently selected material
    if (selectedMat == MAT_DIRT) {
        invDirt += -1
        setTile(col, row, DIRT_WALL)
    } else if (selectedMat == MAT_STONE) {
        invStone += -1
        setTile(col, row, SPIKES)
    } else if (selectedMat == MAT_WOOD) {
        invWood += -1
        setTile(col, row, WOOD)
    } else if (selectedMat == MAT_LEAVES) {
        invLeaves += -1
        setTile(col, row, LEAVES)
    } else if (selectedMat == MAT_BONE) {
        invBones += -1
        spawnSkeleton(col, row)
    }

    playPlayerAttack(dirX, dirY)
    music.playTone(175, 50)
}

/** * Instant action executor. Tries to harvest the exact tile faced first.
 * If blocked and building, automatically finds the nearest available surrounding grass.
 */
function performTargetAction() {
    if (player == null) return

    let frontCol = playerCol() + facingDx
    let frontRow = playerRow() + facingDy
    let frontId = getTileId(frontCol, frontRow)

    if (isHarvestable(frontId)) {
        if (frontId == DIRT || frontId == DIRT_WALL) invDirt += 1
        else if (frontId == STONE || frontId == SPIKES) invStone += 1
        else if (frontId == WOOD) invWood += 1
        else if (frontId == LEAVES) invLeaves += 1
        else if (frontId == BONE) invBones += 1

        setTile(frontCol, frontRow, GRASS)
        playPlayerAttack(facingDx, facingDy)
        music.playTone(262, 50)
        return
    }

    // If we have resources selected, attempt to build
    if (matCount() > 0 && selectedMat != MAT_SAVE) {
        // Try exactly the space right in front of the player
        if (frontId == GRASS || frontId == WATER) {
            buildBlock(frontCol, frontRow, facingDx, facingDy)
            return
        }

        // Auto-search: Fallback to the nearest valid grass or water around the player
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx == 0 && dy == 0) continue
                let c = playerCol() + dx
                let r = playerRow() + dy

                if (getTileId(c, r) == GRASS || getTileId(c, r) == WATER) {
                    buildBlock(c, r, dx, dy)
                    return
                }
            }
        }
    }

    // No valid action found — play a short error tone as feedback
    music.playTone(131, 40)
}


// --------------------------------------------------------------------------
// Input handling.

// --------------------------------------------------------------------------
controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == TITLE) {
        titleChoice = 0
        return
    }

    if (gameState == OPTIONS) {
        optionChoice += -1
        if (optionChoice < 0) optionChoice = 4
        return
    }

    if (gameState == DIFFICULTY) {
        difficultyChoice += -1
        if (difficultyChoice < 0) difficultyChoice = 2
        return
    }

    if (gameState == OBSTACLES) {
        obstacleChoicePos += -1
        if (obstacleChoicePos < 0) obstacleChoicePos = 2
        return
    }

    if (gameState == SAVING) {
        saveNameIndices[saveNamePos] = (saveNameIndices[saveNamePos] + 1) % 36
        return
    }

    if (gameState == LOADING) {
        if (loadChoices.length > 0) {
            loadChoicePos = (loadChoicePos - 1 + loadChoices.length) % loadChoices.length
        }
        return
    }

    if (gameState == PLAYING && inventoryOpen) {
        moveInventorySelection(-1)
        return
    }

    if (gameState == PLAYING && !demoMode && !inventoryOpen) {
        facingDx = 0
        facingDy = -1
    }
})

controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == TITLE) {
        titleChoice = 1
        return
    }

    if (gameState == OPTIONS) {
        optionChoice += 1
        if (optionChoice > 4) optionChoice = 0
        return
    }

    if (gameState == DIFFICULTY) {
        difficultyChoice += 1
        if (difficultyChoice > 2) difficultyChoice = 0
        return
    }

    if (gameState == OBSTACLES) {
        obstacleChoicePos += 1
        if (obstacleChoicePos > 2) obstacleChoicePos = 0
        return
    }

    if (gameState == SAVING) {
        saveNameIndices[saveNamePos] = (saveNameIndices[saveNamePos] - 1 + 36) % 36
        return
    }

    if (gameState == LOADING) {
        if (loadChoices.length > 0) {
            loadChoicePos = (loadChoicePos + 1) % loadChoices.length
        }
        return
    }

    if (gameState == PLAYING && inventoryOpen) {
        moveInventorySelection(1)
        return
    }

    if (gameState == PLAYING && !demoMode && !inventoryOpen) {
        facingDx = 0
        facingDy = 1
    }
})

controller.left.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == DIFFICULTY) {
        if (difficultyChoice == 0) {
            if (diffZombieSpeedLevel > 1) diffZombieSpeedLevel--
        } else if (difficultyChoice == 1) {
            if (diffZombieCountOffset > -5) diffZombieCountOffset--
        }
        return
    }

    if (gameState == PLAYING && !demoMode && !inventoryOpen) {
        facingDx = -1
        facingDy = 0
    }
})

controller.right.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == DIFFICULTY) {
        if (difficultyChoice == 0) {
            if (diffZombieSpeedLevel < 5) diffZombieSpeedLevel++
        } else if (difficultyChoice == 1) {
            if (diffZombieCountOffset < 5) diffZombieCountOffset++
        }
        return
    }

    if (gameState == PLAYING && !demoMode && !inventoryOpen) {
        facingDx = 1
        facingDy = 0
    }
})

// INSTANT ACTION TRIGGER
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == VICTORY || gameState == GAMEOVER) {
        returnToTitleFromVictory()
        return
    }

    if (isDemoActive()) {
        toggleDemoPause()
        return
    }

    if (gameState == TITLE) {
        if (titleChoice == 0) startGame()
        else { gameState = OPTIONS; menuScrollY = 0 }
        return
    }

    if (gameState == OPTIONS) {
        if (optionChoice == 0) {
            if (selectedLevels == INFINITY) {
                selectedLevels = 1
            } else {
                selectedLevels += 1
                if (selectedLevels > 10) selectedLevels = INFINITY
            }
        } else if (optionChoice == 1) {
            if (selectedHealth == INFINITY) {
                selectedHealth = 1
            } else {
                selectedHealth += 1
                if (selectedHealth > 7) selectedHealth = INFINITY
            }
        } else if (optionChoice == 2) {
            demoMode = !demoMode
            if (demoMode) {
                selectedLevels = INFINITY
                selectedHealth = INFINITY
            } else {
                selectedLevels = 1
                selectedHealth = 5
            }
        } else if (optionChoice == 3) {
            gameState = DIFFICULTY
            difficultyChoice = 0
            menuScrollY = 0
        } else if (optionChoice == 4) {
            gameState = LOADING
            loadChoices = getSaveList()
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
        }
        return
    }

    if (gameState == OBSTACLES) {
        if (obstacleChoicePos == 0) optRiver = !optRiver
        else if (obstacleChoicePos == 1) optSurvive = !optSurvive
        else if (obstacleChoicePos == 2) optToll = !optToll
        return
    }

    if (gameState == TOLL_DIALOG) {
        let current = 0
        if (tollMat == MAT_DIRT) current = invDirt
        else if (tollMat == MAT_STONE) current = invStone
        else if (tollMat == MAT_WOOD) current = invWood
        else if (tollMat == MAT_LEAVES) current = invLeaves
        else if (tollMat == MAT_BONE) current = invBones

        if (current >= tollAmount) {
            if (tollMat == MAT_DIRT) invDirt -= tollAmount
            else if (tollMat == MAT_STONE) invStone -= tollAmount
            else if (tollMat == MAT_WOOD) invWood -= tollAmount
            else if (tollMat == MAT_LEAVES) invLeaves -= tollAmount
            else if (tollMat == MAT_BONE) invBones -= tollAmount

            gameState = PLAYING
            finishLevel()
        } else {
            music.playTone(131, 100)
        }
        return
    }

    if (gameState == SAVING) {
        if (saveNamePos < 2) {
            saveNamePos++
        } else {
            let svName = saveChars.charAt(saveNameIndices[0]) + saveChars.charAt(saveNameIndices[1]) + saveChars.charAt(saveNameIndices[2])
            if (game.ask("Save as " + svName + "?", "A=Yes B=No")) {
                saveGame(svName)
            }
        }
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
        if (selectedMat == MAT_SAVE) {
            gameState = SAVING
            saveNameIndices = [0, 0, 0]
            saveNamePos = 0
            return
        }
        inventoryOpen = false
        resumeEnemies()
        resumePlayer()
        return
    }

    // Instantly fires the harvest/build sequence
    performTargetAction()
})

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    if (isDemoActive()) {
        toggleDemoPause()
        return
    }

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
        gameState = TITLE
        return
    }

    if (gameState != PLAYING) return

    if (!inventoryOpen) {
        inventoryOpen = true
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
    playDamageSound()

    if (demoMode) {
        demoRecoveryUntil = game.runtime() + 650
        demoMoveUntil = 0
        demoHeldVx = 0
        demoHeldVy = 0
        demoStartEscape()
    }

    if (selectedHealth != INFINITY) {
        info.changeLifeBy(-1)
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
    stopLevelMusic()
    destroyLevelSprites()
    playDeathSound()
})


