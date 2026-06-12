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
    inventoryCursor += amount
    if (inventoryCursor < MAT_DIRT) inventoryCursor = MAT_SAVE
    if (inventoryCursor > MAT_SAVE) inventoryCursor = MAT_DIRT
}

function setupLevel() {
    destroyLevelSprites() // Clean slate for the new level
    chooseTheme() // Randomize tile color palette
    initTiles() // Rebuild tile images with the new theme
    
    // Select an active obstacle from the user's enabled settings
    let activeOpts: number[] = []
    if (optRiver) activeOpts.push(OBSTACLE_RIVER)
    if (optSurvive) activeOpts.push(OBSTACLE_SURVIVE)
    if (optToll) activeOpts.push(OBSTACLE_TOLL)
    if (optDungeon) activeOpts.push(OBSTACLE_DUNGEON)

    if (activeOpts.length > 0) {
        // Guarantee no consecutive repeats by filtering out the previous obstacle
        let filteredOpts: number[] = []
        for (let fo = 0; fo < activeOpts.length; fo++) {
            if (activeOpts[fo] != lastObstacle) filteredOpts.push(activeOpts[fo])
        }
        // Use filtered list if possible, otherwise fall back to full list (single option enabled)
        if (filteredOpts.length > 0) {
            activeObstacle = filteredOpts[randint(0, filteredOpts.length - 1)]
        } else {
            activeObstacle = activeOpts[randint(0, activeOpts.length - 1)]
        }
        lastObstacle = activeObstacle
    } else {
        activeObstacle = OBSTACLE_NONE // Classic mode
    }

    if (activeObstacle == OBSTACLE_SURVIVE) {
        survivalPhase = 1 // Prep phase
        survivalTimer = 120000 // 120 seconds (2 mins)
    } else if (activeObstacle == OBSTACLE_TOLL) {
        // Toll scales up with the level depth, randomly picks a single material requirement
        tollMat = randint(0, 5) // MAT_DIRT to MAT_IRON
        tollAmount = randint(3 + level, 8 + level * 2)
        if (tollAmount > 20) tollAmount = 20
    }

    generateWorld() // Physically generate the grid layout

    tiles.setTilemap(tiles.createTilemap(world, layout, tileImages, TileScale.Sixteen))
    refreshMap()

    // Setup player character
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
    if (activeObstacle == OBSTACLE_SURVIVE) {
        diamondMarker.setFlag(SpriteFlag.Invisible, true)
        setTile(goalCol, goalRow, GRASS)
    }

    maxZombies = 5 + level + diffZombieCountOffset
    if (maxZombies < 0) maxZombies = 0
    if (maxZombies > 15) maxZombies = 15

    // Harvest gate: diamond hidden until player mines enough blocks
    // Skip in Survive mode (has its own diamond timing) and Toll/Dungeon mode (have their own gates)
    harvestCount = 0
    if (activeObstacle == OBSTACLE_RIVER) {
        harvestGoal = 3 + Math.floor(level * 1.5)
        if (harvestGoal > 20) harvestGoal = 20
        diamondMarker.setFlag(SpriteFlag.Invisible, true)
        setTile(goalCol, goalRow, GRASS)
    } else {
        harvestGoal = 0 // No harvest gate for Survive, Toll, Dungeon, or None
    }

    invincible = false
    inventoryOpen = false
    gameState = PLAYING
    
    inDungeon = false
    hasDungeonKey = false
    overworldBuffer = null
    waterBridgeCols = []
    waterBridgeRows = []

    // Announce the active obstacle
    if (activeObstacle == OBSTACLE_RIVER) showBanner("RIVER CROSSING")
    else if (activeObstacle == OBSTACLE_SURVIVE) showBanner("ZOMBIE SURVIVAL")
    else if (activeObstacle == OBSTACLE_TOLL) showBanner("TOLL ROAD")
    else if (activeObstacle == OBSTACLE_DUNGEON) showBanner("KEY CRAWL")
    else showBanner("FIND THE DIAMOND")

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
    invGrass = 0
    invBones = 0
    invIron = 0
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
