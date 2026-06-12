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


let healingTimer = 0

// --------------------------------------------------------------------------
// Main per-frame update.

// --------------------------------------------------------------------------
// Main per-frame update loop.
// Note: In MakeCode, game.onUpdate runs continuously. We use `gameState` 
// to strictly gate the logic that should run per frame. This prevents 
// player movement or collisions from processing during transitions.
// --------------------------------------------------------------------------
game.onUpdate(function () {
    if (gameState == PLAYING) {
        updateTargetCursor()
        
        // Healing Station Logic:
        // When the player stands completely still on a HAY tile, we decrement 
        // a timer. If it reaches 60 frames (approx 2 seconds), we consume the HAY 
        // and restore 1 HP. This encourages players to build safe spots.
        if (Math.abs(player.vx) < 1 && Math.abs(player.vy) < 1 && getTileId(playerCol(), playerRow()) == HAY) {
            healingTimer += 1
            if (healingTimer >= 60) { // 2 seconds
                healingTimer = 0
                setTile(playerCol(), playerRow(), GRASS)
                
                // Visual Effect
                let healFx = sprites.create(blank16, SpriteKind.Food)
                healFx.setPosition(playerCol() * TILE + 8, playerRow() * TILE + 8)
                healFx.z = 20
                healFx.lifespan = 300
                healFx.startEffect(effects.hearts, 300)
                music.playTone(600, 100)
                
                // Only add life if not infinite
                if (selectedHealth != INFINITY) {
                    info.changeLifeBy(1)
                }
            }
        } else {
            healingTimer = 0
        }
    }

    tickCoreAnimations()
    tickSkeletons()

    // Dungeon Transition Logic:
    // When walking into a dungeon, we smoothly lock the camera and slide it 
    // to the new room. We bypass the PLAYING state to freeze player control 
    // during this animation, pushing the player slightly into the room at the end.
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

    updateObstacles()

    if (gameState != PLAYING || player == null) return

    updateDiamondMarker()

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

    updateFacing()
    autoAlignPlayer()
    if (inDungeon) updateDungeonCamera()

    // Update the visual representation of the player's facing direction and animation state
    updatePlayerAnim()

    updateTargetCursor()

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
                breakEffect(zCol, zRow, SPIKES)
            }
        }

        for (let skel of sprites.allOfKind(SpriteKind.Skeleton)) {
            let sCol = Math.floor(skel.x / TILE)
            let sRow = Math.floor(skel.y / TILE)

            if (getTileId(sCol, sRow) == SPIKES) {
                setTile(sCol, sRow, GRASS) // Trap breaks after one use
                forgetSkeleton(skel)
                skel.destroy(effects.fire, 200)
                breakEffect(sCol, sRow, SPIKES)
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
        music.playTone(131, 300)
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
        drawCampfires(target)
        drawGoalPointer(target)
        drawNightOverlay(target)
        drawResourceHud(target)
        drawHarvestGate(target)
        drawFreezeMeter(target)
        drawInventory(target)
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
