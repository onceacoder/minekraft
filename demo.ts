// --------------------------------------------------------------------------
// Demo mode AI. Upgraded to natural 8-way diagonal steering.

// --------------------------------------------------------------------------
function isDemoActive(): boolean {
    return demoMode && gameState == PLAYING
}

let demoExploredCols: number[] = []
let demoExploredRows: number[] = []

function toggleDemoPause() {
    if (!isDemoActive()) return

    demoPaused = !demoPaused

    if (demoPaused) {
        stopPlayer()
        stopEnemies()
        demoHeldVx = 0
        demoHeldVy = 0
    } else {
        demoPauseUntil = 0
        demoRecoveryUntil = game.runtime() + 200
        demoMoveUntil = 0
        controller.moveSprite(player, 0, 0)
        demoExploredCols = []
        demoExploredRows = []
    }
}

function nearestZombieDistance(): number {
    if (player == null) return 9999
    let best = 9999
    let px = player.x
    let py = player.y

    for (let zombie of sprites.allOfKind(SpriteKind.Enemy)) {
        let d = Math.abs(zombie.x - px) + Math.abs(zombie.y - py)
        if (d < best) best = d
    }
    return best
}

function currentDemoCol(): number {
    if (player == null) return 0
    return Math.floor(player.x / TILE)
}

function currentDemoRow(): number {
    if (player == null) return 0
    return Math.floor(player.y / TILE)
}

function isWalkableForDemo(col: number, row: number): boolean {
    let id = getTileId(col, row)
    if (inDungeon) {
        return id == DUNGEON_FLOOR || id == KEY || id == KEY_HOLE
    }
    return id == GRASS || id == DIAMOND || id == BRICKS || id == STONE_BLOCK || id == TIMBER || id == HAY
}

function demoTileForPixel(px: number): number {
    return Math.floor(px / TILE)
}

function demoCanStep(vx: number, vy: number): boolean {
    if (player == null) return false

    let lookX = 0
    let lookY = 0

    if (vx > 0) lookX = 11
    else if (vx < 0) lookX = -11

    if (vy > 0) lookY = 11
    else if (vy < 0) lookY = -11

    let col = demoTileForPixel(player.x + lookX)
    let row = demoTileForPixel(player.y + lookY)

    return isWalkableForDemo(col, row)
}

function demoStop() {
    if (player == null) return
    player.vx = 0
    player.vy = 0
    demoHeldVx = 0
    demoHeldVy = 0
    demoMoveUntil = 0
}

function demoClampCol(col: number): number {
    if (col < 2) return 2
    if (col > MAP_W - 3) return MAP_W - 3
    return col
}

function demoClampRow(row: number): number {
    if (row < 2) return 2
    if (row > MAP_H - 3) return MAP_H - 3
    return row
}

function demoNearDiamond(): boolean {
    if (player == null) return false
    let dx = Math.abs(playerCol() - goalCol)
    let dy = Math.abs(playerRow() - goalRow)
    return dx <= 6 && dy <= 6
}

function demoCanAffordToll(): boolean {
    if (activeObstacle != OBSTACLE_TOLL) return true
    let current = 0
    if (tollMat == MAT_DIRT) current = invDirt
    else if (tollMat == MAT_STONE) current = invStone
    else if (tollMat == MAT_WOOD) current = invWood
    else if (tollMat == MAT_GRASS) current = invGrass
    else if (tollMat == MAT_BONE) current = invBones
    return current >= tollAmount
}

function demoIsTileTollMaterial(tid: number): boolean {
    if (activeObstacle != OBSTACLE_TOLL) return false
    if (tollMat == MAT_DIRT && tid == DIRT) return true
    if (tollMat == MAT_STONE && tid == STONE) return true
    if (tollMat == MAT_WOOD && tid == WOOD) return true
    if (tollMat == MAT_GRASS && tid == GRASS) return true
    if (tollMat == MAT_BONE && tid == BONE) return true
    return false
}

/**
 * Determines the overarching goal for the Demo AI.
 * -----------------------------------------------
 * The AI operates using a dynamic state machine that evaluates the current 
 * environment and obstacle constraints to pick a "Trajectory" (a macro-goal).
 * 
 * Priorities:
 * 1. If in a dungeon, seek the Key or Keyhole.
 * 2. If blocked by a Toll, scan the map to harvest the required material.
 * 3. If faced with a River or Freeze night, seek out Wood or Hay.
 * 4. Otherwise, randomly explore or seek the Diamond.
 */
function chooseDemoTrajectory() {
    if (player == null) return

    demoTrajectoryStartCol = currentDemoCol()
    demoTrajectoryStartRow = currentDemoRow()
    demoTrajectoryLen = randint(10, 20)

    let targetGoalCol = goalCol
    let targetGoalRow = goalRow
    let isSeekingMainGoal = demoNearDiamond() && demoCanAffordToll()

    if (inDungeon) {
        isSeekingMainGoal = true
        let foundCol = -1
        let foundRow = -1
        let targetId = hasDungeonKey ? KEY_HOLE : KEY
        for (let c = 0; c < MAP_W; c++) {
            for (let r = 0; r < MAP_H; r++) {
                if (getTileId(c, r) == targetId) {
                    foundCol = c
                    foundRow = r
                    break
                }
            }
            if (foundCol != -1) break
        }
        if (foundCol != -1) {
            targetGoalCol = foundCol
            targetGoalRow = foundRow
        }
    }

    if (isSeekingMainGoal) {
        demoSeekDiamond = true
        demoTrajectoryEndCol = targetGoalCol
        demoTrajectoryEndRow = targetGoalRow
        demoWaypointCol = targetGoalCol
        demoWaypointRow = targetGoalRow
        demoWaypointUntil = game.runtime() + 4500
        demoTrajectoryUntil = demoWaypointUntil
        demoMoveUntil = 0
        return
    }

    if (!inDungeon && activeObstacle == OBSTACLE_TOLL && !demoCanAffordToll()) {
        let bestDist = 9999
        let bestCol = -1
        let bestRow = -1
        for (let r = 2; r < MAP_H - 2; r++) {
            for (let c = 2; c < MAP_W - 2; c++) {
                if (demoIsTileTollMaterial(getTileId(c, r))) {
                    let d = Math.abs(c - demoTrajectoryStartCol) + Math.abs(r - demoTrajectoryStartRow)
                    if (d < bestDist) {
                        bestDist = d
                        bestCol = c
                        bestRow = r
                    }
                }
            }
        }
        if (bestCol != -1) {
            demoTrajectoryEndCol = bestCol
            demoTrajectoryEndRow = bestRow
            demoWaypointCol = bestCol
            demoWaypointRow = bestRow
            demoWaypointUntil = game.runtime() + randint(4500, 8500)
            demoTrajectoryUntil = demoWaypointUntil
            demoMoveUntil = 0
            demoReverseCount = 0
            return
        }
    }

    let dx = randint(-1, 1)
    let dy = randint(-1, 1)

    if (dx == 0 && dy == 0) dx = 1

    // Dynamic Resource Harvesting:
    // If the AI detects it lacks materials needed for the current obstacle 
    // (e.g., Wood for bridges, Wood/Hay for campfires, Iron/Bone for combat),
    // it rolls a 30% chance to suspend standard exploration and seek the 
    // nearest required resource tile instead.
    let needsBridgeWood = (!inDungeon && activeObstacle == OBSTACLE_RIVER && invWood == 0)
    let needsCampfireWood = (!inDungeon && activeObstacle == OBSTACLE_FREEZE && invWood == 0)
    let needsCampfireGrass = (!inDungeon && activeObstacle == OBSTACLE_FREEZE && invWood > 0 && invGrass == 0)
    
    if ((needsBridgeWood || needsCampfireWood || needsCampfireGrass || (!inDungeon && (invIron == 0 || invBones == 0))) && randint(0, 100) < 30) {
        let targetId = needsCampfireGrass ? TALL_GRASS : (needsBridgeWood || needsCampfireWood) ? WOOD : (invBones == 0 ? BONE : IRON_ORE)
        let bestDist = 9999
        let bestCol = -1
        let bestRow = -1
        for (let r = 2; r < MAP_H - 2; r++) {
            for (let c = 2; c < MAP_W - 2; c++) {
                if (getTileId(c, r) == targetId) {
                    let d = Math.abs(c - demoTrajectoryStartCol) + Math.abs(r - demoTrajectoryStartRow)
                    if (d < bestDist) {
                        bestDist = d
                        bestCol = c
                        bestRow = r
                    }
                }
            }
        }
        if (bestCol != -1) {
            demoTrajectoryEndCol = bestCol
            demoTrajectoryEndRow = bestRow
            demoWaypointCol = bestCol
            demoWaypointRow = bestRow
            demoWaypointUntil = game.runtime() + randint(4500, 8500)
            demoTrajectoryUntil = demoWaypointUntil
            demoMoveUntil = 0
            demoReverseCount = 0
            return
        }
    }

    if (demoSeekDiamond || randint(0, 100) < 30) {
        let gx = targetGoalCol - demoTrajectoryStartCol
        let gy = targetGoalRow - demoTrajectoryStartRow

        if (Math.abs(gx) > 3) {
            if (gx > 0) dx = 1
            else dx = -1
        }

        if (Math.abs(gy) > 3) {
            if (gy > 0) dy = 1
            else dy = -1
        }
    }

    // Evaluate multiple random trajectories and pick the one furthest from recently explored areas to avoid dead ends
    let bestEndCol = demoClampCol(demoTrajectoryStartCol + dx * demoTrajectoryLen)
    let bestEndRow = demoClampRow(demoTrajectoryStartRow + dy * demoTrajectoryLen)
    
    if (inDungeon) {
        let bestExploredDist = -1
        for(let t = 0; t < 5; t++) {
            let tdx = randint(-1, 1)
            let tdy = randint(-1, 1)
            if (tdx == 0 && tdy == 0) tdx = 1
            let testCol = demoClampCol(demoTrajectoryStartCol + tdx * demoTrajectoryLen)
            let testRow = demoClampRow(demoTrajectoryStartRow + tdy * demoTrajectoryLen)
            
            let penalty = 0
            for(let i = 0; i < demoExploredCols.length; i++) {
                let dist = Math.abs(demoExploredCols[i] - testCol) + Math.abs(demoExploredRows[i] - testRow)
                if (dist < 10) penalty += (10 - dist)
            }
            
            if (bestExploredDist == -1 || penalty < bestExploredDist) {
                bestExploredDist = penalty
                bestEndCol = testCol
                bestEndRow = testRow
            }
        }
    }

    let endCol = bestEndCol
    let endRow = bestEndRow

    let found = false
    for (let radius = 0; radius <= 5; radius++) {
        for (let attempt = 0; attempt < 8; attempt++) {
            let col = demoClampCol(endCol + randint(0 - radius, radius))
            let row = demoClampRow(endRow + randint(0 - radius, radius))

            if (isWalkableForDemo(col, row)) {
                demoTrajectoryEndCol = col
                demoTrajectoryEndRow = row
                found = true
                break
            }
        }
        if (found) break
    }

    if (!found) {
        demoTrajectoryEndCol = targetGoalCol
        demoTrajectoryEndRow = targetGoalRow
    }

    demoWaypointCol = demoTrajectoryEndCol
    demoWaypointRow = demoTrajectoryEndRow
    demoWaypointUntil = game.runtime() + randint(4500, 8500)
    demoTrajectoryUntil = demoWaypointUntil
    demoMoveUntil = 0
    demoReverseCount = 0
}

function demoStopAndReroute() {
    demoStop()
    demoStuckCount += 1

    if (game.runtime() > demoRerouteCooldown || demoStuckCount > 2) {
        chooseDemoTrajectory()
        demoRerouteCooldown = game.runtime() + 900
        demoStuckCount = 0
    }
    demoActionCooldown = game.runtime() + 350
}

function setDemoTargetTowards(col: number, row: number) {
    if (player == null) return

    let tx = col * TILE + 8
    let ty = row * TILE + 8
    let dx = tx - player.x
    let dy = ty - player.y

    let fdx = 0
    let fdy = 0

    if (dx > 6) fdx = 1
    else if (dx < -6) fdx = -1

    if (dy > 6) fdy = 1
    else if (dy < -6) fdy = -1

    if (fdx == 0 && fdy == 0) fdx = 1

    facingDx = fdx
    facingDy = fdy
}

function setDemoTargetTowardsDiamond() {
    let targetGoalCol = goalCol
    let targetGoalRow = goalRow

    if (inDungeon) {
        let foundCol = -1
        let foundRow = -1
        let targetId = hasDungeonKey ? KEY_HOLE : KEY
        for (let c = 0; c < MAP_W; c++) {
            for (let r = 0; r < MAP_H; r++) {
                if (getTileId(c, r) == targetId) {
                    foundCol = c
                    foundRow = r
                    break
                }
            }
            if (foundCol != -1) break
        }
        if (foundCol != -1) {
            targetGoalCol = foundCol
            targetGoalRow = foundRow
        }
    }
    setDemoTargetTowards(targetGoalCol, targetGoalRow)
}

function demoMaybePause() {
    if (game.runtime() < demoPauseUntil) return

    // Reduced pause probability to simulate natural human hesitation
    if (randint(0, 1000) < 3) {
        demoPauseUntil = game.runtime() + randint(200, 600)
        stopPlayer()
        stopEnemies()
        demoHeldVx = 0
        demoHeldVy = 0
        demoMoveUntil = 0
    }
}

function demoTryHarvestNearby(): boolean {
    if (player == null) return false
    if (game.runtime() < demoHarvestCooldown) return false
    if (randint(0, 100) > 48) return false

    let needToll = activeObstacle == OBSTACLE_TOLL && !demoCanAffordToll()

    for (let i = 0; i < 9; i++) {
        let dx = randint(-1, 1)
        let dy = randint(-1, 1)

        if (dx != 0 || dy != 0) {
            let col = playerCol() + dx
            let row = playerRow() + dy
            let tid = getTileId(col, row)

            if (isHarvestable(tid)) {
                if (needToll && !demoIsTileTollMaterial(tid)) {
                    continue // Skip harvesting non-toll materials if we specifically need a toll
                }

                facingDx = dx
                facingDy = dy
                performTargetAction()
                demoHarvestCooldown = game.runtime() + randint(700, 1500)
                demoMoveUntil = 0
                return true
            }
        }
    }
    return false
}

function demoHarvestBlocker(vx: number, vy: number): boolean {
    if (player == null) return false
    if (game.runtime() < demoHarvestCooldown) return false

    let dx = 0
    let dy = 0

    if (vx > 0) dx = 1
    else if (vx < 0) dx = -1

    if (vy > 0) dy = 1
    else if (vy < 0) dy = -1

    if (dx == 0 && dy == 0) return false

    let col = playerCol() + dx
    let row = playerRow() + dy

    if (isHarvestable(getTileId(col, row))) {
        facingDx = dx
        facingDy = dy
        performTargetAction()
        demoHarvestCooldown = game.runtime() + randint(800, 1600)
        demoActionCooldown = game.runtime() + 500
        demoMoveUntil = 0
        demoStuckCount = 0
        return true
    }
    return false
}

function demoSelectBridgeMaterial(): boolean {
    if (invWood > 0) { selectedMat = MAT_WOOD; return true; }
    return false
}

function demoSelectRandomMaterialWithStock(): boolean {
    for (let attempt = 0; attempt < 8; attempt++) {
        selectedMat = randint(MAT_DIRT, MAT_GRASS)
        if (matCount() > 0) return true
    }
    if (invDirt > 0) { selectedMat = MAT_DIRT; return true; }
    if (invStone > 0) { selectedMat = MAT_STONE; return true; }
    if (invWood > 0) { selectedMat = MAT_WOOD; return true; }
    if (invGrass > 0) { selectedMat = MAT_GRASS; return true; }
    return false
}

function demoTryBuildCampfire(): boolean {
    if (activeObstacle != OBSTACLE_FREEZE) return false
    if (game.runtime() < demoBuildCooldown) return false
    if (freezeMeter > 1000) return false // Not freezing yet
    
    if (invWood > 0 && invGrass > 0) {
        // Find a safe spot to build Timber
        for (let attempt = 0; attempt < 8; attempt++) {
            let dx = randint(-1, 1)
            let dy = randint(-1, 1)
            if (dx != 0 || dy != 0) {
                let col = playerCol() + dx
                let row = playerRow() + dy
                if (getTileId(col, row) == GRASS) {
                    facingDx = dx
                    facingDy = dy
                    // 1. Build Timber
                    selectedMat = MAT_WOOD
                    performTargetAction()
                    
                    // 2. Ignite Campfire with Grass
                    selectedMat = MAT_GRASS
                    performTargetAction()
                    
                    demoBuildCooldown = game.runtime() + 4000
                    
                    // Stop moving to warm up
                    demoStop()
                    demoMoveUntil = game.runtime() + 2000
                    return true
                }
            }
        }
    }
    return false
}

function demoTryBuildRandomly(): boolean {
    if (demoTryBuildCampfire()) return true
    if (player == null) return false
    if (game.runtime() < demoBuildCooldown) return false
    if (nearestZombieDistance() > 42 && randint(0, 100) > 20) return false
    if (!demoSelectRandomMaterialWithStock()) return false

    for (let attempt = 0; attempt < 8; attempt++) {
        let dx = randint(-1, 1)
        let dy = randint(-1, 1)

        if (dx != 0 || dy != 0) {
            let col = playerCol() + dx
            let row = playerRow() + dy

            if (getTileId(col, row) == GRASS) {
                facingDx = dx
                facingDy = dy
                performTargetAction()
                demoBuildCooldown = game.runtime() + randint(1100, 2200)
                demoMoveUntil = 0
                return true
            }
        }
    }
    return false
}

function demoSetFacingFromVelocity() {
    if (player == null) return

    if (Math.abs(player.vx) > Math.abs(player.vy)) {
        if (player.vx > 0) {
            facingDx = 1
            facingDy = 0
        } else if (player.vx < 0) {
            facingDx = -1
            facingDy = 0
        }
    } else {
        if (player.vy > 0) {
            facingDx = 0
            facingDy = 1
        } else if (player.vy < 0) {
            facingDx = 0
            facingDy = -1
        }
    }
}

function demoStartEscape() {
    if (player == null) return

    demoStop()
    demoNoProgressCount = 0
    demoReverseCount = 0

    let vertical = randint(0, 1)
    if (vertical == 0) {
        if (randint(0, 1) == 0) demoEscapeVy = DEMO_SPEED
        else demoEscapeVy = 0 - DEMO_SPEED
        demoEscapeVx = 0
    } else {
        if (randint(0, 1) == 0) demoEscapeVx = DEMO_DIAGONAL_SPEED
        else demoEscapeVx = 0 - DEMO_DIAGONAL_SPEED

        if (randint(0, 1) == 0) demoEscapeVy = DEMO_DIAGONAL_SPEED
        else demoEscapeVy = 0 - DEMO_DIAGONAL_SPEED
    }

    if (!demoCanStep(demoEscapeVx, demoEscapeVy)) {
        if (demoCanStep(0, DEMO_SPEED)) {
            demoEscapeVx = 0
            demoEscapeVy = DEMO_SPEED
        } else if (demoCanStep(0, 0 - DEMO_SPEED)) {
            demoEscapeVx = 0
            demoEscapeVy = 0 - DEMO_SPEED
        } else if (demoCanStep(DEMO_SPEED, 0)) {
            demoEscapeVx = DEMO_SPEED
            demoEscapeVy = 0
        } else if (demoCanStep(0 - DEMO_SPEED, 0)) {
            demoEscapeVx = 0 - DEMO_SPEED
            demoEscapeVy = 0
        } else {
            demoEscapeVx = 0
            demoEscapeVy = 0
        }
    }

    demoEscapeUntil = game.runtime() + randint(700, 1300)
    demoRerouteCooldown = game.runtime() + 900
    chooseDemoTrajectory()
}

function demoCheckProgress() {
    if (player == null) return

    if (game.runtime() < demoLastPosCheck) return

    let col = currentDemoCol()
    let row = currentDemoRow()

    if (col == demoLastCol && row == demoLastRow) {
        demoNoProgressCount += 1
    } else {
        demoNoProgressCount = 0
        demoLastCol = col
        demoLastRow = row
        
        // Track exploration in dungeons
        if (inDungeon) {
            demoExploredCols.push(col)
            demoExploredRows.push(row)
            if (demoExploredCols.length > 20) {
                demoExploredCols.shift()
                demoExploredRows.shift()
            }
        }
    }

    demoLastPosCheck = game.runtime() + 650

    if (demoNoProgressCount >= 3) {
        demoStartEscape()
    }
}

function demoTrackMovementIntent(vx: number, vy: number) {
    let sx = getSign(vx)
    let sy = getSign(vy)

    if (sx != 0 && demoLastMoveX != 0 && sx == 0 - demoLastMoveX && sy == demoLastMoveY) {
        demoReverseCount += 1
    } else if (sx != 0 || sy != 0) {
        if (demoReverseCount > 0) demoReverseCount += -1
    }

    if (sx != 0) demoLastMoveX = sx
    if (sy != 0) demoLastMoveY = sy

    if (demoReverseCount >= 3) {
        demoStartEscape()
    }
}

function demoRunEscape(): boolean {
    if (player == null) return false

    if (game.runtime() >= demoEscapeUntil) return false

    if (demoEscapeVx == 0 && demoEscapeVy == 0) {
        demoStartEscape()
    }

    if (demoCanStep(demoEscapeVx, demoEscapeVy)) {
        player.vx = demoEscapeVx
        player.vy = demoEscapeVy
        demoSetFacingFromVelocity()
    } else {
        demoStartEscape()
    }

    return true
}

function demoApplySafeVelocity(vx: number, vy: number) {
    if (player == null) return

    let finalVx = vx
    let finalVy = vy

    if (finalVx == 0 && finalVy == 0) {
        demoStop()
        return
    }

    if (demoCanStep(finalVx, finalVy)) {
        player.vx = finalVx
        player.vy = finalVy
    } else if (finalVx != 0 && demoCanStep(finalVx, 0)) {
        player.vx = finalVx
        player.vy = 0
    } else if (finalVy != 0 && demoCanStep(0, finalVy)) {
        player.vx = 0
        player.vy = finalVy
    } else {
        let didAction = false
        // Try bridge building if blocked by water
        if (activeObstacle == OBSTACLE_RIVER && game.runtime() > demoActionCooldown) {
            let testCol = playerCol() + (finalVx > 0 ? 1 : (finalVx < 0 ? -1 : 0))
            let testRow = playerRow() + (finalVy > 0 ? 1 : (finalVy < 0 ? -1 : 0))
            if (getTileId(testCol, testRow) == WATER && demoSelectBridgeMaterial()) {
                facingDx = testCol - playerCol()
                facingDy = testRow - playerRow()
                performTargetAction()
                demoActionCooldown = game.runtime() + 600
                demoMoveUntil = 0
                demoStuckCount = 0
                didAction = true
            }
        }

        if (!didAction && !demoHarvestBlocker(finalVx, finalVy)) {
            demoStartEscape()
            return
        }
    }

    demoTrackMovementIntent(player.vx, player.vy)
    demoHeldVx = player.vx
    demoHeldVy = player.vy
    demoMoveUntil = game.runtime() + randint(520, 900)
    demoSetFacingFromVelocity()
}

function demoComputeVelocityTowards(col: number, row: number) {
    if (player == null) return

    let tx = col * TILE + 8
    let ty = row * TILE + 8
    let dxTarget = tx - player.x
    let dyTarget = ty - player.y
    let vx = 0
    let vy = 0

    let nearestDx = 0
    let nearestDy = 0
    let nearest = 9999
    let px = player.x
    let py = player.y

    for (let zombie of sprites.allOfKind(SpriteKind.Enemy)) {
        let dxz = px - zombie.x
        let dyz = py - zombie.y
        let dz = Math.abs(dxz) + Math.abs(dyz)

        if (dz < nearest) {
            nearest = dz
            nearestDx = dxz
            nearestDy = dyz
        }
    }

    if (nearest < 48) {
        // Combat!
        if (inDungeon) {
            // Zelda combat: face the zombie and attack
            let fdx = nearestDx > 0 ? -1 : (nearestDx < 0 ? 1 : 0)
            let fdy = nearestDy > 0 ? -1 : (nearestDy < 0 ? 1 : 0)
            if (fdx != 0 || fdy != 0) {
                facingDx = fdx
                facingDy = fdy
                if (game.runtime() > demoActionCooldown) {
                    performTargetAction()
                    demoActionCooldown = game.runtime() + 300
                }
            }
        } else {
            // Overworld combat: deploy spikes or skeletons if possible, then run
            if (game.runtime() > demoActionCooldown) {
                if (invBones > 0) {
                    selectedMat = MAT_BONE
                    facingDx = nearestDx > 0 ? 1 : (nearestDx < 0 ? -1 : 0)
                    facingDy = nearestDy > 0 ? 1 : (nearestDy < 0 ? -1 : 0)
                    performTargetAction()
                    demoActionCooldown = game.runtime() + 1000
                } else if (invIron > 0) {
                    selectedMat = MAT_IRON
                    facingDx = nearestDx > 0 ? 1 : (nearestDx < 0 ? -1 : 0)
                    facingDy = nearestDy > 0 ? 1 : (nearestDy < 0 ? -1 : 0)
                    performTargetAction()
                    demoActionCooldown = game.runtime() + 1000
                }
            }
        }
        
        // Evade
        if (nearestDx > 0) vx = DEMO_SPEED
        else if (nearestDx < 0) vx = 0 - DEMO_SPEED

        if (nearestDy > 0) vy = DEMO_SPEED
        else if (nearestDy < 0) vy = 0 - DEMO_SPEED
    } else {
        if (dxTarget > 6) vx = DEMO_SPEED
        else if (dxTarget < -6) vx = 0 - DEMO_SPEED

        if (dyTarget > 6) vy = DEMO_SPEED
        else if (dyTarget < -6) vy = 0 - DEMO_SPEED
    }

    if (vx != 0 && vy != 0) {
        vx = getSign(vx) * DEMO_DIAGONAL_SPEED
        vy = getSign(vy) * DEMO_DIAGONAL_SPEED
    }

    demoApplySafeVelocity(vx, vy)
}

function demoMoveTowards(col: number, row: number) {
    if (player == null) return

    if (demoRunEscape()) return

    if (game.runtime() < demoMoveUntil && demoCanStep(demoHeldVx, demoHeldVy)) {
        player.vx = demoHeldVx
        player.vy = demoHeldVy
        demoSetFacingFromVelocity()
        return
    }

    demoComputeVelocityTowards(col, row)
}

function demoMovePlayer() {
    if (player == null) return

    if (demoSeekDiamond && game.runtime() > demoTrajectoryUntil) {
        let targetGoalCol = goalCol
        let targetGoalRow = goalRow

        if (inDungeon) {
            let foundCol = -1
            let foundRow = -1
            let targetId = hasDungeonKey ? KEY_HOLE : KEY
            for (let c = 0; c < MAP_W; c++) {
                for (let r = 0; r < MAP_H; r++) {
                    if (getTileId(c, r) == targetId) {
                        foundCol = c
                        foundRow = r
                        break
                    }
                }
                if (foundCol != -1) break
            }
            if (foundCol != -1) {
                targetGoalCol = foundCol
                targetGoalRow = foundRow
            }
        }
        demoTrajectoryEndCol = targetGoalCol
        demoTrajectoryEndRow = targetGoalRow
    }

    let reachedTrajectoryEnd = Math.abs(currentDemoCol() - demoTrajectoryEndCol) <= 1 && Math.abs(currentDemoRow() - demoTrajectoryEndRow) <= 1

    if (reachedTrajectoryEnd || game.runtime() > demoTrajectoryUntil || !isWalkableForDemo(demoTrajectoryEndCol, demoTrajectoryEndRow)) {
        if (game.runtime() > demoRerouteCooldown) {
            chooseDemoTrajectory()
            demoRerouteCooldown = game.runtime() + 900
            demoMoveUntil = 0
        }
    }

    demoMoveTowards(demoTrajectoryEndCol, demoTrajectoryEndRow)
}

function demoChooseBehaviour() {
    if (game.runtime() < demoStateUntil) return

    if (game.runtime() - demoStartedAt > 22000 || randint(0, 1000) < 5) {
        if (demoCanAffordToll()) {
            demoSeekDiamond = true
            demoModeState = 3
        } else {
            demoModeState = randint(0, 2)
            demoSeekDiamond = false
        }
    } else {
        demoModeState = randint(0, 2)
        demoSeekDiamond = false
    }

    chooseDemoTrajectory()
    demoStateUntil = game.runtime() + randint(4500, 9000)
}

function updateDemoMode() {
    if (!isDemoActive()) return

    if (demoPaused) {
        stopPlayer()
        stopEnemies()
        demoHeldVx = 0
        demoHeldVy = 0
        return
    }

    if (game.runtime() < demoRecoveryUntil) {
        stopPlayer()
        demoHeldVx = 0
        demoHeldVy = 0
        demoMoveUntil = 0
        return
    }

    if (game.runtime() < demoPauseUntil) {
        stopPlayer()
        stopEnemies()
        demoHeldVx = 0
        demoHeldVy = 0
        demoMoveUntil = 0
        return
    }

    if (demoTrajectoryEndCol == 0 && demoTrajectoryEndRow == 0) {
        chooseDemoTrajectory()
    }

    if (demoNearDiamond() && !demoSeekDiamond) {
        demoSeekDiamond = true
        demoTrajectoryEndCol = goalCol
        demoTrajectoryEndRow = goalRow
        demoWaypointCol = goalCol
        demoWaypointRow = goalRow
        demoMoveUntil = 0
    }

    demoMaybePause()
    demoChooseBehaviour()

    if (game.runtime() < demoActionCooldown) {
        demoMovePlayer()
        return
    }

    if (demoSeekDiamond) {
        setDemoTargetTowardsDiamond()
    } else {
        setDemoTargetTowards(demoTrajectoryEndCol, demoTrajectoryEndRow)
    }

    if (demoModeState == 2 && demoTryBuildRandomly()) {
        demoActionCooldown = game.runtime() + randint(600, 1000)
        return
    }

    if ((demoModeState == 1 || randint(0, 100) < 35) && demoTryHarvestNearby()) {
        demoActionCooldown = game.runtime() + randint(600, 1000)
        return
    }

    if (demoTryBuildRandomly()) {
        demoActionCooldown = game.runtime() + randint(700, 1100)
        return
    }

    demoMovePlayer()
}


