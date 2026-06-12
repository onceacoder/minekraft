// --------------------------------------------------------------------------
// OBSTACLES MODULE
// Handles the dynamic logic, generation, and UI rendering for all obstacles.
// --------------------------------------------------------------------------

/**
 * Main per-frame update for dynamic obstacles.
 * Called from main.ts game.onUpdate()
 */
function updateObstacles() {
    if (gameState == TOLL_DIALOG) {
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
                showBanner("NOT ENOUGH RESOURCES")
            }
        }
        return
    }

    if (gameState != PLAYING || player == null) return

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

    // Freeze Mechanic (OBSTACLE_FREEZE):
    // The player's freezeMeter degrades over time. If they are within 4 tiles 
    // of a Campfire (using distance squared to avoid floating point `Math.sqrt`), 
    // the meter replenishes. We iterate backwards over the parallel campfire 
    // arrays to safely use `.splice()` without breaking the loop index.
    // Decay campfires globally
    for (let i = campfireCols.length - 1; i >= 0; i--) {
        campfireHealths[i] -= 1
        if (campfireHealths[i] <= 0) {
            // Fire died
            setTile(campfireCols[i], campfireRows[i], GRASS)
            campfireCols.splice(i, 1)
            campfireRows.splice(i, 1)
            campfireHealths.splice(i, 1)
        }
    }

    if (activeObstacle == OBSTACLE_FREEZE) {
        if (survivalTimer > 0) {
            survivalTimer -= 33
            if (survivalTimer <= 0) {
                setTile(goalCol, goalRow, DIAMOND)
                if (diamondMarker) diamondMarker.setFlag(SpriteFlag.Invisible, false)
                showBanner("SURVIVED THE NIGHT!")
                music.playTone(440, 500)
            }
        }

        let isWarm = false
        // Iterate over campfires to check distance
        for (let i = 0; i < campfireCols.length; i++) {
            let cc = campfireCols[i]
            let cr = campfireRows[i]
            let distSq = (player.x / 16 - cc) * (player.x / 16 - cc) + (player.y / 16 - cr) * (player.y / 16 - cr)
            if (distSq < 16) { // Within 4 tiles
                isWarm = true
            }
        }

        if (isWarm) {
            freezeMeter += 10
            if (freezeMeter > FREEZE_METER_MAX) freezeMeter = FREEZE_METER_MAX
        } else {
            freezeMeter -= 2
            if (freezeMeter <= 0) {
                freezeMeter = 0
                if (game.runtime() % 1000 < 33 && !invincible) {
                    info.changeLifeBy(-1)
                    player.startEffect(effects.ashes, 200)
                    music.playTone(150, 100)
                    invincible = true
                    // Hack to bypass setTimeout closure context issues in STS
                    control.runInParallel(function() {
                        pause(INVINCIBILITY_MS)
                        invincible = false
                    })
                }
            }
        }
    }
}

/**
 * Generates an impassable water hazard horizontally across the map.
 * This forces the player to either gather Wood to build bridges or
 * find another way around, demonstrating the core building mechanic.
 */
function generateRiver() {
    let ry = randint(20, 28)
    for (let rx = 1; rx < MAP_W - 1; rx++) {
        rawSetTile(rx, ry, WATER)
        rawSetTile(rx, ry + 1, WATER)
        if (randint(0, 100) < 50) rawSetTile(rx, ry + 2, WATER)
        if (randint(0, 100) < 30) rawSetTile(rx, ry - 1, WATER)
        
        ry += randint(-1, 1)
        if (ry < 15) ry = 15
        if (ry > 35) ry = 35
    }
}

/**
 * Places the obstacle-specific level structures (like Rivers, Dungeon Entrances,
 * and Toll Enclosures) onto the map during level generation.
 */
function generateObstacleFeatures(routeX: number) {
    // Build a decorative stone enclosure around the Diamond entrance (only if obstacles are enabled)
    if (activeObstacle != OBSTACLE_NONE) {
        for (let gx = routeX - 4; gx <= routeX + 4; gx++) {
            if (inBounds(gx, 40)) rawSetTile(gx, 40, STONE)
        }

        // Leave a 3-tile wide entrance hole in the enclosure
        rawSetTile(routeX, 40, GRASS)
        rawSetTile(routeX - 1, 40, GRASS)
        rawSetTile(routeX + 1, 40, GRASS)
    }

    if (activeObstacle == OBSTACLE_DUNGEON) {
        // Clear the stone enclosure and replace with an impassable dungeon wall
        for (let gx = routeX - 4; gx <= routeX + 4; gx++) {
            if (inBounds(gx, 40)) rawSetTile(gx, 40, GRASS)
        }
        for (let dwx = routeX - 2; dwx <= routeX + 2; dwx++) {
            for (let dwy = 42; dwy <= 46; dwy++) {
                if (dwx == routeX && dwy == 44) continue // Keep diamond
                if (inBounds(dwx, dwy)) rawSetTile(dwx, dwy, DUNGEON_WALL)
            }
        }
        // Place cave entrance
        rawSetTile(routeX, 41, CAVE_ENTRANCE)
    }

    // Apply dynamic obstacles (if selected)
    if (activeObstacle == OBSTACLE_RIVER) {
        generateRiver()
    }
}

// --------------------------------------------------------------------------
// UI Rendering Functions
// --------------------------------------------------------------------------

/**
 * Renders the top-right overlay UI for the current active obstacle.
 */
function renderObstacleUI(target: Image, w: number) {
    if (activeObstacle == OBSTACLE_SURVIVE) {
        target.fillRect(40, 0, 80, 12, 1)
        target.drawRect(40, 0, 80, 12, 15)
        let s = Math.ceil(survivalTimer / 1000)
        let ts = s < 10 ? "0" + s : "" + s
        let pfx = survivalPhase == 1 ? "PREP:" : "SURV:"
        target.print(pfx + " " + ts, 44, 2, 15)
    } else if (activeObstacle == OBSTACLE_TOLL) {
        let tollCurrent = 0
        if (tollMat == MAT_DIRT) tollCurrent = invDirt
        else if (tollMat == MAT_STONE) tollCurrent = invStone
        else if (tollMat == MAT_IRON) tollCurrent = invIron
        else if (tollMat == MAT_WOOD) tollCurrent = invWood
        else if (tollMat == MAT_GRASS) tollCurrent = invGrass
        else if (tollMat == MAT_BONE) tollCurrent = invBones

        let tollText = "TOLL:" + tollCurrent + "/" + tollAmount
        let tollW = tollText.length * 6 + 14
        target.fillRect(160 - tollW - w, 0, tollW, 12, 1)
        target.drawRect(160 - tollW - w, 0, tollW, 12, 15)
        drawMatIconMini(target, tollMat, 162 - tollW - w, 2)
        target.print(tollText, 172 - tollW - w, 2, 15)
    } else if (activeObstacle == OBSTACLE_DUNGEON) {
        let text = hasDungeonKey ? "[KEY]" : "NO KEY"
        let boxW = text.length * 6 + 4
        target.fillRect(160 - boxW - w, 0, boxW, 12, 1)
        target.drawRect(160 - boxW - w, 0, boxW, 12, 15)
        let color = hasDungeonKey ? 5 : 2 // 5 = yellow, 2 = red
        target.print(text, 162 - boxW - w, 2, color)
    }
}

function drawFreezeMeter(target: Image) {
    if (activeObstacle != OBSTACLE_FREEZE) return
    
    let w = 40
    let h = 4
    let x = 80 - w/2
    let y = 16
    
    // Outline
    target.drawRect(x - 1, y - 1, w + 2, h + 2, 1)
    target.fillRect(x, y, w, h, 15) // background (white or light grey)
    
    // Calculate fill
    let fill = Math.max(0, Math.min(w, Math.floor((freezeMeter / FREEZE_METER_MAX) * w)))
    if (fill > 0) {
        let col = 9 // Light Blue for freezing
        if (freezeMeter < 200) col = 2 // Red danger
        target.fillRect(x, y, fill, h, col)
    }
}

// Cached night overlay
let nightOverlay: Image = null
function drawNightOverlay(target: Image) {
    if (activeObstacle != OBSTACLE_FREEZE) return
    
    if (!nightOverlay) {
        nightOverlay = image.create(160, 120)
        for (let x = 0; x < 160; x++) {
            for (let y = 0; y < 120; y++) {
                // Checkerboard dither
                if ((x + y) % 2 == 0) {
                    nightOverlay.setPixel(x, y, 15) // black pixel
                }
            }
        }
    }
    
    // Draw the overlay
    target.drawTransparentImage(nightOverlay, 0, 0)
}
