// --------------------------------------------------------------------------
function getZombieSpeed(): number {
    return 15 + (diffZombieSpeedLevel - 1) * 10
}

// Memory-safe Zombie Array Tracking

// --------------------------------------------------------------------------
function zombieIndex(zombie: Sprite): number {
    for (let i = 0; i < zombieRefs.length; i++) {
        if (zombieRefs[i] == zombie) return i
    }
    return -1
}

function rememberZombie(zombie: Sprite) {
    zombieRefs.push(zombie)
    zombieModes.push(-1)
}

/** Wipes the zombie cleanly out of our tracking variables to prevent memory leaks */
function forgetZombie(zombie: Sprite) {
    let idx = zombieIndex(zombie)
    if (idx >= 0) {
        zombieRefs.splice(idx, 1)
        zombieModes.splice(idx, 1)
    }
    stopCoreAnimation(zombie)
}

function setZombieMode(zombie: Sprite, mode: number) {
    if (zombie == null || player == null) return

    let idx = zombieIndex(zombie)
    if (idx < 0) {
        rememberZombie(zombie)
        idx = zombieRefs.length - 1
    }

    if (zombieModes[idx] == mode) return
    zombieModes[idx] = mode

    stopCoreAnimation(zombie)

    // Target Selection:
    // Zombies default to attacking the player. However, we iterate over the 
    // `scarecrowRefs` array. If a Scarecrow is closer (using Manhattan distance 
    // for performance), the zombie will re-aggro onto the Scarecrow instead.
    let targetSprite = player
    let bestDist = Math.abs(player.x - zombie.x) + Math.abs(player.y - zombie.y)
    
    for (let i = 0; i < scarecrowRefs.length; i++) {
        let sc = scarecrowRefs[i]
        let dist = Math.abs(sc.x - zombie.x) + Math.abs(sc.y - zombie.y)
        if (dist < bestDist) {
            bestDist = dist
            targetSprite = sc
        }
    }

    if (mode == 0) {
        zombie.follow(targetSprite, getZombieSpeed())
        playCoreAnimation(zombie, [zWalk1, zIdle, zWalk2, zIdle], 150, true)
    } else if (mode == 1) {
        zombie.follow(targetSprite, getZombieSpeed() + 10)
        playCoreAnimation(zombie, [zAttack, zIdle], 120, true)
    } else if (mode == 2) {
        zombie.follow(null, 0)
        let closestCampfireDist = 9999
        let closestCampfireX = -1
        let closestCampfireY = -1
        let zc = Math.floor(zombie.x / TILE)
        let zr = Math.floor(zombie.y / TILE)
        for (let c = 0; c < campfireCols.length; c++) {
            let cx = campfireCols[c]
            let cy = campfireRows[c]
            let dist = Math.abs(zc - cx) + Math.abs(zr - cy)
            if (dist < closestCampfireDist) {
                closestCampfireDist = dist
                closestCampfireX = cx * TILE + 8
                closestCampfireY = cy * TILE + 8
            }
        }
        if (closestCampfireX >= 0) {
            let dx = zombie.x - closestCampfireX
            let dy = zombie.y - closestCampfireY
            let len = Math.sqrt(dx * dx + dy * dy)
            if (len == 0) { dx = 1; len = 1; }
            let speed = getZombieSpeed() + 10
            zombie.vx = (dx / len) * speed
            zombie.vy = (dy / len) * speed
        }
        playCoreAnimation(zombie, [zWalk1, zIdle, zWalk2, zIdle], 100, true)
    } else {
        zombie.follow(null, 0)
        zombie.vx = 0
        zombie.vy = 0
        zombie.setImage(zIdle)
    }
}

// Memory-safe Skeleton Tracking & Dijkstra

// --------------------------------------------------------------------------
function skeletonIndex(skel: Sprite): number {
    for (let i = 0; i < skeletonRefs.length; i++) {
        if (skeletonRefs[i] == skel) return i
    }
    return -1
}

function forgetSkeleton(skel: Sprite) {
    let idx = skeletonIndex(skel)
    if (idx >= 0) {
        skeletonRefs.splice(idx, 1)
        skeletonTargets.splice(idx, 1)
    }
    stopCoreAnimation(skel)
}

function getGridDist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2)
}

function updateSkeletonTargeting() {
    let zombies = zombieRefs
    if (zombies.length == 0) {
        for (let i = 0; i < skeletonRefs.length; i++) {
            skeletonTargets[i] = null
            skeletonRefs[i].vx = 0
            skeletonRefs[i].vy = 0
            playCoreAnimation(skeletonRefs[i], [sIdle], 150, true)
        }
        return
    }

    let targeted: Sprite[] = []
    for (let i = skeletonRefs.length - 1; i >= 0; i--) {
        let skel = skeletonRefs[i]
        let bestTarget: Sprite = null
        let bestDist = 9999
        let bestUntargeted: Sprite = null
        let bestUntargetedDist = 9999

        for (let j = 0; j < zombies.length; j++) {
            let z = zombies[j]
            let dist = getGridDist(skel.x, skel.y, z.x, z.y)
            let alreadyTargeted = skeletonTargets.indexOf(z) >= 0

            if (dist < bestDist) {
                bestDist = dist
                bestTarget = z
            }
            if (!alreadyTargeted && dist < bestUntargetedDist) {
                bestUntargetedDist = dist
                bestUntargeted = z
            }
        }

        let chosenTarget = bestUntargeted || bestTarget
        skeletonTargets[i] = chosenTarget

        if (chosenTarget && bestDist < 120) {
            skel.follow(chosenTarget, 25)
            playCoreAnimation(skel, [sWalk1, sIdle, sWalk2, sIdle], 120, true)
        } else {
            skel.follow(null)
            skel.vx = 0
            skel.vy = 0
            playCoreAnimation(skel, [sIdle], 150, true)
        }
    }
}

// Memory-safe Scarecrow Tracking & Spawning
// --------------------------------------------------------------------------
let scIdle: Image = img`
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . 4 4 4 4 . . . . . .
    . . . . . . f 4 4 f . . . . . .
    . . . . . . 4 f f 4 . . . . . .
    . . . . . . 4 4 4 4 . . . . . .
    . . . . . 5 5 5 5 5 5 . . . . .
    . . . 4 4 4 4 4 4 4 4 4 4 . . .
    . . . 4 4 4 4 4 4 4 4 4 4 . . .
    . . . . . 5 5 5 5 5 5 . . . . .
    . . . . . 5 5 5 5 5 5 . . . . .
    . . . . . . . e e . . . . . . .
    . . . . . . . e e . . . . . . .
    . . . . . . . e e . . . . . . .
    . . . . . . . e e . . . . . . .
    . . . . . . . e e . . . . . . .
`

let scWalk: Image = img`
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . 4 4 4 4 . . . . . .
    . . . . . . f 4 4 f . . . . . .
    . . . . . . 4 f f 4 . . . . . .
    . . . . . . 4 4 4 4 . . . . . .
    . . . . . 5 5 5 5 5 5 . . . . .
    . . . 4 4 4 4 4 4 4 4 4 4 . . .
    . . . 4 4 4 4 4 4 4 4 4 4 . . .
    . . . . . 5 5 5 5 5 5 . . . . .
    . . . . . 5 5 5 5 5 5 . . . . .
    . . . . . . e . . . . . . . . .
    . . . . . . e . . . . . . . . .
    . . . . . . . e . . . . . . . .
    . . . . . . . . e . . . . . . .
    . . . . . . . . . e . . . . . .
`

function initScarecrowImages() {
    // Images are statically initialized
}

function spawnScarecrow(col: number, row: number) {
    if (scarecrowRefs.length >= 2) {
        music.playTone(131, 40)
        showBanner("MAX SCARECROWS")
        return // Max 2
    }
    
    initScarecrowImages()
    
    let sc = sprites.create(scIdle, SpriteKind.Scarecrow)
    sc.setPosition(col * TILE + 8, row * TILE + 8)
    sc.z = 15
    scarecrowRefs.push(sc)
    
    // Scarecrows wander extremely slowly
    sc.vx = (Math.percentChance(50) ? 1 : -1) * randint(2, 5)
    sc.vy = (Math.percentChance(50) ? 1 : -1) * randint(2, 5)
    sc.setBounceOnWall(true)
    
    playCoreAnimation(sc, [scIdle, scWalk, scIdle, scWalk], 400, true)
    
    music.playTone(262, 50)
    music.playTone(330, 50)
}

function updateScarecrowWandering() {
    for (let i = 0; i < scarecrowRefs.length; i++) {
        let sc = scarecrowRefs[i]
        // Randomly change direction occasionally
        if (Math.percentChance(2)) {
            sc.vx = (Math.percentChance(50) ? 1 : -1) * randint(2, 5)
            sc.vy = (Math.percentChance(50) ? 1 : -1) * randint(2, 5)
        }
    }
}

game.onUpdateInterval(500, function() {
    if (gameState != PLAYING) return
    updateScarecrowWandering()
})

function spawnSkeleton(col: number, row: number) {
    let skel = sprites.create(sIdle, SpriteKind.Skeleton)
    tiles.placeOnTile(skel, tiles.getTileLocation(col, row))
    skel.z = 10
    skel.lifespan = 15000 // Self destruct after 15 seconds
    skeletonRefs.push(skel)
    skeletonTargets.push(null)
    playCoreAnimation(skel, [sIdle], 150, true)
    updateSkeletonTargeting()
}

sprites.onDestroyed(SpriteKind.Skeleton, function (sprite: Sprite) {
    if (sprite.lifespan <= 0) {
        sprite.startEffect(effects.disintegrate, 200)
    }
    forgetSkeleton(sprite)
})

sprites.onDestroyed(SpriteKind.Enemy, function (sprite: Sprite) {
    forgetZombie(sprite)
})

let pathUpdateCounter = 0
function tickSkeletons() {
    if (gameState != PLAYING) return
    pathUpdateCounter++
    let doPathing = (pathUpdateCounter % SKELETON_PATH_INTERVAL == 0)

    let needsRetarget = false
    for (let i = 0; i < skeletonTargets.length; i++) {
        let t = skeletonTargets[i]
        if (!t || (t.flags & sprites.Flag.Destroyed)) {
            needsRetarget = true
            break
        }
    }
    if (needsRetarget) updateSkeletonTargeting()

    for (let i = 0; i < skeletonRefs.length; i++) {
        let skel = skeletonRefs[i]
        let target = skeletonTargets[i]

        if (!target || (target.flags & sprites.Flag.Destroyed)) {
            skel.vx = 0
            skel.vy = 0
            continue
        }

        let sx = Math.floor(skel.x / TILE)
        let sy = Math.floor(skel.y / TILE)
        let tx = Math.floor(target.x / TILE)
        let ty = Math.floor(target.y / TILE)

        if (doPathing) {
            // Skeleton Dijkstra / Manhattan Pathfinding:
            // Skeletons are "smarter" than zombies. Instead of using standard `.follow()`, 
            // they check the adjacent 4 tiles (up, down, left, right) towards their target.
            // If the direct path is solid (e.g., a wall), they will attempt to step sideways 
            // to navigate around the obstacle. This allows them to navigate dungeons.
            let nextStepX = sx
            let nextStepY = sy
            
            let dx = tx - sx
            let dy = ty - sy

            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0 && !isSolid(getTileId(sx + 1, sy))) nextStepX = sx + 1
                else if (dx < 0 && !isSolid(getTileId(sx - 1, sy))) nextStepX = sx - 1
                else if (dy > 0 && !isSolid(getTileId(sx, sy + 1))) nextStepY = sy + 1
                else if (dy < 0 && !isSolid(getTileId(sx, sy - 1))) nextStepY = sy - 1
            } else {
                if (dy > 0 && !isSolid(getTileId(sx, sy + 1))) nextStepY = sy + 1
                else if (dy < 0 && !isSolid(getTileId(sx, sy - 1))) nextStepY = sy - 1
                else if (dx > 0 && !isSolid(getTileId(sx + 1, sy))) nextStepX = sx + 1
                else if (dx < 0 && !isSolid(getTileId(sx - 1, sy))) nextStepX = sx - 1
            }
            
            let walkSpeed = SKELETON_WALK_SPEED
            if (nextStepX > sx) { skel.vx = walkSpeed; skel.vy = 0; }
            else if (nextStepX < sx) { skel.vx = -walkSpeed; skel.vy = 0; }
            else if (nextStepY > sy) { skel.vy = walkSpeed; skel.vx = 0; }
            else if (nextStepY < sy) { skel.vy = -walkSpeed; skel.vx = 0; }
            else { skel.vx = 0; skel.vy = 0; }
            
            if (skel.vx != 0 || skel.vy != 0) {
                playCoreAnimation(skel, [sWalk1, sIdle, sWalk2, sIdle], 150, true)
            } else {
                playCoreAnimation(skel, [sIdle], 150, true)
            }
        }
    }
}

function resumeEnemies() {
    if (player == null) return
    for (let zombie of sprites.allOfKind(SpriteKind.Enemy)) {
        setZombieMode(zombie, 0)
    }
}


// --------------------------------------------------------------------------
// Zombie spawning and behaviour.

// --------------------------------------------------------------------------
function zombieCount(): number {
    return zombieRefs.length
}

function spawnZombie() {
    if (gameState != PLAYING || player == null || inventoryOpen) return
    if (activeObstacle == OBSTACLE_SURVIVE && survivalPhase == 1) return // No zombies during prep
    let limit = maxZombies
    if (inDungeon) limit += 5 // Dungeons are more heavily infested

    if (zombieCount() >= limit) return

    let spawnCol = 2
    let spawnRow = 2

    // Attempt up to 20 times to find a valid spawn location far from the player
    for (let attempt = 0; attempt < 20; attempt++) {
        spawnCol = randint(2, MAP_W - 3)
        spawnRow = randint(2, MAP_H - 3)

        let tile = getTileId(spawnCol, spawnRow)
        if ((tile == GRASS || tile == DUNGEON_FLOOR) && Math.abs(spawnCol - playerCol()) + Math.abs(spawnRow - playerRow()) > ZOMBIE_SPAWN_MIN_DIST) {
            break
        }
    }

    let finalTile = getTileId(spawnCol, spawnRow)
    if (finalTile != GRASS && finalTile != DUNGEON_FLOOR) return

    let zombie = sprites.create(zIdle, SpriteKind.Enemy)
    zombie.z = 5
    tiles.placeOnTile(zombie, tiles.getTileLocation(spawnCol, spawnRow))
    rememberZombie(zombie)
    setZombieMode(zombie, 0)
}

// Standard background spawning loop
game.onUpdateInterval(ZOMBIE_SPAWN_INTERVAL_MS, function () {
    spawnZombie()
})

// Accelerated spawning loop for Survive mode
game.onUpdateInterval(2000, function () {
    if (activeObstacle == OBSTACLE_SURVIVE && survivalPhase == 2) {
        if (zombieCount() < maxZombies + 5) {
            spawnZombie()
        }
    }
})

game.onUpdateInterval(ZOMBIE_MODE_CHECK_MS, function () {
    if (gameState != PLAYING || player == null || inventoryOpen) return

    for (let i = zombieRefs.length - 1; i >= 0; i--) {
        let zombie = zombieRefs[i]
        
        let closestCampfireDist = 9999
        let zc = Math.floor(zombie.x / TILE)
        let zr = Math.floor(zombie.y / TILE)

        for (let c = 0; c < campfireCols.length; c++) {
            let dist = Math.abs(zc - campfireCols[c]) + Math.abs(zr - campfireRows[c])
            if (dist < closestCampfireDist) closestCampfireDist = dist
        }

        if (closestCampfireDist <= 1) {
            zombie.destroy(effects.fire, 150)
            forgetZombie(zombie)
            continue
        }
        
        let targetSprite = player
        let bestDist = Math.abs(player.x - zombie.x) + Math.abs(player.y - zombie.y)
        
        for (let j = 0; j < scarecrowRefs.length; j++) {
            let sc = scarecrowRefs[j]
            let dist = Math.abs(sc.x - zombie.x) + Math.abs(sc.y - zombie.y)
            if (dist < bestDist) {
                bestDist = dist
                targetSprite = sc
            }
        }
        
        let near = bestDist < ZOMBIE_AGGRO_RANGE
        let desiredMode = near ? 1 : 0
        
        if (closestCampfireDist <= 8) {
            desiredMode = 2
        }
        
        let idx = zombieIndex(zombie)
        if (idx >= 0) {
            zombieModes[idx] = -1 // Force update so setZombieMode runs
            setZombieMode(zombie, desiredMode)
        }
    }
})


