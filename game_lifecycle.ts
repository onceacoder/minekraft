// --------------------------------------------------------------------------
// Game Lifecycle & State Transitions
// Manages level setup, teardown, player/enemy pause/resume, and state changes.
// --------------------------------------------------------------------------

function stopPlayer() {
    if (player == null) return
    controller.moveSprite(player, 0, 0)
    player.vx = 0
    player.vy = 0
}

function resumePlayer() {
    if (player == null) return
    if (gameState != PLAYING || inventoryOpen) {
        controller.moveSprite(player, 0, 0)
        player.vx = 0
        player.vy = 0
        return
    }

    if (demoMode) {
        controller.moveSprite(player, 0, 0)
    } else {
        controller.moveSprite(player, PLAYER_SPEED, PLAYER_SPEED)
    }
}

function stopEnemies() {
    for (let zombie of zombieRefs) {
        zombie.follow(player, 0) // Fully stops the physics engine pathfinding
        zombie.vx = 0
        zombie.vy = 0
    }
}

function destroyLevelSprites() {
    for (let s of sprites.allOfKind(SpriteKind.Player)) {
        stopCoreAnimation(s)
        s.destroy()
    }
    for (let e of sprites.allOfKind(SpriteKind.Enemy)) {
        stopCoreAnimation(e)
        e.destroy()
    }
    for (let skel of sprites.allOfKind(SpriteKind.Skeleton)) {
        stopCoreAnimation(skel)
        skel.destroy()
    }
    for (let f of sprites.allOfKind(SpriteKind.Food)) f.destroy()

    player = null
    targetCursor = null
    diamondMarker = null
    zombieRefs = []
    zombieModes = []
    skeletonRefs = []
    skeletonTargets = []

    // Safety clear for entire custom animation engine pipeline
    animSprites = []
    animFrames = []
    animIntervals = []
    animTimers = []
    animIndices = []
    animLoops = []
}

function createDiamondMarker() {
    diamondMarker = sprites.create(blank16, SpriteKind.Food)
    diamondMarker.setPosition(goalCol * TILE + 8, goalRow * TILE + 8)
    diamondMarker.z = 30
    diamondMarker.setFlag(SpriteFlag.Ghost, true)
    diamondMarker.startEffect(effects.coolRadial)
}

function updateDiamondMarker() {
    if (diamondMarker != null && gameState == PLAYING) {
        diamondMarker.setPosition(goalCol * TILE + 8, goalRow * TILE + 8)
    }
}

function moveInventorySelection(amount: number) {
    selectedMat += amount
    if (selectedMat < MAT_DIRT) selectedMat = MAT_SAVE
    if (selectedMat > MAT_SAVE) selectedMat = MAT_DIRT
}

function setupLevel() {
    destroyLevelSprites()
    chooseTheme()
    initTiles()
    generateWorld()

    tiles.setTilemap(tiles.createTilemap(world, layout, tileImages, TileScale.Sixteen))
    refreshMap()

    player = sprites.create(pDown, SpriteKind.Player)
    tiles.placeOnTile(player, tiles.getTileLocation(24, 10))
    player.z = 10
    scene.cameraFollowSprite(player)
    playerAnim = ""
    playerAttackUntil = 0
    setPlayerAnim("idle-down", [pDown], 120, false)

    targetCursor = sprites.create(cursorImg, SpriteKind.Food)
    targetCursor.z = 50
    targetCursor.setFlag(SpriteFlag.Invisible, true)

    createDiamondMarker()

    maxZombies = 5 + level + diffZombieCountOffset
    if (maxZombies < 0) maxZombies = 0
    if (maxZombies > 15) maxZombies = 15

    invincible = false
    inventoryOpen = false
    gameState = PLAYING

    resumePlayer()
    playLevelMusic()
}

function beginLevel(levelNo: number) {
    level = levelNo

    if (selectedLevels == INFINITY || selectedLevels > 1) {
        gameState = INTRO
        destroyLevelSprites()

        control.runInParallel(function () {
            pause(1200)
            setupLevel()
        })
    } else {
        setupLevel()
    }
}

function startGame() {
    invDirt = 0
    invStone = 0
    invWood = 0
    invLeaves = 0
    invBones = 0
    selectedMat = MAT_DIRT

    if (demoMode) {
        selectedLevels = INFINITY
        selectedHealth = INFINITY
    }

    if (selectedHealth == INFINITY) info.setLife(7)
    else info.setLife(selectedHealth)

    demoStartedAt = game.runtime()
    beginLevel(1)
}

function returnToTitleFromVictory() {
    music.stopAllSounds()
    destroyLevelSprites()
    gameState = TITLE
    titleChoice = 0
    optionChoice = 0
    demoPaused = false
    demoActionCooldown = 0
    demoHarvestCooldown = 0
    demoBuildCooldown = 0
    demoPauseUntil = 0
    scene.centerCameraAt(80, 60)
}

function finishLevel() {
    stopLevelMusic()

    if (selectedLevels == INFINITY) {
        beginLevel(level + 1)
    } else if (level < selectedLevels) {
        beginLevel(level + 1)
    } else {
        gameState = VICTORY
        destroyLevelSprites()
        playVictoryJingle()
    }
}
