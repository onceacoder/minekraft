/**
 * ============================================================================
 * MINEKRAFT - MakeCode Arcade TypeScript Source (CORE API SAFE VERSION)
 * ============================================================================
 * * GAME DESIGN & MECHANICS:
 * ------------------------
 * Minekraft is a top-down survival exploration game. The objective is to navigate
 * a procedurally generated map, harvest resources, build defensive structures, 
 * avoid chasing zombies, and reach the Diamond tile to progress.
 * * * INSTANT ACTION & SMART BUILD SYSTEM:
 * --------------------------------------
 * Pressing A instantly harvests the tile the player is facing. If building,
 * it attempts the front tile, then auto-searches the 8 surrounding tiles to
 * find a valid grass spot, creating a reliable, fluid action mechanic.
 * * * ADVANCED BIT-PACKED SAVE SYSTEM:
 * ----------------------------------
 * To protect hardware memory, the 2304-tile grid is bit-packed (6 tiles per int)
 * reducing the save size to a highly efficient 384-length NumberArray.
 * ============================================================================
 */


// --------------------------------------------------------------------------
// Main per-frame update.

// --------------------------------------------------------------------------
game.onUpdate(function () {
    tickCoreAnimations()
    tickSkeletons()

    if (gameState == TOLL_DIALOG && demoMode) {
        if (game.runtime() % 1000 < 50) { // Slight delay to show dialog before acting
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
                // Bounce away and go back to harvesting
                player.x -= 32 * getSign(player.x - goalCol * TILE - 8)
                player.y -= 32 * getSign(player.y - goalRow * TILE - 8)
                gameState = PLAYING
                demoSeekDiamond = false
                demoStateUntil = 0
            }
        }
        return
    }

    if (gameState != PLAYING || player == null) return

    updateDiamondMarker()

    // Survival Mode mechanic: Check and decrement timer until Diamond spawn
    if (activeObstacle == OBSTACLE_SURVIVE && survivalTimer > 0) {
        survivalTimer -= 33 // Approximate delta time for 30 FPS
        if (survivalTimer <= 0) {
            if (survivalPhase == 1) {
                // Prep phase is over, start survive phase
                survivalPhase = 2
                survivalTimer = randint(120000, 300000) // 2-5 minutes
                music.playTone(523, 200)
                music.playTone(493, 300)
            } else if (survivalPhase == 2) {
                // Survive phase is over, spawn diamond
                survivalPhase = 0
                survivalTimer = 0
                rawSetTile(goalCol, goalRow, DIAMOND)
                if (diamondMarker) diamondMarker.setFlag(SpriteFlag.Invisible, false)
                music.playTone(440, 500)
            }
        }
    }

    if (inventoryOpen) {
        stopPlayer()
        stopEnemies()
        return
    }

    if (isDemoActive()) {
        updateDemoMode()
    } else {
        updateFacing()
        autoAlignPlayer()
    }

    // Update the visual representation of the player's facing direction and animation state
    updatePlayerAnim()

    if (!demoMode) {
        updateTargetCursor()
    } else {
        if (targetCursor != null) targetCursor.setFlag(SpriteFlag.Invisible, true)
    }

    // Check if enemies walked onto Spike traps
    for (let zombie of sprites.allOfKind(SpriteKind.Enemy)) {
        let zCol = Math.floor(zombie.x / TILE)
        let zRow = Math.floor(zombie.y / TILE)

        if (getTileId(zCol, zRow) == SPIKES) {
            setTile(zCol, zRow, GRASS) // Trap breaks after one use
            forgetZombie(zombie)
            zombie.destroy(effects.fire, 200)
            breakEffect(zCol, zRow)
        }
    }

    for (let skel of sprites.allOfKind(SpriteKind.Skeleton)) {
        let sCol = Math.floor(skel.x / TILE)
        let sRow = Math.floor(skel.y / TILE)

        if (getTileId(sCol, sRow) == SPIKES) {
            setTile(sCol, sRow, GRASS) // Trap breaks after one use
            forgetSkeleton(skel)
            skel.destroy(effects.fire, 200)
            breakEffect(sCol, sRow)
            updateSkeletonTargeting()
        }
    }

    // Goal collision detection
    if (getTileId(playerCol(), playerRow()) == DIAMOND) {
        if (activeObstacle == OBSTACLE_TOLL) {
            gameState = TOLL_DIALOG
            stopPlayer()
            stopEnemies()
        } else {
            // Standard level completion
            finishLevel()
        }
    }
})


// --------------------------------------------------------------------------
// Render pipeline.

// --------------------------------------------------------------------------
scene.createRenderable(100, function (target: Image, camera: scene.Camera) {
    if (gameState == TITLE) drawTitle(target)
    else if (gameState == OPTIONS) drawOptions(target)
    else if (gameState == DIFFICULTY) drawDifficultyMenu(target)
    else if (gameState == OBSTACLES) drawObstaclesMenu(target)
    else if (gameState == INTRO) drawIntro(target)
    else if (gameState == PLAYING) {
        drawGoalPointer(target)
        drawResourceHud(target)
        drawInventory(target)
        drawDemoPausedBanner(target)
    } else if (gameState == TOLL_DIALOG) {
        drawGoalPointer(target)
        drawResourceHud(target)
        drawInventory(target)
        drawTollDialog(target)
    } else if (gameState == SAVING) {
        drawResourceHud(target)
        drawInventory(target)
        drawSaving(target)
    } else if (gameState == LOADING) drawLoading(target)
    else if (gameState == VICTORY) drawVictory(target)
    else if (gameState == GAMEOVER) drawGameOver(target)
})
