// --------------------------------------------------------------------------
// Save & Load System
// Bit-packed tile serialization for hardware-safe persistence.
// --------------------------------------------------------------------------

/**
 * Serializes the current game state and writes it to device flash storage.
 * Packs 6 tiles per int to compress 2304 tiles into 384 numbers.
 */
function saveGame(svName: string) {
    let q = settings.readString("saveQueue") || ""
    let arr = q.length > 0 ? q.split(",") : []

    let existingIdx = -1
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] == svName) existingIdx = i
    }

    if (existingIdx == -1) arr.push(svName)
    else {
        arr.splice(existingIdx, 1)
        arr.push(svName)
    }

    while (arr.length > 5) {
        let oldSave = arr.shift()
        settings.remove("sav_" + oldSave + "_data")
        settings.remove("sav_" + oldSave + "_map")
    }

    settings.writeString("saveQueue", arr.join(","))

    // Pack 6 tiles per int to compress 2304 tiles into 384 numbers for hardware safety
    let mapArr: number[] = []
    for (let i = 0; i < MAP_W * MAP_H; i += 6) {
        let packed = 0;
        for (let j = 0; j < 6; j++) {
            let id = world.getNumber(NumberFormat.UInt8LE, 4 + i + j);
            packed |= (id << (j * 5));
        }
        mapArr.push(packed);
    }
    settings.writeNumberArray("sav_" + svName + "_map", mapArr)

    let zData: number[] = []
    for (let z of zombieRefs) {
        let idx = zombieIndex(z)
        let mode = idx >= 0 ? zombieModes[idx] : 0
        zData.push(z.x)
        zData.push(z.y)
        zData.push(mode)
    }

    let data = [
        level, info.life(), invDirt, invStone, invWood, invGrass, invBones,
        player.x, player.y, theme, goalCol, goalRow,
        invIron,
        optRiver ? 1 : 0, optSurvive ? 1 : 0, optToll ? 1 : 0, optDungeon ? 1 : 0,
        activeObstacle,
        inDungeon ? 1 : 0, hasDungeonKey ? 1 : 0, dungeonReturnCol, dungeonReturnRow,
        zData.length / 3
    ]
    for (let i = 0; i < zData.length; i++) data.push(zData[i])

    settings.writeNumberArray("sav_" + svName + "_data", data)

    gameState = PLAYING
    inventoryOpen = false
    resumeEnemies()
    resumePlayer()
}

/**
 * Deserializes a saved game state from device flash storage
 * and restores the full world, player, and zombie state.
 * Returns true on success, false on failure.
 */
function loadGame(svName: string): boolean {
    let data = settings.readNumberArray("sav_" + svName + "_data")
    let mapArr = settings.readNumberArray("sav_" + svName + "_map")

    if (!data || data.length < 12 || !mapArr || mapArr.length != (MAP_W * MAP_H) / 6) {
        return false
    }

    destroyLevelSprites()

    level = data[0]
    info.setLife(data[1])
    invDirt = data[2]
    invStone = data[3]
    invWood = data[4]
    invGrass = data[5]
    
    let px = 24 * TILE
    let py = 10 * TILE
    let zCount = 0
    let zOffset = 0
    
    if (data.length >= 23) {
        // v3 format (includes invIron and all dungeon/obstacle states)
        invBones = data[6]
        px = data[7]
        py = data[8]
        theme = data[9]
        goalCol = data[10]
        goalRow = data[11]
        invIron = data[12]
        optRiver = data[13] == 1
        optSurvive = data[14] == 1
        optToll = data[15] == 1
        optDungeon = data[16] == 1
        activeObstacle = data[17]
        inDungeon = data[18] == 1
        hasDungeonKey = data[19] == 1
        dungeonReturnCol = data[20]
        dungeonReturnRow = data[21]
        zCount = data[22]
        zOffset = 23
    } else {
        // Legacy v1 / v2 formats
        let offset = data.length >= 13 ? 1 : 0
        invBones = offset ? data[6] : 0
        px = data[6 + offset]
        py = data[7 + offset]
        theme = data[8 + offset]
        goalCol = data[9 + offset]
        goalRow = data[10 + offset]
        zCount = data[11 + offset]
        zOffset = 12 + offset
        
        invIron = 0
        optRiver = true
        optSurvive = true
        optToll = true
        optDungeon = true
        activeObstacle = OBSTACLE_NONE
        inDungeon = false
        hasDungeonKey = false
    }

    // Unpack binary map
    for (let i = 0; i < mapArr.length; i++) {
        let packed = mapArr[i];
        for (let j = 0; j < 6; j++) {
            let id = (packed >> (j * 5)) & 0x1F;
            world.setNumber(NumberFormat.UInt8LE, 4 + i * 6 + j, id);
        }
    }

    for (let row = 0; row < MAP_H; row++) {
        for (let col = 0; col < MAP_W; col++) {
            layout.setPixel(col, row, getTileId(col, row))
        }
    }

    initTiles()
    tiles.setTilemap(tiles.createTilemap(world, layout, tileImages, TileScale.Sixteen))
    refreshMap()

    player = sprites.create(pDown, SpriteKind.Player)
    player.setPosition(px, py)
    player.z = 10
    scene.cameraFollowSprite(player)
    playerAnim = ""
    playerAttackUntil = 0
    setPlayerAnim("idle-down", [pDown], 120, false)

    targetCursor = sprites.create(cursorImg, SpriteKind.Food)
    targetCursor.z = 50
    targetCursor.setFlag(SpriteFlag.Invisible, true)

    createDiamondMarker()

    for (let i = 0; i < zCount; i++) {
        let zx = data[zOffset + i * 3]
        let zy = data[zOffset + 1 + i * 3]
        let zm = data[zOffset + 2 + i * 3]

        let zombie = sprites.create(zIdle, SpriteKind.Enemy)
        zombie.z = 5
        zombie.setPosition(zx, zy)
        rememberZombie(zombie)
        setZombieMode(zombie, zm)
    }

    maxZombies = 5 + level
    if (maxZombies > 10) maxZombies = 10

    invincible = false
    inventoryOpen = false
    gameState = PLAYING

    resumePlayer()
    return true
}

/** Returns the list of saved game names from the save queue. */
function getSaveList(): string[] {
    let q = settings.readString("saveQueue") || ""
    return q.length > 0 ? q.split(",") : []
}

let overworldSavedInvDirt = 0
let overworldSavedInvStone = 0
let overworldSavedInvWood = 0
let overworldSavedInvGrass = 0
let overworldSavedInvBones = 0
let overworldSavedInvIron = 0

function suspendOverworld() {
    let mapArr: number[] = []
    for (let i = 0; i < MAP_W * MAP_H; i += 6) {
        let packed = 0;
        for (let j = 0; j < 6; j++) {
            let id = world.getNumber(NumberFormat.UInt8LE, 4 + i + j);
            packed |= (id << (j * 5));
        }
        mapArr.push(packed);
    }
    settings.writeNumberArray("dungeon_suspend_map", mapArr)

    let zData: number[] = []
    for (let z of zombieRefs) {
        let idx = zombieIndex(z)
        let mode = idx >= 0 ? zombieModes[idx] : 0
        zData.push(z.x)
        zData.push(z.y)
        zData.push(mode)
    }
    settings.writeNumberArray("dungeon_suspend_zombies", zData)

    overworldSavedInvDirt = invDirt
    overworldSavedInvStone = invStone
    overworldSavedInvWood = invWood
    overworldSavedInvGrass = invGrass
    overworldSavedInvBones = invBones
    overworldSavedInvIron = invIron

    invDirt = 0
    invStone = 0
    invWood = 0
    invGrass = 0
    invBones = 0
    invIron = 0
}

function restoreOverworld() {
    let mapArr = settings.readNumberArray("dungeon_suspend_map")
    let zData = settings.readNumberArray("dungeon_suspend_zombies")

    if (mapArr && mapArr.length == (MAP_W * MAP_H) / 6) {
        for (let i = 0; i < mapArr.length; i++) {
            let packed = mapArr[i];
            for (let j = 0; j < 6; j++) {
                let id = (packed >> (j * 5)) & 0x1F;
                world.setNumber(NumberFormat.UInt8LE, 4 + i * 6 + j, id);
            }
        }
    }

    if (zData) {
        for (let i = 0; i < zData.length / 3; i++) {
            let zx = zData[i * 3]
            let zy = zData[1 + i * 3]
            let zm = zData[2 + i * 3]

            let zombie = sprites.create(zIdle, SpriteKind.Enemy)
            zombie.z = 5
            zombie.setPosition(zx, zy)
            rememberZombie(zombie)
            setZombieMode(zombie, zm)
        }
    }

    invDirt = overworldSavedInvDirt
    invStone = overworldSavedInvStone
    invWood = overworldSavedInvWood
    invGrass = overworldSavedInvGrass
    invBones = overworldSavedInvBones
    invIron = overworldSavedInvIron
}
