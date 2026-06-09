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

    if (mode == 0) {
        zombie.follow(player, getZombieSpeed())
        playCoreAnimation(zombie, [zWalk1, zIdle, zWalk2, zIdle], 150, true)
    } else if (mode == 1) {
        zombie.follow(player, getZombieSpeed() + 10)
        playCoreAnimation(zombie, [zAttack, zIdle], 120, true)
    } else {
        zombie.follow(player, 0)
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

        let sx = Math.floor(skel.x / TILE)
        let sy = Math.floor(skel.y / TILE)

        for (let z of zombies) {
            let zx = Math.floor(z.x / TILE)
            let zy = Math.floor(z.y / TILE)
            let d = getGridDist(sx, sy, zx, zy)

            if (d < bestDist) {
                bestDist = d
                bestTarget = z
            }
            if (targeted.indexOf(z) < 0 && d < bestUntargetedDist) {
                bestUntargetedDist = d
                bestUntargeted = z
            }
        }

        if (bestUntargeted != null) {
            skeletonTargets[i] = bestUntargeted
            targeted.push(bestUntargeted)
        } else {
            skeletonTargets[i] = bestTarget
        }
    }
}

function spawnSkeleton(col: number, row: number) {
    let skel = sprites.create(sIdle, SpriteKind.Skeleton)
    tiles.placeOnTile(skel, tiles.getTileLocation(col, row))
    skel.z = 10
    skeletonRefs.push(skel)
    skeletonTargets.push(null)
    playCoreAnimation(skel, [sIdle], 150, true)
    updateSkeletonTargeting()
}

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
            let qX = [tx]
            let qY = [ty]
            let visitedX = [tx]
            let visitedY = [ty]
            
            let foundNext = false
            let nextStepX = sx
            let nextStepY = sy
            
            let head = 0
            let iters = 0
            while(head < qX.length && iters < 200) {
                iters++
                let cx = qX[head]
                let cy = qY[head]
                head++
                
                if (getGridDist(cx, cy, sx, sy) == 1) {
                    nextStepX = cx
                    nextStepY = cy
                    foundNext = true
                    break
                }
                
                let dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]
                for(let d of dirs) {
                    let nx = cx + d[0]
                    let ny = cy + d[1]
                    if (!isSolid(getTileId(nx, ny))) {
                        let seen = false
                        for(let v = 0; v < visitedX.length; v++) {
                            if (visitedX[v] == nx && visitedY[v] == ny) { seen = true; break; }
                        }
                        if (!seen) {
                            visitedX.push(nx)
                            visitedY.push(ny)
                            qX.push(nx)
                            qY.push(ny)
                        }
                    }
                }
            }
            
            if (!foundNext) {
                if (sx < tx && !isSolid(getTileId(sx + 1, sy))) nextStepX = sx + 1
                else if (sx > tx && !isSolid(getTileId(sx - 1, sy))) nextStepX = sx - 1
                else if (sy < ty && !isSolid(getTileId(sx, sy + 1))) nextStepY = sy + 1
                else if (sy > ty && !isSolid(getTileId(sx, sy - 1))) nextStepY = sy - 1
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
    if (zombieCount() >= maxZombies) return

    let spawnCol = 2
    let spawnRow = 2

    // Attempt up to 20 times to find a valid spawn location far from the player
    for (let attempt = 0; attempt < 20; attempt++) {
        spawnCol = randint(2, MAP_W - 3)
        spawnRow = randint(2, MAP_H - 3)

        if (getTileId(spawnCol, spawnRow) == GRASS && Math.abs(spawnCol - playerCol()) + Math.abs(spawnRow - playerRow()) > ZOMBIE_SPAWN_MIN_DIST) {
            break
        }
    }

    if (getTileId(spawnCol, spawnRow) != GRASS) return

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

    for (let zombie of zombieRefs) {
        let near = Math.abs(player.x - zombie.x) < ZOMBIE_AGGRO_RANGE && Math.abs(player.y - zombie.y) < ZOMBIE_AGGRO_RANGE
        if (near) setZombieMode(zombie, 1)
        else setZombieMode(zombie, 0)
    }
})


