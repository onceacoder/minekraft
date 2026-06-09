// --------------------------------------------------------------------------
// DYNAMIC TILEMAP BACKING

// --------------------------------------------------------------------------
let world = control.createBuffer(4 + MAP_W * MAP_H)
world.setNumber(NumberFormat.UInt16LE, 0, MAP_W)
world.setNumber(NumberFormat.UInt16LE, 2, MAP_H)
let layout = image.create(MAP_W, MAP_H)

let grassTile: Image = null
let dirtTile: Image = null
let stoneTile: Image = null
let bedrockTile: Image = null
let dirtWallTile: Image = null
let spikesTile: Image = null
let diamondTile: Image = null
let woodTile: Image = null
let leavesTile: Image = null
let boneTile: Image = null
let waterTile: Image = null
let tileImages: Image[] = []

// Pre-initialize basic tiles so rendering functions have valid image references.
initTiles()


// --------------------------------------------------------------------------
// Tile image generation.

// --------------------------------------------------------------------------
function makePattern(base: number, fleck: number): Image {
    let im = image.create(16, 16)
    im.fill(base)
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            if ((x * 3 + y * 5) % 11 == 0 || (x + y * 2) % 17 == 0) {
                im.setPixel(x, y, fleck)
            }
        }
    }
    return im
}

function makeGrass(): Image {
    if (theme == 0) {
        scene.setBackgroundColor(8)
        return makePattern(8, 9)
    } else if (theme == 1) {
        scene.setBackgroundColor(9)
        return makePattern(9, 8)
    } else if (theme == 2) {
        scene.setBackgroundColor(10)
        return makePattern(10, 11)
    } else {
        scene.setBackgroundColor(11)
        return makePattern(11, 10)
    }
}

function makeDirt(): Image {
    let im = makePattern(4, 5)
    im.drawRect(0, 0, 16, 16, 15)
    return im
}

function makeStone(): Image {
    let im = makePattern(12, 14)
    im.drawRect(0, 0, 16, 16, 15)
    return im
}

function makeBedrock(): Image {
    let im = image.create(16, 16)
    im.fill(15)
    for (let y = 0; y < 16; y += 4) im.drawLine(0, y, 15, y, 1)
    for (let x = 0; x < 16; x += 4) im.drawLine(x, 0, x, 15, 1)
    return im
}

function makeDirtWall(): Image {
    let im = image.create(16, 16)
    im.fill(5)
    im.drawRect(0, 0, 16, 16, 15)
    im.drawLine(0, 4, 15, 4, 4)
    im.drawLine(0, 9, 15, 9, 4)
    im.drawLine(5, 0, 5, 4, 4)
    im.drawLine(11, 4, 11, 9, 4)
    im.drawLine(6, 9, 6, 15, 4)
    return im
}

function makeSpikes(): Image {
    let im = image.create(16, 16)
    im.fill(12)
    im.drawRect(0, 0, 16, 16, 15)
    for (let x = 1; x < 16; x += 4) {
        im.drawLine(x, 14, x + 2, 4, 15)
        im.drawLine(x + 2, 4, x + 4, 14, 15)
        im.setPixel(x + 2, 4, 2)
    }
    return im
}

/** Draws an expressive, shiny RPG-style diamond crystal */
function makeDiamond(): Image {
    let im = image.create(16, 16)
    im.drawTransparentImage(img`
        . . . . . . 9 9 . . . . . . .
        . . . . . 9 1 1 9 . . . . . .
        . . . . 9 1 8 8 1 9 . . . . .
        . . . 9 1 8 8 8 8 1 9 . . . .
        . . 9 1 8 8 8 8 8 8 1 9 . . .
        . 9 1 1 8 8 8 8 8 8 1 1 9 . .
        9 9 9 1 8 8 8 8 8 8 1 9 9 9 .
        9 9 9 9 1 8 8 8 8 1 9 9 9 9 .
        . 9 9 9 9 1 8 8 1 9 9 9 9 . .
        . . 9 9 9 9 1 1 9 9 9 9 . . .
        . . . 9 9 9 9 9 9 9 9 . . . .
        . . . . 9 9 9 9 9 9 . . . . .
        . . . . . 9 9 9 9 . . . . . .
        . . . . . . 9 9 . . . . . . .
        . . . . . . . . . . . . . . .
        . . . . . . . . . . . . . . .
    `, 0, 0)
    return im
}

function makeWood(): Image {
    let im = image.create(16, 16)
    im.fill(14)
    im.drawRect(0, 0, 16, 16, 15)
    im.drawLine(4, 0, 4, 15, 4)
    im.drawLine(10, 0, 10, 15, 4)
    im.drawLine(6, 2, 8, 2, 4)
    im.drawLine(2, 7, 5, 7, 4)
    im.drawLine(9, 11, 13, 11, 4)
    return im
}

function makeLeaves(): Image {
    let im = makePattern(7, 6)
    im.drawRect(0, 0, 16, 16, 15)
    return im
}

function makeBone(): Image {
    let im = makePattern(13, 1)
    im.drawRect(0, 0, 16, 16, 15)
    // Draw a small bone shape
    im.setPixel(5, 5, 1)
    im.setPixel(5, 6, 1)
    im.setPixel(6, 5, 1)
    im.drawLine(6, 6, 9, 9, 1)
    im.setPixel(9, 10, 1)
    im.setPixel(10, 9, 1)
    im.setPixel(10, 10, 1)
    return im
}

function makeWater(): Image {
    let im = image.create(16, 16)
    im.fill(8)
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            if ((x * 2 + y * 3 + Math.floor(game.runtime() / 200)) % 7 == 0) im.setPixel(x, y, 9)
        }
    }
    return im
}

function initTiles() {
    grassTile = makeGrass()
    dirtTile = makeDirt()
    stoneTile = makeStone()
    bedrockTile = makeBedrock()
    dirtWallTile = makeDirtWall()
    spikesTile = makeSpikes()
    diamondTile = makeDiamond()
    woodTile = makeWood()
    leavesTile = makeLeaves()
    boneTile = makeBone()
    waterTile = makeWater()
    tileImages = [
        grassTile, dirtTile, stoneTile, bedrockTile,
        dirtWallTile, spikesTile, diamondTile, woodTile, leavesTile, boneTile, waterTile
    ]
}


// --------------------------------------------------------------------------
// Tilemap read/write helpers.

// --------------------------------------------------------------------------
function worldIndex(col: number, row: number): number {
    return 4 + row * MAP_W + col
}

function inBounds(col: number, row: number): boolean {
    return col >= 0 && col < MAP_W && row >= 0 && row < MAP_H
}

function setTile(col: number, row: number, tileId: number) {
    if (!inBounds(col, row)) return
    rawSetTile(col, row, tileId)
    let loc = tiles.getTileLocation(col, row)
    tiles.setTileAt(loc, tileImages[tileId])
    tiles.setWallAt(loc, isSolid(tileId))
}

function getTileId(col: number, row: number): number {
    if (!inBounds(col, row)) return BEDROCK
    return world.getNumber(NumberFormat.UInt8LE, worldIndex(col, row))
}

function isSolid(tileId: number): boolean {
    return tileId == DIRT || tileId == STONE || tileId == BEDROCK || tileId == DIRT_WALL || tileId == WOOD || tileId == WATER
}

function rawSetTile(col: number, row: number, tileId: number) {
    if (!inBounds(col, row)) return
    world.setNumber(NumberFormat.UInt8LE, worldIndex(col, row), tileId)
    layout.setPixel(col, row, tileId)
}

function refreshMap() {
    for (let row = 0; row < MAP_H; row++) {
        for (let col = 0; col < MAP_W; col++) {
            let id = getTileId(col, row)
            let loc = tiles.getTileLocation(col, row)
            tiles.setTileAt(loc, tileImages[id])
            tiles.setWallAt(loc, isSolid(id))
        }
    }
}


// --------------------------------------------------------------------------
// Procedural level generation.

// --------------------------------------------------------------------------
function clearArea(cx: number, cy: number, radius: number) {
    for (let col = cx - radius; col <= cx + radius; col++) {
        for (let row = cy - radius; row <= cy + radius; row++) {
            if (inBounds(col, row)) rawSetTile(col, row, GRASS)
        }
    }
}

function makeTree(cx: number, cy: number) {
    rawSetTile(cx, cy, WOOD)
    if (inBounds(cx - 1, cy) && randint(0, 100) < 70) rawSetTile(cx - 1, cy, LEAVES)
    if (inBounds(cx + 1, cy) && randint(0, 100) < 70) rawSetTile(cx + 1, cy, LEAVES)
    if (inBounds(cx, cy - 1) && randint(0, 100) < 70) rawSetTile(cx, cy - 1, LEAVES)
    if (inBounds(cx, cy + 1) && randint(0, 100) < 70) rawSetTile(cx, cy + 1, LEAVES)
}

function generateWorld() {
    // 1. Fill entire map with Grass
    for (let col = 0; col < MAP_W; col++) {
        for (let row = 0; row < MAP_H; row++) {
            rawSetTile(col, row, GRASS)
        }
    }

    // 2. Create impenetrable Bedrock border around the edges
    for (let col2 = 0; col2 < MAP_W; col2++) {
        rawSetTile(col2, 0, BEDROCK)
        rawSetTile(col2, MAP_H - 1, BEDROCK)
    }

    for (let row2 = 0; row2 < MAP_H; row2++) {
        rawSetTile(0, row2, BEDROCK)
        rawSetTile(MAP_W - 1, row2, BEDROCK)
    }

    // 3. Scatter trees randomly (avoiding the player's spawn area)
    for (let i = 0; i < 70 + level * 3; i++) {
        let tx = randint(2, MAP_W - 3)
        let ty = randint(2, MAP_H - 3)
        if (Math.abs(tx - 24) > 5 || Math.abs(ty - 10) > 5) makeTree(tx, ty)
    }

    // 4. Scatter basic resources (Dirt/Stone) in the lower section of the map
    for (let i2 = 0; i2 < 170 + level * 6; i2++) {
        let bx = randint(4, MAP_W - 5)
        let by = randint(18, MAP_H - 6)
        if (randint(0, 100) < 65) rawSetTile(bx, by, DIRT)
        else rawSetTile(bx, by, STONE)
    }

    // 5. Scatter bone fragments for skeleton summoning
    for (let i3 = 0; i3 < 85 + level * 3; i3++) {
        let bx = randint(4, MAP_W - 5)
        let by = randint(18, MAP_H - 6)
        rawSetTile(bx, by, BONE)
    }

    // 6. Generate resource clusters/veins
    for (let cluster = 0; cluster < 18; cluster++) {
        let cx = randint(6, MAP_W - 7)
        let cy = randint(20, MAP_H - 8)
        let kind = randint(0, 100) < 55 ? DIRT : STONE

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (randint(0, 100) < 70) rawSetTile(cx + dx, cy + dy, kind)
            }
        }
    }

    // 7. Carve a guaranteed passable path from spawn to the bottom
    let routeX = 24
    let routeY = 10

    while (routeY < 42) {
        clearArea(routeX, routeY, 2)

        // Random horizontal shifting for the path
        if (randint(0, 100) < 55) {
            let sideSteps = randint(3, 7)
            let dir = randint(0, 1) == 0 ? -1 : 1

            for (let s = 0; s < sideSteps; s++) {
                routeX += dir
                if (routeX < 5) routeX = 5
                if (routeX > MAP_W - 6) routeX = MAP_W - 6
                clearArea(routeX, routeY, 1)
            }
        }

        // Move path downwards
        routeY += randint(2, 4)
        clearArea(routeX, routeY, 2)
    }

    // 8. Place the Diamond (Goal) at the end of the path
    clearArea(routeX, 44, 4)
    goalCol = routeX
    goalRow = 44
    rawSetTile(goalCol, goalRow, DIAMOND)

    // Build a decorative stone enclosure around the Diamond entrance
    for (let gx = routeX - 4; gx <= routeX + 4; gx++) {
        if (inBounds(gx, 40)) rawSetTile(gx, 40, STONE)
    }

    // Leave a 3-tile wide entrance hole in the enclosure
    rawSetTile(routeX, 40, GRASS)
    rawSetTile(routeX - 1, 40, GRASS)
    rawSetTile(routeX + 1, 40, GRASS)
    
    // Final spawn clearing to ensure player doesn't spawn in a tree
    clearArea(24, 10, 5)

    // 9. Apply dynamic obstacles (if selected)
    if (activeObstacle == OBSTACLE_RIVER) {
        generateRiver()
    }
}

// Procedurally cuts a jagged water hazard across the map
function generateRiver() {
    let ry = randint(20, 28)
    for (let rx = 1; rx < MAP_W - 1; rx++) {
        rawSetTile(rx, ry, WATER)
        rawSetTile(rx, ry + 1, WATER)
        if (randint(0, 100) < 50) rawSetTile(rx, ry + 2, WATER)
        if (randint(0, 100) < 30) rawSetTile(rx, ry - 1, WATER)
        
        ry += randint(-1, 1)
        if (ry < 18) ry = 18
        if (ry > 32) ry = 32
    }
}


