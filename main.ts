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

    if (gameState == DUNGEON_TRANSITION) {
        let cx = scene.cameraProperty(CameraProperty.X)
        let cy = scene.cameraProperty(CameraProperty.Y)
        let speed = 4
        
        let dx = targetCameraX - cx
        let dy = targetCameraY - cy
        
        if (Math.abs(dx) <= speed && Math.abs(dy) <= speed) {
            scene.centerCameraAt(targetCameraX, targetCameraY)
            gameState = PLAYING
            resumePlayer()
            
            // Push player slightly into the room to ensure they crossed the boundary completely
            let rx = Math.floor(player.x / 160)
            let ry = Math.floor(player.y / 128)
            // If they are on the edge, push them inside
            if (player.x % 160 < 10) player.x += 12
            else if (player.x % 160 > 150) player.x -= 12
            
            if (player.y % 128 < 10) player.y += 12
            else if (player.y % 128 > 118) player.y -= 12
        } else {
            if (Math.abs(dx) > 0) cx += Math.sign(dx) * speed
            if (Math.abs(dy) > 0) cy += Math.sign(dy) * speed
            scene.centerCameraAt(cx, cy)
        }
        return
    }

    if (gameState == TOLL_DIALOG && demoMode) {
        if (game.runtime() % 1000 < 50) { // Slight delay to show dialog before acting
            let current = 0
            if (tollMat == MAT_DIRT) current = invDirt
            else if (tollMat == MAT_STONE) current = invStone
            else if (tollMat == MAT_IRON) current = invIron
            else if (tollMat == MAT_WOOD) current = invWood
            else if (tollMat == MAT_GRASS) current = invGrass
            else if (tollMat == MAT_BONE) current = invBones

            if (current >= tollAmount) {
                if (tollMat == MAT_DIRT) invDirt -= tollAmount
                else if (tollMat == MAT_STONE) invStone -= tollAmount
                else if (tollMat == MAT_IRON) invIron -= tollAmount
                else if (tollMat == MAT_WOOD) invWood -= tollAmount
                else if (tollMat == MAT_GRASS) invGrass -= tollAmount
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
                showBanner("ZOMBIE ATTACK!")
                music.playTone(523, 200)
                music.playTone(493, 300)
            } else if (survivalPhase == 2) {
                // Survive phase is over, spawn diamond
                survivalPhase = 0
                survivalTimer = 0
                setTile(goalCol, goalRow, DIAMOND)
                if (diamondMarker) diamondMarker.setFlag(SpriteFlag.Invisible, false)
                showBanner("DIAMOND APPEARED!")
                music.playTone(440, 500)
            }
        }
    }

    // Harvest gate: reveal diamond when mining target reached
    if (harvestGoal > 0 && harvestCount >= harvestGoal && activeObstacle != OBSTACLE_SURVIVE) {
        harvestGoal = 0 // Gate cleared, stop checking
        setTile(goalCol, goalRow, DIAMOND)
        if (diamondMarker) diamondMarker.setFlag(SpriteFlag.Invisible, false)
        showBanner("DIAMOND APPEARED!")
        music.playTone(440, 500)
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
        if (inDungeon) updateDungeonCamera()
    }

    // Update the visual representation of the player's facing direction and animation state
    updatePlayerAnim()

    if (!demoMode) {
        updateTargetCursor()
    } else {
        if (targetCursor != null) targetCursor.setFlag(SpriteFlag.Invisible, true)
    }

    // Check if enemies walked onto Spike traps (throttled to every 4 frames)
    spikeCheckCounter++
    if (spikeCheckCounter >= 4) {
        spikeCheckCounter = 0

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
    }

    // Tile collision detection
    let pCol = playerCol()
    let pRow = playerRow()
    let pTile = getTileId(pCol, pRow)

    if (pTile == DIAMOND) {
        if (activeObstacle == OBSTACLE_TOLL) {
            gameState = TOLL_DIALOG
            stopPlayer()
            stopEnemies()
        } else {
            // Standard level completion
            finishLevel()
        }
    } else if (pTile == CAVE_ENTRANCE && !inDungeon) {
        // Enter Dungeon
        inDungeon = true
        dungeonReturnCol = pCol
        dungeonReturnRow = pRow
        
        suspendOverworld()
        if (diamondMarker) {
            diamondMarker.setFlag(SpriteFlag.Invisible, true)
            effects.clearParticles(diamondMarker)
        }
        
        for (let z of sprites.allOfKind(SpriteKind.Enemy)) { forgetZombie(z); z.destroy() }
        
        generateDungeon()
        
        // Spawn in the designated dungeon spawn room
        player.x = dungeonSpawnCol * TILE + 8
        player.y = dungeonSpawnRow * TILE + 8
        // Initialize camera
        currentRoomX = Math.floor(player.x / 160)
        currentRoomY = Math.floor(player.y / 128)
        scene.cameraFollowSprite(null)
        scene.centerCameraAt(currentRoomX * 160 + 80, currentRoomY * 128 + 64)
        stopLevelMusic()
        music.playTone(131, 300)
        playDungeonMusic()
        showBanner("DUNGEON")
    } else if (pTile == KEY) {
        // Key pickup
        hasDungeonKey = true
        inDungeon = false
        for (let z of sprites.allOfKind(SpriteKind.Enemy)) { forgetZombie(z); z.destroy() }
        
        restoreOverworld()
        if (diamondMarker && activeObstacle != OBSTACLE_SURVIVE) {
            diamondMarker.setFlag(SpriteFlag.Invisible, false)
            diamondMarker.startEffect(effects.coolRadial)
        }
        
        tiles.setTilemap(tiles.createTilemap(world, layout, tileImages, TileScale.Sixteen))
        refreshMap()
        scene.cameraFollowSprite(player)
        // Change CAVE_ENTRANCE to KEY_HOLE
        setTile(dungeonReturnCol, dungeonReturnRow, KEY_HOLE)
        player.x = dungeonReturnCol * TILE + 8
        player.y = (dungeonReturnRow - 1) * TILE + 8
        music.playTone(523, 300)
        stopLevelMusic()
        playLevelMusic()
        showBanner("KEY FOUND")
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
        drawHarvestGate(target)
        drawInventory(target)
        drawDemoPausedBanner(target)
        drawBanner(target)
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
