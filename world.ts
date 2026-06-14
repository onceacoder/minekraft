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
let ironOreTile: Image = null
let bricksTile: Image = null
let stoneBlockTile: Image = null
let timberTile: Image = null
let bridgeTile: Image = null
let tallGrassTile: Image = null
let hayTile: Image = null
let caveEntranceTile: Image = null
let dungeonWallTile: Image = null
let keyHoleTile: Image = null
let dungeonFloorTile: Image = null
let keyTile: Image = null
let campfireTile: Image = null
let tileImages: Image[] = []

// Scaled-down 8x8 versions of tile images, derived from the actual tiles
// so they always match the current theme. Generated in initTiles().
let miniSpikes: Image = null
let miniBricks: Image = null
let miniStoneBlock: Image = null
let miniTimber: Image = null
let miniHay: Image = null
let miniSkeleton: Image = null // Represents the skeleton icon

// Pre-initialize basic tiles so rendering functions have valid image references.
// Note: Called at the bottom of the file after all static image templates are initialized.


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
    let im = image.create(16, 16)
    im.fill(4)  // Brown base
    im.drawRect(0, 0, 16, 16, 15)
    // Soil layers
    im.drawLine(1, 4, 14, 4, 5)
    im.drawLine(1, 9, 14, 9, 5)
    // Pebbles / soil detail
    im.fillRect(3, 2, 2, 1, 14)
    im.fillRect(10, 1, 2, 1, 14)
    im.fillRect(6, 6, 2, 1, 14)
    im.fillRect(12, 7, 2, 1, 14)
    im.fillRect(2, 11, 2, 1, 14)
    im.fillRect(8, 12, 2, 1, 14)
    // Lighter top highlights
    im.drawLine(1, 1, 14, 1, 5)
    return im
}

function makeStone(): Image {
    let im = image.create(16, 16)
    im.fill(12)
    im.drawRect(0, 0, 16, 16, 15)
    // Stone block joints
    im.drawLine(0, 5, 15, 5, 11)
    im.drawLine(0, 10, 15, 10, 11)
    im.drawLine(6, 0, 6, 5, 11)
    im.drawLine(11, 5, 11, 10, 11)
    im.drawLine(3, 10, 3, 15, 11)
    // Lighter highlights on top edges
    im.drawLine(1, 1, 5, 1, 13)
    im.drawLine(7, 1, 14, 1, 13)
    im.drawLine(1, 6, 10, 6, 13)
    im.drawLine(12, 6, 14, 6, 13)
    im.drawLine(1, 11, 2, 11, 13)
    im.drawLine(4, 11, 14, 11, 13)
    return im
}

function makeBedrock(): Image {
    let im = image.create(16, 16)
    im.fill(15)  // Black base
    // Large stone blocks
    im.drawLine(0, 5, 15, 5, 11)
    im.drawLine(0, 10, 15, 10, 11)
    im.drawLine(8, 0, 8, 5, 11)
    im.drawLine(4, 5, 4, 10, 11)
    im.drawLine(12, 10, 12, 15, 11)
    // Surface cracks
    im.setPixel(3, 2, 11)
    im.setPixel(4, 3, 11)
    im.setPixel(11, 7, 11)
    im.setPixel(7, 13, 11)
    im.setPixel(2, 12, 11)
    return im
}


function makeSpikes(): Image {
    let im = image.create(16, 16)
    im.fill(11)  // Dark base
    im.drawRect(0, 0, 16, 16, 15)
    // Base plate
    im.fillRect(1, 12, 14, 3, 12)
    im.drawLine(1, 12, 14, 12, 13)
    // Spike 1 (left)
    im.drawLine(3, 12, 3, 5, 12)
    im.drawLine(2, 12, 2, 7, 11)
    im.drawLine(4, 12, 4, 7, 13)
    im.setPixel(3, 4, 1)  // Sharp tip
    im.setPixel(3, 5, 13)
    // Spike 2 (center)
    im.drawLine(8, 12, 8, 4, 12)
    im.drawLine(7, 12, 7, 6, 11)
    im.drawLine(9, 12, 9, 6, 13)
    im.setPixel(8, 3, 1)
    im.setPixel(8, 4, 13)
    // Spike 3 (right)
    im.drawLine(13, 12, 13, 6, 12)
    im.drawLine(12, 12, 12, 8, 11)
    im.drawLine(14, 12, 14, 8, 13)
    im.setPixel(13, 5, 1)
    im.setPixel(13, 6, 13)
    return im
}

let diamondImgLiteral = img`
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
    `

/** Draws an expressive, shiny RPG-style diamond crystal */
function makeDiamond(): Image {
    return diamondImgLiteral
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


function makeBone(): Image {
    let im = image.create(16, 16)
    im.fill(13)  // Tan/sandy ground
    im.drawRect(0, 0, 16, 16, 15)
    // Scattered flecks for ground texture
    im.setPixel(2, 2, 14)
    im.setPixel(9, 1, 14)
    im.setPixel(13, 3, 14)
    im.setPixel(1, 12, 14)
    im.setPixel(12, 13, 14)
    // Skull (top center)
    im.fillRect(6, 3, 4, 4, 1)  // Skull body
    im.setPixel(5, 4, 1)
    im.setPixel(10, 4, 1)
    im.setPixel(7, 4, 15)  // Left eye
    im.setPixel(8, 4, 15)  // Right eye
    im.setPixel(7, 6, 15)  // Mouth left
    im.setPixel(8, 6, 15)  // Mouth right
    // Crossbones below skull
    im.drawLine(4, 8, 11, 13, 1)
    im.drawLine(11, 8, 4, 13, 1)
    // Bone knobs at ends
    im.setPixel(3, 8, 1)
    im.setPixel(12, 8, 1)
    im.setPixel(3, 13, 1)
    im.setPixel(12, 13, 1)
    return im
}

function makeIronOre(): Image {
    let im = image.create(16, 16)
    im.fill(12)  // Grey stone base
    im.drawRect(0, 0, 16, 16, 15)
    // Stone block joints (like stone tile)
    im.drawLine(0, 7, 15, 7, 11)
    im.drawLine(8, 0, 8, 7, 11)
    im.drawLine(4, 7, 4, 15, 11)
    // Embedded iron ore veins (rust orange/brown)
    im.fillRect(2, 2, 3, 3, 4)
    im.setPixel(3, 3, 14)  // Bright center
    im.fillRect(10, 3, 3, 2, 4)
    im.setPixel(11, 3, 14)
    im.fillRect(5, 10, 4, 3, 4)
    im.setPixel(6, 11, 14)
    im.setPixel(7, 11, 14)
    im.fillRect(12, 11, 2, 2, 4)
    return im
}

function makeBricks(): Image {
    let im = image.create(16, 16)
    im.fill(4)
    im.drawRect(0, 0, 16, 16, 15)
    // Draw brick mortar lines
    for (let y = 3; y < 16; y += 4) im.drawLine(0, y, 15, y, 15)
    for (let x = 3; x < 16; x += 8) {
        im.drawLine(x, 0, x, 3, 15)
        im.drawLine(x, 8, x, 11, 15)
    }
    for (let x = 7; x < 16; x += 8) {
        im.drawLine(x, 4, x, 7, 15)
        im.drawLine(x, 12, x, 15, 15)
    }
    return im
}

function makeStoneBlock(): Image {
    let im = image.create(16, 16)
    im.fill(12)  // Grey
    im.drawRect(0, 0, 16, 16, 15)
    // Chiseled bevel - highlight top/left, shadow bottom/right
    im.drawLine(2, 2, 13, 2, 13)  // Top highlight
    im.drawLine(2, 2, 2, 13, 13)  // Left highlight
    im.drawLine(13, 3, 13, 13, 11)  // Right shadow
    im.drawLine(3, 13, 13, 13, 11)  // Bottom shadow
    // Inner stone face
    im.fillRect(4, 4, 8, 8, 12)
    im.drawLine(4, 4, 11, 4, 13)  // Inner highlight
    im.drawLine(4, 4, 4, 11, 13)
    im.drawLine(11, 5, 11, 11, 11)  // Inner shadow
    im.drawLine(5, 11, 11, 11, 11)
    // Center detail
    im.setPixel(7, 7, 11)
    im.setPixel(8, 8, 13)
    return im
}

function makeTimber(): Image {
    let im = image.create(16, 16)
    im.fill(14)  // Light brown
    im.drawRect(0, 0, 16, 16, 15)
    // Stacked logs - horizontal dividers
    im.drawLine(0, 5, 15, 5, 15)
    im.drawLine(0, 10, 15, 10, 15)
    // Log cross-sections on left face (3 logs)
    im.drawCircle(3, 2, 2, 4)
    im.setPixel(3, 2, 14)
    im.drawCircle(3, 7, 2, 4)
    im.setPixel(3, 7, 14)
    im.drawCircle(3, 13, 2, 4)
    im.setPixel(3, 13, 14)
    // Wood grain lines
    im.drawLine(7, 1, 14, 1, 4)
    im.drawLine(7, 3, 14, 3, 4)
    im.drawLine(7, 7, 14, 7, 4)
    im.drawLine(7, 12, 14, 12, 4)
    im.drawLine(7, 14, 14, 14, 4)
    return im
}

function makeBridge(): Image {
    let im = image.create(16, 16)
    im.fill(14)
    im.drawLine(0, 0, 15, 0, 15)
    im.drawLine(0, 4, 15, 4, 15)
    im.drawLine(0, 8, 15, 8, 15)
    im.drawLine(0, 12, 15, 12, 15)
    im.drawLine(0, 15, 15, 15, 15)
    im.setPixel(3, 2, 4)
    im.setPixel(12, 2, 4)
    im.setPixel(6, 6, 4)
    im.setPixel(9, 10, 4)
    im.setPixel(2, 14, 4)
    im.setPixel(13, 14, 4)
    return im
}

function makeTallGrass(): Image {
    let im = image.create(16, 16)
    im.fill(7)  // Dark green base
    im.drawRect(0, 0, 16, 16, 15)
    // Ground soil at bottom
    im.fillRect(1, 13, 14, 2, 4)
    // Grass blades of varying height
    im.drawLine(2, 13, 2, 6, 6)
    im.drawLine(3, 13, 3, 8, 7)
    im.drawLine(5, 13, 5, 4, 6)
    im.drawLine(6, 13, 6, 7, 7)
    im.drawLine(8, 13, 8, 5, 6)
    im.drawLine(9, 13, 9, 9, 7)
    im.drawLine(11, 13, 11, 3, 6)
    im.drawLine(12, 13, 12, 7, 7)
    im.drawLine(14, 13, 14, 6, 6)
    // Bright tips
    im.setPixel(5, 4, 10)
    im.setPixel(11, 3, 10)
    im.setPixel(2, 6, 10)
    im.setPixel(8, 5, 10)
    im.setPixel(14, 6, 10)
    return im
}

function makeHay(): Image {
    let im = image.create(16, 16)
    im.fill(5)  // Yellow/straw base
    im.drawRect(0, 0, 16, 16, 15)
    // Binding ropes (darker brown)
    im.drawLine(4, 1, 4, 14, 4)
    im.drawLine(11, 1, 11, 14, 4)
    // Straw texture - diagonal strands
    im.drawLine(1, 2, 3, 4, 14)
    im.drawLine(5, 1, 10, 6, 14)
    im.drawLine(12, 2, 14, 4, 14)
    im.drawLine(1, 8, 3, 10, 14)
    im.drawLine(5, 7, 10, 12, 14)
    im.drawLine(12, 8, 14, 10, 14)
    // Straw ends poking out top/bottom
    im.setPixel(2, 1, 13)
    im.setPixel(7, 1, 13)
    im.setPixel(13, 1, 13)
    im.setPixel(3, 14, 13)
    im.setPixel(8, 14, 13)
    im.setPixel(14, 14, 13)
    return im
}

function makeCaveEntrance(): Image {
    let im = image.create(16, 16)
    im.fill(12)  // Grey stone surround
    im.drawRect(0, 0, 16, 16, 15)
    // Stone highlights
    im.drawLine(1, 1, 14, 1, 13)
    im.drawLine(1, 1, 1, 14, 13)
    im.drawLine(14, 2, 14, 14, 11)
    im.drawLine(2, 14, 14, 14, 11)
    // Dark cave opening - gothic arch
    im.fillRect(4, 6, 8, 10, 15)
    im.fillRect(5, 4, 6, 2, 15)
    im.fillRect(6, 3, 4, 1, 15)
    // Archway stone border
    im.setPixel(4, 5, 11)
    im.setPixel(11, 5, 11)
    im.setPixel(5, 4, 11)
    im.setPixel(10, 4, 11)
    im.setPixel(6, 3, 11)
    im.setPixel(9, 3, 11)
    return im
}

function makeDungeonWall(): Image {
    let im = image.create(16, 16)
    im.fill(11) // Dark grey
    im.drawRect(0, 0, 16, 16, 15)
    im.drawLine(0, 8, 15, 8, 15)
    im.drawLine(8, 0, 8, 8, 15)
    im.drawLine(4, 8, 4, 15, 15)
    im.drawLine(12, 8, 12, 15, 15)
    return im
}

function makeKeyHole(): Image {
    let im = makeDungeonWall()
    im.fillRect(7, 6, 2, 3, 15)
    im.fillRect(6, 9, 4, 3, 15)
    return im
}

function makeDungeonFloor(): Image {
    let im = image.create(16, 16)
    im.fill(12)  // Grey flagstone
    im.drawRect(0, 0, 16, 16, 11)  // Dark-grey border
    // Floor tile joints
    im.drawLine(8, 0, 8, 15, 11)
    im.drawLine(0, 8, 15, 8, 11)
    // Highlight edges (top-left of each quad)
    im.drawLine(1, 1, 7, 1, 1)
    im.drawLine(9, 1, 14, 1, 1)
    im.drawLine(1, 9, 7, 9, 1)
    im.drawLine(9, 9, 14, 9, 1)
    // Subtle cracks
    im.setPixel(3, 4, 11)
    im.setPixel(4, 5, 11)
    im.setPixel(11, 12, 11)
    return im
}

function makeKey(): Image {
    let im = makeDungeonFloor()
    // Classic golden RPG key
    // Key bow (round top)
    im.drawCircle(8, 4, 3, 5)
    im.setPixel(8, 4, 14)  // Center of bow
    im.setPixel(7, 4, 5)
    im.setPixel(9, 4, 5)
    // Key shaft
    im.drawLine(8, 7, 8, 13, 5)
    im.setPixel(8, 7, 14)  // Shaft highlight
    // Key teeth
    im.drawLine(8, 11, 10, 11, 5)
    im.drawLine(10, 11, 10, 12, 5)
    im.drawLine(8, 13, 11, 13, 5)
    im.drawLine(11, 13, 11, 14, 5)
    return im
}

function makeWater(): Image {
    let im = image.create(16, 16)
    im.fill(8)  // Blue base
    // Wave ripple bands
    im.drawLine(0, 3, 15, 3, 9)
    im.drawLine(0, 7, 15, 7, 6)
    im.drawLine(0, 11, 15, 11, 9)
    // Staggered wave crests
    im.drawLine(2, 2, 5, 2, 9)
    im.drawLine(10, 6, 14, 6, 9)
    im.drawLine(1, 10, 6, 10, 9)
    im.drawLine(11, 14, 15, 14, 9)
    // Sparkle highlights
    im.setPixel(4, 1, 1)
    im.setPixel(3, 9, 1)
    im.setPixel(13, 13, 1)
    return im
}

function makeCampfire(frame: number): Image {
    let im = image.create(16, 16)
    im.fill(14) // Dark base for ash/wood
    im.drawRect(0, 0, 16, 16, 15) // Border
    // Wood logs at the base
    im.drawLine(3, 13, 12, 13, 4)
    im.drawLine(4, 12, 11, 12, 14)
    // Fire base (red)
    im.fillRect(5, 9, 6, 3, 2)
    // Fire core (orange)
    im.fillRect(6, 7, 4, 4, 4)
    // Fire tips (yellow)
    if (frame == 0) {
        im.drawLine(7, 4, 7, 6, 5)
        im.drawLine(8, 5, 8, 8, 5)
        im.setPixel(6, 6, 5)
        im.setPixel(9, 7, 5)
    } else if (frame == 1) {
        im.drawLine(8, 4, 8, 6, 5)
        im.drawLine(7, 5, 7, 8, 5)
        im.setPixel(9, 6, 5)
        im.setPixel(6, 7, 5)
    } else {
        im.drawLine(7, 5, 7, 7, 5)
        im.drawLine(8, 6, 8, 8, 5)
        im.setPixel(6, 5, 5)
        im.setPixel(9, 6, 5)
    }
    return im
}

/** Scales a 16x16 image down to 8x8 by sampling every 2nd pixel (nearest-neighbor). */
function scaleDownHalf(source: Image): Image {
    let out = image.create(8, 8)
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            out.setPixel(x, y, source.getPixel(x * 2, y * 2))
        }
    }
    return out
}

function initTiles() {
    grassTile = makeGrass()
    dirtTile = makeDirt()
    stoneTile = makeStone()
    bedrockTile = makeBedrock()
    spikesTile = makeSpikes()
    diamondTile = makeDiamond()
    woodTile = makeWood()
    boneTile = makeBone()
    waterTile = makeWater()
    ironOreTile = makeIronOre()
    bricksTile = makeBricks()
    stoneBlockTile = makeStoneBlock()
    timberTile = makeTimber()
    tallGrassTile = makeTallGrass()
    hayTile = makeHay()
    caveEntranceTile = makeCaveEntrance()
    dungeonWallTile = makeDungeonWall()
    keyHoleTile = makeKeyHole()
    dungeonFloorTile = makeDungeonFloor()
    keyTile = makeKey()
    bridgeTile = makeBridge()

    dirtWallTile = bricksTile
    leavesTile = grassTile
    
    campfireFrames = []
    campfireFrames.push(makeCampfire(0))
    campfireFrames.push(makeCampfire(1))
    campfireFrames.push(makeCampfire(2))
    campfireTile = campfireFrames[0]

    tileImages = [
        grassTile, dirtTile, stoneTile, bedrockTile,
        dirtWallTile, spikesTile, diamondTile, woodTile, leavesTile, boneTile, waterTile,
        ironOreTile, bricksTile, stoneBlockTile, timberTile, tallGrassTile, hayTile,
        caveEntranceTile, dungeonWallTile, keyHoleTile, dungeonFloorTile, keyTile, campfireTile,
        bridgeTile
    ]

    // Generate scaled-down 8x8 mini icons from actual tile images
    miniSpikes = scaleDownHalf(spikesTile)
    miniBricks = scaleDownHalf(bricksTile)
    miniStoneBlock = scaleDownHalf(stoneBlockTile)
    miniTimber = scaleDownHalf(timberTile)
    miniHay = scaleDownHalf(hayTile)
    
    // Skeleton mini icon for inventory – small skull face
    miniSkeleton = image.create(8, 8)
    miniSkeleton.fill(0)  // Transparent
    miniSkeleton.fillRect(1, 0, 6, 5, 1)  // Skull shape
    miniSkeleton.setPixel(0, 1, 1)
    miniSkeleton.setPixel(0, 2, 1)
    miniSkeleton.setPixel(7, 1, 1)
    miniSkeleton.setPixel(7, 2, 1)
    miniSkeleton.setPixel(2, 2, 15)  // Left eye
    miniSkeleton.setPixel(5, 2, 15)  // Right eye
    miniSkeleton.setPixel(3, 4, 15)  // Teeth
    miniSkeleton.setPixel(4, 4, 15)
    // Crossbones below
    miniSkeleton.setPixel(1, 6, 1)
    miniSkeleton.setPixel(2, 7, 1)
    miniSkeleton.setPixel(5, 7, 1)
    miniSkeleton.setPixel(6, 6, 1)
    miniSkeleton.setPixel(3, 6, 1)
    miniSkeleton.setPixel(4, 6, 1)
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
    return tileId == DIRT || tileId == STONE || tileId == BEDROCK || tileId == DIRT_WALL || tileId == WOOD || tileId == WATER || 
           tileId == IRON_ORE || tileId == BRICKS || tileId == STONE_BLOCK || tileId == TIMBER || 
           tileId == DUNGEON_WALL || tileId == KEY_HOLE || tileId == CAMPFIRE
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
    // TALL_GRASS replaces leaves in world gen as the source of hay
    if (inBounds(cx - 1, cy) && randint(0, 100) < 70) rawSetTile(cx - 1, cy, TALL_GRASS)
    if (inBounds(cx + 1, cy) && randint(0, 100) < 70) rawSetTile(cx + 1, cy, TALL_GRASS)
    if (inBounds(cx, cy - 1) && randint(0, 100) < 70) rawSetTile(cx, cy - 1, TALL_GRASS)
    if (inBounds(cx, cy + 1) && randint(0, 100) < 70) rawSetTile(cx, cy + 1, TALL_GRASS)
}

/**
 * Procedural Map Generation Algorithm:
 * ------------------------------------
 * Generates the overworld map dynamically every time the game starts.
 * 1. Base initialization (Grass and Bedrock borders).
 * 2. Scatter clusters of trees and resources (Dirt/Stone/Iron/Bone).
 * 3. Drunkard's Walk: Carve a guaranteed passable path from spawn to goal.
 * 4. Goal placement (Diamond) and optional obstacles (Rivers/Dungeons/Tolls).
 */
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

    // 4. Scatter basic resources (Dirt/Stone/Iron Ore) in the lower section of the map
    for (let i2 = 0; i2 < 170 + level * 6; i2++) {
        let bx = randint(4, MAP_W - 5)
        let by = randint(18, MAP_H - 6)
        let rand = randint(0, 100)
        if (rand < 55) rawSetTile(bx, by, DIRT)
        else if (rand < 85) rawSetTile(bx, by, STONE)
        else rawSetTile(bx, by, IRON_ORE)
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
        let rand = randint(0, 100)
        let kind = DIRT
        if (rand > 80) kind = IRON_ORE
        else if (rand > 50) kind = STONE

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

    // Final spawn clearing to ensure player doesn't spawn in a tree
    clearArea(24, 10, 5)

    generateObstacleFeatures(routeX)
}

initTiles()

