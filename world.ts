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

let dirtImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f 5 5 5 5 5 5 5 5 5 5 5 5 5 5 f
    f 4 4 e e 4 4 4 4 4 4 4 4 4 4 f
    f 4 4 4 4 4 4 4 4 4 4 4 4 4 4 f
    f 5 5 5 5 5 5 5 5 5 5 5 5 5 5 f
    f 4 4 4 4 4 4 4 4 4 4 4 4 4 4 f
    f 4 4 4 4 4 e e 4 4 4 4 4 4 4 f
    f 4 4 4 4 4 4 4 4 4 4 4 e e 4 f
    f 4 4 4 4 4 4 4 4 4 4 4 4 4 4 f
    f 5 5 5 5 5 5 5 5 5 5 5 5 5 5 f
    f 4 4 4 4 4 4 4 4 4 4 4 4 4 4 f
    f 4 e e 4 4 4 4 4 4 4 4 4 4 4 f
    f 4 4 4 4 4 4 4 e e 4 4 4 4 4 f
    f 4 4 4 4 4 4 4 4 4 4 4 4 4 4 f
    f 4 4 4 4 4 4 4 4 4 4 4 4 4 4 f
    f f f f f f f f f f f f f f f f
`

let stoneImgLiteral = img`
    f f f f f f b f f f f f f f f f
    f d d d d d b d d d d d d d d f
    f c c c c c b c c c c c c c c f
    f c c c c c b c c c c c c c c f
    f c c c c c b c c c c c c c c f
    b b b b b b b b b b b b b b b b
    f d d d d d d d d d d b d d d f
    f c c c c c c c c c c b c c c f
    f c c c c c c c c c c b c c c f
    f c c c c c c c c c c b c c c f
    b b b b b b b b b b b b b b b b
    f d d b d d d d d d d d d d d f
    f c c b c c c c c c c c c c c f
    f c c b c c c c c c c c c c c f
    f c c b c c c c c c c c c c c f
    f f f b f f f f f f f f f f f f
`

let bedrockImgLiteral = img`
    f f f f f f f f b f f f f f f f
    f f f f f f f f b f f f f f f f
    f f f b f f f f b f f f f f f f
    f f f f b f f f b f f f f f f f
    f f f f f f f f b f f f f f f f
    b b b b b b b b b b b b b b b b
    f f f f b f f f f f f f f f f f
    f f f f b f f f f f f b f f f f
    f f f f b f f f f f f f f f f f
    f f f f b f f f f f f f f f f f
    b b b b b b b b b b b b b b b b
    f f f f f f f f f f f f b f f f
    f f b f f f f f f f f f b f f f
    f f f f f f f b f f f f b f f f
    f f f f f f f f f f f f b f f f
    f f f f f f f f f f f f b f f f
`

let spikesImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f b b b b b b b b b b b b b b f
    f b b b b b b b b b b b b b b f
    f b b b b b b b 1 b b b b b b f
    f b b 1 b b b b d b b b b b b f
    f b b d b b b b c b b b b 1 b f
    f b b c b b b b c d b b b d b f
    f b b c d b b b c d b b b c b f
    f b b c d b b b c d b b b c d f
    f b b c d b b b c d b b b c d f
    f b b c d b b b c d b b b c d f
    f b b c d b b b c d b b b c d f
    f d b c d d d b c d d d b c d f
    f c c c c c c c c c c c c c c f
    f c c c c c c c c c c c c c c f
    f f f f f f f f f f f f f f f f
`

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

function makeDiamond(): Image { return diamondImgLiteral }

let woodImgLiteral = img`
    f f f f 4 f f f f f 4 f f f f f
    f e e e 4 e e e e e 4 e e e e f
    f e e e 4 e 4 4 4 e 4 e e e e f
    f e e e 4 e e e e e 4 e e e e f
    f e e e 4 e e e e e 4 e e e e f
    f e e e 4 e e e e e 4 e e e e f
    f e e e 4 e e e e e 4 e e e e f
    f e 4 4 4 4 e e e e 4 e e e e f
    f e e e 4 e e e e e 4 e e e e f
    f e e e 4 e e e e e 4 e e e e f
    f e e e 4 e e e e e 4 e e e e f
    f e e e 4 e e e e 4 4 4 4 4 e f
    f e e e 4 e e e e e 4 e e e e f
    f e e e 4 e e e e e 4 e e e e f
    f e e e 4 e e e e e 4 e e e e f
    f f f f 4 f f f f f 4 f f f f f
`

let boneImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f d d d d d d d d e d d d d d f
    f d e d d d d d d d d d d d d f
    f d d d d d 1 1 1 1 d d d e d f
    f d d d d 1 1 f f 1 1 d d d d f
    f d d d d d 1 1 1 1 d d d d d f
    f d d d d d 1 f f 1 d d d d d f
    f d d d d d d d d d d d d d d f
    f d d 1 1 d d d d d d 1 1 d d f
    f d d d d 1 1 d d 1 1 d d d d f
    f d d d d d d 1 1 d d d d d d f
    f d d d d d d 1 1 d d d d d d f
    f e d d d 1 1 d d 1 1 d d d d f
    f d d 1 1 d d d d d d 1 1 d d f
    f d d d d d d d d d d d d d d f
    f f f f f f f f f f f f f f f f
`

let ironOreImgLiteral = img`
    f f f f f f f f b f f f f f f f
    f c c c c c c c b c c c c c c f
    f c 4 4 4 c c c b c c c c c c f
    f c 4 e 4 c c c b c 4 e 4 c c f
    f c 4 4 4 c c c b c 4 4 4 c c f
    f c c c c c c c b c c c c c c f
    f c c c c c c c b c c c c c c f
    b b b b b b b b b b b b b b b b
    f c c c b c c c c c c c c c c f
    f c c c b c c c c c c c c c c f
    f c c c b 4 4 4 4 c c c c c c f
    f c c c b 4 e e 4 c c c 4 4 c f
    f c c c b 4 4 4 4 c c c 4 4 c f
    f c c c b c c c c c c c c c c f
    f c c c b c c c c c c c c c c f
    f f f f b f f f f f f f f f f f
`

let bricksImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f 4 4 f 4 4 4 4 4 4 4 f 4 4 4 f
    f 4 4 f 4 4 4 4 4 4 4 f 4 4 4 f
    f f f f f f f f f f f f f f f f
    f 4 4 4 4 4 4 f 4 4 4 4 4 4 4 f
    f 4 4 4 4 4 4 f 4 4 4 4 4 4 4 f
    f 4 4 4 4 4 4 f 4 4 4 4 4 4 4 f
    f f f f f f f f f f f f f f f f
    f 4 4 f 4 4 4 4 4 4 4 f 4 4 4 f
    f 4 4 f 4 4 4 4 4 4 4 f 4 4 4 f
    f 4 4 f 4 4 4 4 4 4 4 f 4 4 4 f
    f f f f f f f f f f f f f f f f
    f 4 4 4 4 4 4 f 4 4 4 4 4 4 4 f
    f 4 4 4 4 4 4 f 4 4 4 4 4 4 4 f
    f 4 4 4 4 4 4 f 4 4 4 4 4 4 4 f
    f f f f f f f f f f f f f f f f
`

let stoneBlockImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f c c c c c c c c c c c c c c f
    f c d d d d d d d d d d d d c f
    f c d c c c c c c c c c c b c f
    f c d c d d d d d d d d c b c f
    f c d c d c c c c c c b c b c f
    f c d c d c c c c c c b c b c f
    f c d c d c c b c c c b c b c f
    f c d c d c c c d c c b c b c f
    f c d c d c c c c c c b c b c f
    f c d c d c c c c c c b c b c f
    f c d c d b b b b b b b c b c f
    f c d c c c c c c c c c c b c f
    f c d b b b b b b b b b b b c f
    f c c c c c c c c c c c c c c f
    f f f f f f f f f f f f f f f f
`

let timberImgLiteral = img`
    f f 4 4 4 f f f f f f f f f f f
    f 4 e e e 4 e 4 4 4 4 4 4 4 4 f
    f 4 e e e 4 e e e e e e e e e f
    f 4 e e e 4 e 4 4 4 4 4 4 4 4 f
    f e 4 4 4 e e e e e e e e e e f
    f f 4 4 4 f f f f f f f f f f f
    f 4 e e e 4 e e e e e e e e e f
    f 4 e e e 4 e 4 4 4 4 4 4 4 4 f
    f 4 e e e 4 e e e e e e e e e f
    f e 4 4 4 e e e e e e e e e e f
    f f f f f f f f f f f f f f f f
    f e 4 4 4 e e e e e e e e e e f
    f 4 e e e 4 e 4 4 4 4 4 4 4 4 f
    f 4 e e e 4 e e e e e e e e e f
    f 4 e e e 4 e 4 4 4 4 4 4 4 4 f
    f f 4 4 4 f f f f f f f f f f f
`

let bridgeImgLiteral = img`
    e e e e e e e e e e e e e e e e
    e 4 e e e e e e e e e e e e 4 e
    e e e 4 4 4 4 e e e e e e e e e
    f f f f f f f f f f f f f f f f
    e e e e e e e e e e e e e e e e
    e 4 e e e e e e e e e e e e 4 e
    e e e e e e e e e 4 4 4 4 e e e
    f f f f f f f f f f f f f f f f
    e e e e e e e e e e e e e e e e
    e 4 e e e e e e e e e e e e 4 e
    e e e e 4 4 4 4 4 e e e e e e e
    f f f f f f f f f f f f f f f f
    e e e e e e e e e e e e e e e e
    e 4 e e e e e e e e e e e e 4 e
    e e e e e e e e 4 4 4 4 e e e e
    f f f f f f f f f f f f f f f f
`

let tallGrassImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f 7 7 7 7 7 7 7 7 7 7 7 7 7 7 f
    f 7 7 7 7 7 7 7 7 7 7 7 7 7 7 f
    f 7 7 7 7 7 7 7 7 7 7 a 7 7 7 f
    f 7 7 7 7 a 7 7 7 7 7 6 7 7 7 f
    f 7 7 7 7 6 7 7 a 7 7 6 7 7 7 f
    f 7 a 7 7 6 7 7 6 7 7 6 7 7 a f
    f 7 6 7 7 6 7 7 6 7 7 6 7 7 6 f
    f 7 6 7 7 6 7 7 6 7 7 6 7 7 6 f
    f 7 6 7 7 6 7 7 6 7 7 6 7 7 6 f
    f 7 6 7 7 6 7 7 6 7 7 6 7 7 6 f
    f 7 6 7 7 6 7 7 6 7 7 6 7 7 6 f
    f 7 6 7 7 6 7 7 6 7 7 6 7 7 6 f
    f 4 6 7 4 6 7 4 6 7 4 6 7 4 6 f
    f 4 4 4 4 4 4 4 4 4 4 4 4 4 4 f
    f f f f f f f f f f f f f f f f
`

let hayImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f 5 d 5 4 e 5 d 5 5 5 4 5 d 5 f
    f e 5 5 4 5 e 5 5 5 5 4 e 5 5 f
    f 5 e 5 4 5 5 e 5 5 5 4 5 e 5 f
    f 5 5 e 4 5 5 5 e 5 5 4 5 5 e f
    f 5 5 5 4 5 5 5 5 e 5 4 5 5 5 f
    f 5 5 5 4 5 5 5 5 5 e 4 5 5 5 f
    f 5 5 5 4 e 5 5 5 5 5 4 5 5 5 f
    f e 5 5 4 5 e 5 5 5 5 4 e 5 5 f
    f 5 e 5 4 5 5 e 5 5 5 4 5 e 5 f
    f 5 5 e 4 5 5 5 e 5 5 4 5 5 e f
    f 5 5 5 4 5 5 5 5 e 5 4 5 5 5 f
    f 5 5 5 4 5 5 5 5 5 e 4 5 5 5 f
    f 5 5 5 4 5 5 5 5 5 5 4 5 5 5 f
    f 5 5 d 4 5 5 5 d 5 5 4 5 5 d f
    f f f f f f f f f f f f f f f f
`

let caveEntranceImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f d d d d d d d d d d d d d d f
    f d c c c c c c c c c c c c b f
    f d c c c c b f f b c c c c b f
    f d c c c b f f f f b c c c b f
    f d c c b f f f f f f b c c b f
    f d c c f f f f f f f f c c b f
    f d c c f f f f f f f f c c b f
    f d c c f f f f f f f f c c b f
    f d c c f f f f f f f f c c b f
    f d c c f f f f f f f f c c b f
    f d c c f f f f f f f f c c b f
    f d c c f f f f f f f f c c b f
    f d c c f f f f f f f f c c b f
    f d b b f f f f f f f f b b b f
    f f f f f f f f f f f f f f f f
`

let dungeonWallImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f b b b b b b b f b b b b b b f
    f b b b b b b b f b b b b b b f
    f b b b b b b b f b b b b b b f
    f b b b b b b b f b b b b b b f
    f b b b b b b b f b b b b b b f
    f b b b b b b b f b b b b b b f
    f b b b b b b b f b b b b b b f
    f f f f f f f f f f f f f f f f
    f b b b f b b b b b b b f b b f
    f b b b f b b b b b b b f b b f
    f b b b f b b b b b b b f b b f
    f b b b f b b b b b b b f b b f
    f b b b f b b b b b b b f b b f
    f b b b f b b b b b b b f b b f
    f f f f f f f f f f f f f f f f
`

let keyHoleImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f b b b b b b b f b b b b b b f
    f b b b b b b b f b b b b b b f
    f b b b b b b b f b b b b b b f
    f b b b b b b b f b b b b b b f
    f b b b b b b b f b b b b b b f
    f b b b b b b f f b b b b b b f
    f b b b b b b f f b b b b b b f
    f f f f f f f f f f f f f f f f
    f b b b f b f f f f b b f b b f
    f b b b f b f f f f b b f b b f
    f b b b f b f f f f b b f b b f
    f b b b f b b b b b b b f b b f
    f b b b f b b b b b b b f b b f
    f b b b f b b b b b b b f b b f
    f f f f f f f f f f f f f f f f
`

let dungeonFloorImgLiteral = img`
    c c c c c c c c c c c c c c c c
    c 1 1 1 1 1 1 1 c 1 1 1 1 1 1 c
    c d d d d d d d c d d d d d d c
    c d d d d d d d c d d d d d d c
    c d d c d d d d c d d d d d d c
    c d d d c d d d c d d d d d d c
    c d d d d d d d c d d d d d d c
    c d d d d d d d c d d d d d d c
    c c c c c c c c c c c c c c c c
    c 1 1 1 1 1 1 1 c 1 1 1 1 1 1 c
    c d d d d d d d c d d d d d d c
    c d d d d d d d c d d d d d d c
    c d d d d d d d c d d c d d d c
    c d d d d d d d c d d d d d d c
    c d d d d d d d c d d d d d d c
    c c c c c c c c c c c c c c c c
`

let keyImgLiteral = img`
    c c c c c c c c c c c c c c c c
    c 1 1 1 1 1 1 5 5 5 1 1 1 1 1 c
    c d d d d d 5 d c d 5 d d d d c
    c d d d d 5 d d c d d 5 d d d c
    c d d c d 5 d 5 e 5 d 5 d d d c
    c d d d c 5 d d c d d 5 d d d c
    c d d d d d 5 d c d 5 d d d d c
    c d d d d d d 5 e 5 d d d d d c
    c c c c c c c c 5 c c c c c c c
    c 1 1 1 1 1 1 1 5 1 1 1 1 1 1 c
    c d d d d d d d 5 d d d d d d c
    c d d d d d d d 5 5 5 d d d d c
    c d d d d d d d 5 d 5 c d d d c
    c d d d d d d d 5 5 5 5 d d d c
    c d d d d d d d c d d 5 d d d c
    c c c c c c c c c c c c c c c c
`

let waterImgLiteral = img`
    8 8 8 8 8 8 8 8 8 8 8 8 8 8 8 8
    8 8 8 8 1 8 8 8 8 8 8 8 8 8 8 8
    8 8 9 9 9 9 8 8 8 8 8 8 8 8 8 8
    9 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9
    8 8 8 8 8 8 8 8 8 8 8 8 8 8 8 8
    8 8 8 8 8 8 8 8 8 8 8 8 8 8 8 8
    8 8 8 8 8 8 8 8 8 8 9 9 9 9 9 8
    6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6
    8 8 8 8 8 8 8 8 8 8 8 8 8 8 8 8
    8 8 8 1 8 8 8 8 8 8 8 8 8 8 8 8
    8 9 9 9 9 9 9 8 8 8 8 8 8 8 8 8
    9 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9
    8 8 8 8 8 8 8 8 8 8 8 8 8 8 8 8
    8 8 8 8 8 8 8 8 8 8 8 8 8 1 8 8
    8 8 8 8 8 8 8 8 8 8 8 9 9 9 9 9
    8 8 8 8 8 8 8 8 8 8 8 8 8 8 8 8
`

let campfire0ImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f e e e e e e e e e e e e e e f
    f e e e e e e e e e e e e e e f
    f e e e e e e e e e e e e e e f
    f e e e e e e 5 e e e e e e e f
    f e e e e e e 5 5 e e e e e e f
    f e e e e e 5 5 5 e e e e e e f
    f e e e e e 4 4 5 5 e e e e e f
    f e e e e e 4 4 5 4 e e e e e f
    f e e e e 2 4 4 4 4 2 e e e e f
    f e e e e 2 4 4 4 4 2 e e e e f
    f e e e e 2 2 2 2 2 2 e e e e f
    f e e e e e e e e e e e e e e f
    f e e 4 4 4 4 4 4 4 4 4 4 e e f
    f e e e e e e e e e e e e e e f
    f f f f f f f f f f f f f f f f
`

let campfire1ImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f e e e e e e e e e e e e e e f
    f e e e e e e e e e e e e e e f
    f e e e e e e e e e e e e e e f
    f e e e e e e e 5 e e e e e e f
    f e e e e e e 5 5 e e e e e e f
    f e e e e e e 5 5 5 e e e e e f
    f e e e e e 5 5 4 4 e e e e e f
    f e e e e e 4 5 4 4 e e e e e f
    f e e e e 2 4 4 4 4 2 e e e e f
    f e e e e 2 4 4 4 4 2 e e e e f
    f e e e e 2 2 2 2 2 2 e e e e f
    f e e e e e e e e e e e e e e f
    f e e 4 4 4 4 4 4 4 4 4 4 e e f
    f e e e e e e e e e e e e e e f
    f f f f f f f f f f f f f f f f
`

let campfire2ImgLiteral = img`
    f f f f f f f f f f f f f f f f
    f e e e e e e e e e e e e e e f
    f e e e e e e e e e e e e e e f
    f e e e e e e e e e e e e e e f
    f e e e e e e e e e e e e e e f
    f e e e e e 5 5 e e e e e e e f
    f e e e e e e 5 5 5 e e e e e f
    f e e e e e 4 5 5 4 e e e e e f
    f e e e e e 4 4 5 4 e e e e e f
    f e e e e 2 4 4 4 4 2 e e e e f
    f e e e e 2 4 4 4 4 2 e e e e f
    f e e e e 2 2 2 2 2 2 e e e e f
    f e e e e e e e e e e e e e e f
    f e e 4 4 4 4 4 4 4 4 4 4 e e f
    f e e e e e e e e e e e e e e f
    f f f f f f f f f f f f f f f f
`


function makeDirt(): Image { return dirtImgLiteral }
function makeStone(): Image { return stoneImgLiteral }
function makeBedrock(): Image { return bedrockImgLiteral }
function makeSpikes(): Image { return spikesImgLiteral }
function makeWood(): Image { return woodImgLiteral }
function makeBone(): Image { return boneImgLiteral }
function makeIronOre(): Image { return ironOreImgLiteral }
function makeBricks(): Image { return bricksImgLiteral }
function makeStoneBlock(): Image { return stoneBlockImgLiteral }
function makeTimber(): Image { return timberImgLiteral }
function makeBridge(): Image { return bridgeImgLiteral }
function makeTallGrass(): Image { return tallGrassImgLiteral }
function makeHay(): Image { return hayImgLiteral }
function makeCaveEntrance(): Image { return caveEntranceImgLiteral }
function makeDungeonWall(): Image { return dungeonWallImgLiteral }
function makeKeyHole(): Image { return keyHoleImgLiteral }
function makeDungeonFloor(): Image { return dungeonFloorImgLiteral }
function makeKey(): Image { return keyImgLiteral }
function makeWater(): Image { return waterImgLiteral }
function makeCampfire(frame: number): Image {
    if (frame == 0) return campfire0ImgLiteral;
    if (frame == 1) return campfire1ImgLiteral;
    return campfire2ImgLiteral;
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

