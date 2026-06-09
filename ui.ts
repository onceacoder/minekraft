// --------------------------------------------------------------------------
// Level lifecycle and pause helpers.

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
    for (let zombie of sprites.allOfKind(SpriteKind.Enemy)) {
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


// --------------------------------------------------------------------------
// HUD and screen rendering helpers.

// --------------------------------------------------------------------------
function clampScreen(value: number, minValue: number, maxValue: number): number {
    if (value < minValue) return minValue
    if (value > maxValue) return maxValue
    return value
}

function drawGoalPointer(target: Image) {
    if (gameState != PLAYING || player == null) return

    let gx = goalCol * TILE + 8
    let gy = goalRow * TILE + 8
    let dx = gx - player.x
    let dy = gy - player.y
    let ax = Math.abs(dx)
    let ay = Math.abs(dy)

    if (ax < 120 && ay < 90) return

    let px = 80
    let py = 60

    if (ax > ay) {
        if (dx > 0) px = 142
        else px = 4

        if (ax > 0) py = 60 + Math.floor(dy * 52 / ax)
        py = clampScreen(py, 16, 100)
    } else {
        if (dy > 0) py = 100
        else py = 14

        if (ay > 0) px = 80 + Math.floor(dx * 70 / ay)
        px = clampScreen(px, 8, 142)
    }

    if (ax > ay) {
        if (dx > 0) target.drawTransparentImage(arrowR, px, py)
        else target.drawTransparentImage(arrowL, px - 16, py)
    } else {
        if (dy > 0) target.drawTransparentImage(arrowD, px - 8, py)
        else target.drawTransparentImage(arrowU, px - 8, py - 16)
    }
}

// 16x16 icon drawer (for standard sized menus)
function drawMatIcon(target: Image, mat: number, x: number, y: number) {
    if (mat == MAT_DIRT) target.drawTransparentImage(dirtWallTile, x, y)
    else if (mat == MAT_STONE) target.drawTransparentImage(spikesTile, x, y)
    else if (mat == MAT_WOOD) target.drawTransparentImage(woodTile, x, y)
    else if (mat == MAT_LEAVES) target.drawTransparentImage(leavesTile, x, y)
    else target.drawTransparentImage(boneTile, x, y)
}

// 8x8 icon drawer (aligned perfectly for HUD size)
function drawMatIconMini(target: Image, mat: number, x: number, y: number) {
    if (mat == MAT_DIRT) target.drawTransparentImage(miniDirt, x, y)
    else if (mat == MAT_STONE) target.drawTransparentImage(miniStone, x, y)
    else if (mat == MAT_WOOD) target.drawTransparentImage(miniWood, x, y)
    else if (mat == MAT_LEAVES) target.drawTransparentImage(miniLeaves, x, y)
    else target.drawTransparentImage(miniBone, x, y)
}

function selectedIconY(): number {
    if (selectedMat == MAT_DIRT) return 42
    else if (selectedMat == MAT_STONE) return 54
    else if (selectedMat == MAT_WOOD) return 66
    else if (selectedMat == MAT_LEAVES) return 78
    else if (selectedMat == MAT_BONE) return 90
    else return 102
}

function drawBlockyZombie(target: Image, x: number, y: number) {
    target.fillRect(x + 4, y, 8, 8, 7)
    target.fillRect(x + 2, y + 8, 12, 12, 6)
    target.fillRect(x, y + 10, 3, 8, 7)
    target.fillRect(x + 13, y + 10, 3, 8, 7)
    target.fillRect(x + 3, y + 20, 4, 8, 7)
    target.fillRect(x + 9, y + 20, 4, 8, 7)
    target.setPixel(x + 6, y + 3, 1)
    target.setPixel(x + 10, y + 3, 1)
}

function drawBlockyMiner(target: Image, x: number, y: number) {
    target.fillRect(x + 4, y, 8, 8, 14)
    target.fillRect(x + 3, y + 8, 10, 12, 9)
    target.fillRect(x, y + 10, 3, 8, 12)
    target.fillRect(x + 13, y + 10, 3, 8, 12)
    target.fillRect(x + 3, y + 20, 4, 8, 12)
    target.fillRect(x + 9, y + 20, 4, 8, 12)
    target.setPixel(x + 6, y + 3, 1)
    target.setPixel(x + 10, y + 3, 1)
}

function drawTitle(target: Image) {
    target.fillRect(0, 0, 160, 120, 9)
    target.fillRect(0, 72, 160, 48, 7)
    target.fillRect(0, 88, 160, 32, 4)
    target.fillRect(0, 102, 160, 18, 5)

    for (let x = 0; x < 160; x += 24) {
        target.fillRect(x + 8, 46, 8, 34, 14)
        target.fillRect(x, 34, 24, 18, 7)
        target.fillRect(x + 4, 24, 16, 18, 6)
    }

    target.fillRect(12, 5, 136, 42, 15)
    target.drawRect(12, 5, 136, 42, 1)
    target.print("MINEKRAFT", 52, 12, 1)
    target.print("by Luca", 62, 31, 1)

    drawBlockyMiner(target, 35, 58)
    drawBlockyZombie(target, 104, 58)

    target.fillRect(34, 86, 92, 30, 15)
    target.drawRect(34, 86, 92, 30, 1)

    if (titleChoice == 0) {
        target.print("> START", 55, 92, 1)
        target.print("  SETTINGS", 48, 104, 1)
    } else {
        target.print("  START", 55, 92, 1)
        target.print("> SETTINGS", 48, 104, 1)
    }
}

function drawInfinity(target: Image, x: number, y: number, colour: number) {
    target.drawCircle(x + 4, y + 4, 4, colour)
    target.drawCircle(x + 12, y + 4, 4, colour)
    target.setPixel(x + 8, y + 4, colour)
}

function drawOptions(target: Image) {
    target.fillRect(0, 0, 160, 120, 15)
    target.drawRect(10, 12, 140, 100, 1)
    target.print("SETTINGS", 56, 20, 1)

    let itemHeight = 18;
    let selectedY = optionChoice * itemHeight;

    // Smooth scrolling window calculator
    if (selectedY - menuScrollY > 40) menuScrollY = selectedY - 40;
    if (selectedY - menuScrollY < 0) menuScrollY = selectedY;

    menuView.fill(0)
    let y0 = 0 - menuScrollY;

    let labels = ["LEVELS", "HEALTH", "DEMO", "DIFFICULTY >>", "LOAD >>"];
    for (let i = 0; i < 5; i++) {
        let iy = y0 + i * itemHeight;
        if (iy > -itemHeight && iy < 60) {
            let col = (i >= 3) ? 5 : 1;
            if (optionChoice == i) menuView.print("> " + labels[i], 16, iy, col)
            else menuView.print("  " + labels[i], 16, iy, col)

            if (i == 0) {
                if (selectedLevels == INFINITY || demoMode) {
                    menuView.print("<", 84, iy, 1)
                    drawInfinity(menuView, 95, iy - 1, 1)
                    menuView.print(">", 118, iy, 1)
                } else {
                    menuView.print("< " + selectedLevels + " >", 84, iy, 1)
                }
            } else if (i == 1) {
                if (selectedHealth == INFINITY || demoMode) {
                    menuView.print("<", 84, iy, 1)
                    drawInfinity(menuView, 95, iy - 1, 1)
                    menuView.print(">", 118, iy, 1)
                } else {
                    menuView.print("< " + selectedHealth + " >", 84, iy, 1)
                }
            } else if (i == 2) {
                if (demoMode) menuView.print("< ON >", 84, iy, 1)
                else menuView.print("< OFF >", 84, iy, 1)
            }
        }
    }

    // Drawing clipped menu viewport prevents overlapping the bottom legend
    target.drawTransparentImage(menuView, 12, 38)
    target.print("A:SELECT B:BACK", 26, 102, 1)
}

function drawDifficultyMenu(target: Image) {
    target.fillRect(0, 0, 160, 120, 15)
    target.drawRect(10, 12, 140, 100, 1)
    target.print("DIFFICULTY", 42, 20, 1)

    let itemHeight = 24;
    let selectedY = difficultyChoice * itemHeight;

    // Smooth scrolling window calculator
    if (selectedY - menuScrollY > 40) menuScrollY = selectedY - 40;
    if (selectedY - menuScrollY < 0) menuScrollY = selectedY;

    menuView.fill(0)
    let y0 = 0 - menuScrollY;

    let labels = ["ZMB SPEED", "ZMB COUNT"];
    for (let i = 0; i < 2; i++) {
        let iy = y0 + i * itemHeight;
        if (iy > -itemHeight && iy < 60) {
            if (difficultyChoice == i) menuView.print("> " + labels[i], 16, iy, 1)
            else menuView.print("  " + labels[i], 16, iy, 1)

            if (i == 0) {
                menuView.print("< " + diffZombieSpeedLevel + " >", 84, iy, 1)
            } else if (i == 1) {
                let sign = diffZombieCountOffset >= 0 ? "+" : ""
                menuView.print("< " + sign + diffZombieCountOffset + " >", 84, iy, 1)
            }
        }
    }

    target.drawTransparentImage(menuView, 12, 38)
    target.print("L/R:ADJ B:BACK", 26, 102, 1)
}


function drawIntro(target: Image) {
    target.fillRect(0, 0, 160, 120, 15)

    if (selectedLevels == INFINITY) {
        target.print("LEVEL " + level, 54, 56, 1)
    } else {
        target.print("" + level + "-" + selectedLevels, 72, 56, 1)
    }
}

function drawResourceHud(target: Image) {
    let countText = "" + matCount()
    let w = 18 + countText.length * 6

    if (w < 28) w = 28
    if (w > 64) w = 64

    let x = 160 - w

    target.fillRect(x, 0, w, 12, 1)
    target.drawRect(x, 0, w, 12, 15)

    if (selectedMat != MAT_SAVE) {
        drawMatIconMini(target, selectedMat, x + 2, 2)
        target.print(countText, x + 12, 2, 15)
    }
}

function drawInventory(target: Image) {
    if (!inventoryOpen) return

    target.fillRect(16, 24, 128, 92, 1)
    target.drawRect(16, 24, 128, 92, 15)
    target.print("Inventory", 48, 28, 15)

    let itemHeight = 18;
    let selectedY = selectedMat * itemHeight;

    if (selectedY - menuScrollY > 40) menuScrollY = selectedY - 40;
    if (selectedY - menuScrollY < 0) menuScrollY = selectedY;

    menuView.fill(0)
    let y0 = 0 - menuScrollY;

    let labels = ["Dirt Wall: " + invDirt, "Spikes: " + invStone, "Wood: " + invWood, "Leaves: " + invLeaves, "Skeleton: " + invBones, "Save Game"];

    for (let i = 0; i < 6; i++) {
        let iy = y0 + i * itemHeight;
        if (iy > -itemHeight && iy < 60) {
            if (selectedMat == i) menuView.print(">", 4, iy + 4, 15)

            if (i != MAT_SAVE) {
                drawMatIcon(menuView, i, 16, iy)
                menuView.print(labels[i], 36, iy + 4, 15)
            } else {
                menuView.print(labels[i], 36, iy + 4, 15)
            }
        }
    }

    target.drawTransparentImage(menuView, 20, 42)
    target.print("A:select B:close", 20, 104, 15)
}

function drawSaving(target: Image) {
    target.fillRect(30, 30, 100, 60, 15)
    target.drawRect(30, 30, 100, 60, 1)
    target.print("SAVE GAME", 44, 38, 1)

    for (let i = 0; i < 3; i++) {
        let charX = 56 + i * 16
        let charY = 55
        target.print(saveChars.charAt(saveNameIndices[i]), charX, charY, 1)

        if (i == saveNamePos) {
            target.print("-", charX, charY + 10, 2)
            target.print("^", charX, charY - 10, 2)
        }
    }
    target.print("A:Next B:Back", 35, 75, 1)
}

function drawLoading(target: Image) {
    target.fillRect(0, 0, 160, 120, 15)
    target.print("LOAD GAME", 46, 10, 1)

    let itemHeight = 16;
    let selectedY = loadChoicePos * itemHeight;

    if (selectedY - menuScrollY > 40) menuScrollY = selectedY - 40;
    if (selectedY - menuScrollY < 0) menuScrollY = selectedY;

    menuView.fill(0)
    let y0 = 0 - menuScrollY;

    if (loadChoices.length == 0) {
        menuView.print("NO SAVES", 40, y0 + 20, 1)
    } else {
        for (let i = 0; i < loadChoices.length; i++) {
            let iy = y0 + i * itemHeight;
            if (iy > -itemHeight && iy < 60) {
                if (i == loadChoicePos) {
                    menuView.print("> " + loadChoices[i], 40, iy, 2)
                } else {
                    menuView.print("  " + loadChoices[i], 40, iy, 1)
                }
            }
        }
    }

    target.drawTransparentImage(menuView, 10, 32)
    target.print("A:Load  B:Cancel", 18, 105, 1)
}

function drawVictory(target: Image) {
    target.fillRect(0, 0, 160, 120, 9)

    for (let i = 0; i < 34; i++) {
        let x = (i * 23 + Math.floor(game.runtime() / 20)) % 160
        let y = (i * 17 + Math.floor(game.runtime() / 35)) % 120
        target.fillRect(x, y, 3, 3, 2 + i % 12)
    }

    target.fillRect(12, 14, 136, 56, 15)
    target.drawRect(12, 14, 136, 56, 1)
    target.print("MINEKRAFT", 52, 22, 1)
    target.print("GAME COMPLETE", 34, 38, 1)
    target.print("WELL DONE!", 48, 52, 1)

    drawBlockyMiner(target, 30, 76)
    drawBlockyZombie(target, 114, 76)

    target.fillRect(42, 78, 76, 31, 1)
    target.drawRect(42, 78, 76, 31, 15)
    target.print("© 2026", 55, 84, 15)
    target.print("Luca Kraev", 44, 96, 15)
}

function drawGameOver(target: Image) {
    target.fillRect(0, 0, 160, 120, 15)
    target.fillRect(12, 30, 136, 60, 1)
    target.drawRect(12, 30, 136, 60, 2)

    target.print("GAME OVER", 44, 45, 2)
    target.print("press A", 54, 70, 2)
}

function drawDemoPausedBanner(target: Image) {
    if (!isDemoActive() || !demoPaused) return

    target.fillRect(10, 44, 140, 32, 1)
    target.drawRect(10, 44, 140, 32, 15)
    target.print("PAUSED", 62, 50, 15)
    target.print("press A or B to resume", 18, 64, 15)
}


