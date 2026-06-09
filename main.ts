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

    if (gameState != PLAYING || player == null) return

    updateDiamondMarker()

    if (inventoryOpen) {
        stopPlayer()
        stopEnemies()
        return
    }

    if (isDemoActive()) {
        updateDemoMode()
    } else {
        updateFacing()
    }

    updatePlayerAnim()

    if (!demoMode) {
        updateTargetCursor()
    } else {
        if (targetCursor != null) targetCursor.setFlag(SpriteFlag.Invisible, true)
    }

    for (let zombie of sprites.allOfKind(SpriteKind.Enemy)) {
        let zCol = Math.floor(zombie.x / TILE)
        let zRow = Math.floor(zombie.y / TILE)

        if (getTileId(zCol, zRow) == SPIKES) {
            setTile(zCol, zRow, GRASS)
            forgetZombie(zombie)
            zombie.destroy(effects.fire, 200)
            breakEffect(zCol, zRow)
        }
    }

    if (getTileId(playerCol(), playerRow()) == DIAMOND) {
        finishLevel()
    }
})


// --------------------------------------------------------------------------
// Render pipeline.

// --------------------------------------------------------------------------
scene.createRenderable(100, function (target: Image, camera: scene.Camera) {
    if (gameState == TITLE) drawTitle(target)
    else if (gameState == OPTIONS) drawOptions(target)
    else if (gameState == DIFFICULTY) drawDifficultyMenu(target)
    else if (gameState == INTRO) drawIntro(target)
    else if (gameState == PLAYING) {
        drawGoalPointer(target)
        drawResourceHud(target)
        drawInventory(target)
        drawDemoPausedBanner(target)
    } else if (gameState == SAVING) {
        drawResourceHud(target)
        drawInventory(target)
        drawSaving(target)
    } else if (gameState == LOADING) drawLoading(target)
    else if (gameState == VICTORY) drawVictory(target)
    else if (gameState == GAMEOVER) drawGameOver(target)
})
