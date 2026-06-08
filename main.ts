/**
 * ============================================================================
 * MINEKRAFT - MakeCode Arcade TypeScript Source (CORE API SAFE VERSION)
 * ============================================================================
 * * GAME DESIGN & MECHANICS:
 * ------------------------
 * Minekraft is a top-down survival exploration game. The objective is to navigate
 * a procedurally generated map, harvest resources, build defensive structures, 
 * avoid chasing zombies, and reach the Diamond tile to progress.
 * * * INSTANT ACTION & SMART BUILD SYSTEM:
 * --------------------------------------
 * Pressing A instantly harvests the tile the player is facing. If building,
 * it attempts the front tile, then auto-searches the 8 surrounding tiles to
 * find a valid grass spot, creating a reliable, fluid action mechanic.
 * * * ADVANCED BIT-PACKED SAVE SYSTEM:
 * ----------------------------------
 * To protect hardware memory, the 2304-tile grid is bit-packed (6 tiles per int)
 * reducing the save size to a highly efficient 384-length NumberArray.
 * ============================================================================
 */

// --------------------------------------------------------------------------
// GLOBAL CONSTANTS
// Map sizing, Tile indices, and Tunable Game Variables
// --------------------------------------------------------------------------
const MAP_W = 48
const MAP_H = 48
const TILE = 16

const GRASS = 0
const DIRT = 1
const STONE = 2
const BEDROCK = 3
const DIRT_WALL = 4
const SPIKES = 5
const DIAMOND = 6
const WOOD = 7
const LEAVES = 8
const BONE = 9

const MAT_DIRT = 0
const MAT_STONE = 1
const MAT_WOOD = 2
const MAT_LEAVES = 3
const MAT_BONE = 4
const MAT_SAVE = 5

const TITLE = 0
const OPTIONS = 1
const INTRO = 2
const PLAYING = 3
const VICTORY = 4
const GAMEOVER = 5
const SAVING = 6
const LOADING = 7
const DIFFICULTY = 8

const PLAYER_SPEED = 80
const DEMO_SPEED = 60
const DEMO_DIAGONAL_SPEED = 42
const INFINITY = 0
const MUSIC_TEMPO = 130

// --------------------------------------------------------------------------
// GLOBAL STATE
// --------------------------------------------------------------------------
let gameState = TITLE
let titleChoice = 0
let optionChoice = 0
let difficultyChoice = 0
let diffZombieSpeedLevel = 3
let diffZombieCountOffset = 0
let selectedLevels = 1
let selectedHealth = 5
let demoMode = false
let demoPaused = false
let demoActionCooldown = 0
let demoHarvestCooldown = 0
let demoWaypointCol = 24
let demoWaypointRow = 10
let demoWaypointUntil = 0
let demoPauseUntil = 0
let demoRecoveryUntil = 0
let demoMoveUntil = 0
let demoHeldVx = 0
let demoHeldVy = 0
let demoRerouteCooldown = 0
let demoModeState = 0
let demoStateUntil = 0
let demoStuckCount = 0
let demoTrajectoryStartCol = 0
let demoTrajectoryStartRow = 0
let demoTrajectoryEndCol = 0
let demoTrajectoryEndRow = 0
let demoTrajectoryUntil = 0
let demoTrajectoryLen = 14
let demoLastCol = 0
let demoLastRow = 0
let demoLastPosCheck = 0
let demoNoProgressCount = 0
let demoLastMoveX = 0
let demoLastMoveY = 0
let demoReverseCount = 0
let demoEscapeUntil = 0
let demoEscapeVx = 0
let demoEscapeVy = 0
let demoBuildCooldown = 0
let demoStartedAt = 0
let demoSeekDiamond = false
let level = 1
let firstTheme = 0
let theme = 0
let musicToken = 0

let invDirt = 0
let invStone = 0
let invWood = 0
let invLeaves = 0
let invBones = 0
let selectedMat = MAT_DIRT
let inventoryOpen = false

let facingDx = 1
let facingDy = 0
let invincible = false
let maxZombies = 5

let goalCol = 0
let goalRow = 0

let player: Sprite = null
let targetCursor: Sprite = null
let diamondMarker: Sprite = null
let playerAnim = ""
let playerAttackUntil = 0

// Scrolling UI Buffer tracking
let menuScrollY = 0
let menuView = image.create(144, 60)

// Save State Trackers
const saveChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
let saveNameIndices = [0, 0, 0]
let saveNamePos = 0
let loadChoices: string[] = []
let loadChoicePos = 0

// Arrays for zombie tracking. Properly cleaned up on destruction to prevent leaks.
let zombieRefs: Sprite[] = []
let zombieModes: number[] = []

// Arrays for skeleton tracking
let skeletonRefs: Sprite[] = []
let skeletonTargets: Sprite[] = []

namespace SpriteKind {
    export const Skeleton = SpriteKind.create()
}

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
let tileImages: Image[] = []

// Pre-initialize basic tiles so rendering functions have valid image references.
initTiles()

// --------------------------------------------------------------------------
// Core-API Safe Animation System
// Bypasses the need for standard extensions to guarantee successful compile.
// --------------------------------------------------------------------------
function flipX(source: Image): Image {
    let out = image.create(16, 16)
    for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
            out.setPixel(15 - x, y, source.getPixel(x, y))
        }
    }
    return out
}

let pDownFlipped = flipX(pDown)
let pDown1Flipped = flipX(pDown1)
let pDown2Flipped = flipX(pDown2)
let pSideFlipped = flipX(pSide)
let pAttackFlipped = flipX(pAttack)

let animSprites: Sprite[] = []
let animFrames: Image[][] = []
let animIntervals: number[] = []
let animTimers: number[] = []
let animIndices: number[] = []
let animLoops: boolean[] = []

function playCoreAnimation(target: Sprite, frames: Image[], interval: number, loop: boolean) {
    if (!target) return
    let found = false
    for (let i = 0; i < animSprites.length; i++) {
        if (animSprites[i] == target) {
            animFrames[i] = frames
            animIntervals[i] = interval
            animTimers[i] = game.runtime() + interval
            animIndices[i] = 0
            animLoops[i] = loop
            found = true
            break
        }
    }
    if (!found) {
        animSprites.push(target)
        animFrames.push(frames)
        animIntervals.push(interval)
        animTimers.push(game.runtime() + interval)
        animIndices.push(0)
        animLoops.push(loop)
    }
    target.setImage(frames[0])
}

function stopCoreAnimation(target: Sprite) {
    if (!target) return
    for (let i = 0; i < animSprites.length; i++) {
        if (animSprites[i] == target) {
            animSprites.splice(i, 1)
            animFrames.splice(i, 1)
            animIntervals.splice(i, 1)
            animTimers.splice(i, 1)
            animIndices.splice(i, 1)
            animLoops.splice(i, 1)
            break
        }
    }
}

/** Ticks all active manual animations bound to the global loop. */
function tickCoreAnimations() {
    for (let i = animSprites.length - 1; i >= 0; i--) {
        let target = animSprites[i]

        // Memory-safe cleanup check
        if (!target) {
            animSprites.splice(i, 1)
            animFrames.splice(i, 1)
            animIntervals.splice(i, 1)
            animTimers.splice(i, 1)
            animIndices.splice(i, 1)
            animLoops.splice(i, 1)
            continue
        }

        if (animFrames[i].length > 1 && game.runtime() > animTimers[i]) {
            animIndices[i]++
            if (animIndices[i] >= animFrames[i].length) {
                if (animLoops[i]) animIndices[i] = 0
                else animIndices[i] = animFrames[i].length - 1
            }
            target.setImage(animFrames[i][animIndices[i]])
            animTimers[i] = game.runtime() + animIntervals[i]
        }
    }
}

function setPlayerAnim(name: string, frames: Image[], interval: number, loop: boolean) {
    if (player == null || playerAnim == name) return
    playerAnim = name
    if (frames.length == 1) {
        stopCoreAnimation(player)
        player.setImage(frames[0])
    } else {
        playCoreAnimation(player, frames, interval, loop)
    }
}

function updatePlayerAnim() {
    if (player == null || gameState != PLAYING || game.runtime() < playerAttackUntil) return

    let moving = player.vx != 0 || player.vy != 0

    if (!moving) {
        if (facingDy < 0) setPlayerAnim("idle-up", [pUp], 120, false)
        else if (facingDx < 0) setPlayerAnim("idle-left", [pDownFlipped], 120, false)
        else if (facingDx > 0) setPlayerAnim("idle-right", [pDown], 120, false)
        else setPlayerAnim("idle-down", [pDown], 120, false)
        return
    }

    if (Math.abs(player.vx) > Math.abs(player.vy)) {
        if (player.vx < 0) setPlayerAnim("walk-left", [pDown1Flipped, pDownFlipped, pDown2Flipped, pDownFlipped], 130, true)
        else setPlayerAnim("walk-right", [pDown1, pDown, pDown2, pDown], 130, true)
    } else {
        if (player.vy < 0) setPlayerAnim("walk-up", [pUp1, pUp, pUp2, pUp], 140, true)
        else setPlayerAnim("walk-down", [pDown1, pDown, pDown2, pDown], 140, true)
    }
}

function playPlayerAttack(dx: number, dy: number) {
    if (player == null) return
    playerAttackUntil = game.runtime() + 220
    playerAnim = "attack"

    if (dx < 0) {
        playCoreAnimation(player, [pAttackFlipped, pDownFlipped], 110, false)
    } else if (dx > 0) {
        playCoreAnimation(player, [pAttack, pDown], 110, false)
    } else if (dy < 0) {
        playCoreAnimation(player, [pAttackUp, pUp], 110, false)
    } else {
        playCoreAnimation(player, [pAttackDown, pDown], 110, false)
    }
}

// --------------------------------------------------------------------------
// Math Helpers (Core API Compliance)
// --------------------------------------------------------------------------
function getSign(val: number): number {
    if (val > 0) return 1
    if (val < 0) return -1
    return 0
}

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
    tileImages = [
        grassTile, dirtTile, stoneTile, bedrockTile,
        dirtWallTile, spikesTile, diamondTile, woodTile, leavesTile, boneTile
    ]
}

// --------------------------------------------------------------------------
// Level theme and procedural music generation.
// --------------------------------------------------------------------------
function chooseTheme() {
    if (level == 1) {
        firstTheme = randint(0, 3)
        theme = firstTheme
    } else {
        theme = (firstTheme + level - 1) % 4
    }
}

function boundedIndex(value: number, length: number): number {
    let result = value % length
    if (result < 0) result += length
    return result
}

function stepDown(scale: string[], note: string): string {
    let index = 0
    for (let i = 0; i < scale.length; i++) if (scale[i] == note) index = i
    if (index <= 0) return scale[0]
    return scale[index - 1]
}

function appendMotif(target: string[], motif: string[]) {
    for (let i = 0; i < motif.length; i++) target.push(motif[i])
}

function makeMotif(scale: string[], home: string, seed: number): string[] {
    return [
        home, scale[boundedIndex(seed, scale.length)], scale[boundedIndex(seed + 2, scale.length)],
        scale[boundedIndex(seed + 4, scale.length)], scale[boundedIndex(seed + 2, scale.length)],
        scale[boundedIndex(seed, scale.length)], home, stepDown(scale, home)
    ]
}

function mutateMotif(motif: string[], scale: string[], seed: number): string[] {
    let out: string[] = []
    for (let i = 0; i < 8; i++) {
        if (i == 3 || i == 4) out.push(scale[boundedIndex(seed + i * 3, scale.length)])
        else out.push(motif[i])
    }
    return out
}

function makeBassMotif(scale: string[], seed: number): string[] {
    return [
        scale[0], scale[0], scale[1], scale[0],
        scale[2], scale[2], scale[boundedIndex(seed + 3, scale.length)], scale[2]
    ]
}

function makeCadence(scale: string[], home: string, seed: number): string[] {
    return [
        scale[boundedIndex(seed + 1, scale.length)], scale[boundedIndex(seed + 2, scale.length)],
        scale[boundedIndex(seed + 3, scale.length)], scale[boundedIndex(seed + 2, scale.length)],
        stepDown(scale, home), home, stepDown(scale, home),
    ]
}

function generateTune(themeId: number, levelNo: number): string[] {
    let scale: string[] = []
    let home = "C4"

    if (themeId == 0) {
        scale = ["D4", "E4", "G4", "A4", "B4", "C5"]
        home = "E4"
    } else if (themeId == 1) {
        scale = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]
        home = "C4"
    } else if (themeId == 2) {
        scale = ["D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4", "E4"]
        home = "G3"
    } else {
        scale = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]
        home = "A4"
    }

    let motif = makeMotif(scale, home, levelNo + themeId * 17)
    let tune: string[] = []
    appendMotif(tune, motif)
    appendMotif(tune, mutateMotif(motif, scale, levelNo + themeId * 31))
    appendMotif(tune, makeBassMotif(scale, levelNo + themeId * 47))
    appendMotif(tune, makeCadence(scale, home, levelNo + themeId * 59))
    return tune
}

function playTunePart(tune: string[], start: number, tempo: number) {
    music.playMelody(
        tune[start] + " " + tune[start + 1] + " " + tune[start + 2] + " " + tune[start + 3] + " " +
        tune[start + 4] + " " + tune[start + 5] + " " + tune[start + 6] + " " + tune[start + 7] + " ",
        tempo
    )
}

function playGeneratedTune(tune: string[], token: number) {
    if (musicToken != token) return
    playTunePart(tune, 0, MUSIC_TEMPO)
    if (musicToken != token) return
    playTunePart(tune, 8, MUSIC_TEMPO)
    if (musicToken != token) return
    playTunePart(tune, 16, MUSIC_TEMPO)
    if (musicToken != token) return
    playTunePart(tune, 24, MUSIC_TEMPO)
}

function playLevelMusic() {
    if (demoMode) return

    musicToken += 1
    let myToken = musicToken
    let tune = generateTune(theme, level)

    control.runInParallel(function () {
        while (gameState == PLAYING && myToken == musicToken) {
            playGeneratedTune(tune, myToken)
            pause(10)
        }
    })
}

function stopLevelMusic() {
    musicToken += 1
    music.stopAllSounds()
}

/**
 * RPG-style damage sound using raw frequencies.
 */
function playDamageSound() {
    control.runInParallel(function () {
        music.playTone(196, 50)
        music.playTone(131, 50)
        music.playTone(87, 100)
    })
}

/**
 * RPG-style Game Over jingle (melancholic arpeggio).
 */
function playDeathSound() {
    stopLevelMusic()
    control.runInParallel(function () {
        music.playMelody("C4 G3 D3 C3 - - - -", 100)
    })
}

/**
 * RPG-style Victory fanfare using raw frequencies.
 */
function playVictoryJingle() {
    stopLevelMusic()
    control.runInParallel(function () {
        music.playTone(523, music.beat(BeatFraction.Eighth))
        music.playTone(392, music.beat(BeatFraction.Eighth))
        music.playTone(330, music.beat(BeatFraction.Eighth))
        music.playTone(523, music.beat(BeatFraction.Half))
        music.playMelody("E G B C5 - - - -", 150)
    })
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
    return tileId == DIRT || tileId == STONE || tileId == BEDROCK || tileId == DIRT_WALL || tileId == WOOD
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
    for (let col = 0; col < MAP_W; col++) {
        for (let row = 0; row < MAP_H; row++) {
            rawSetTile(col, row, GRASS)
        }
    }

    for (let col2 = 0; col2 < MAP_W; col2++) {
        rawSetTile(col2, 0, BEDROCK)
        rawSetTile(col2, MAP_H - 1, BEDROCK)
    }

    for (let row2 = 0; row2 < MAP_H; row2++) {
        rawSetTile(0, row2, BEDROCK)
        rawSetTile(MAP_W - 1, row2, BEDROCK)
    }

    for (let i = 0; i < 70 + level * 3; i++) {
        let tx = randint(2, MAP_W - 3)
        let ty = randint(2, MAP_H - 3)
        if (Math.abs(tx - 24) > 5 || Math.abs(ty - 10) > 5) makeTree(tx, ty)
    }

    for (let i2 = 0; i2 < 170 + level * 6; i2++) {
        let bx = randint(4, MAP_W - 5)
        let by = randint(18, MAP_H - 6)
        if (randint(0, 100) < 65) rawSetTile(bx, by, DIRT)
        else rawSetTile(bx, by, STONE)
    }

    for (let i3 = 0; i3 < 85 + level * 3; i3++) {
        let bx = randint(4, MAP_W - 5)
        let by = randint(18, MAP_H - 6)
        rawSetTile(bx, by, BONE)
    }

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

    let routeX = 24
    let routeY = 10

    while (routeY < 42) {
        clearArea(routeX, routeY, 2)

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

        routeY += randint(2, 4)
        clearArea(routeX, routeY, 2)
    }

    clearArea(routeX, 44, 4)
    goalCol = routeX
    goalRow = 44
    rawSetTile(goalCol, goalRow, DIAMOND)

    for (let gx = routeX - 4; gx <= routeX + 4; gx++) {
        if (inBounds(gx, 40)) rawSetTile(gx, 40, STONE)
    }

    rawSetTile(routeX, 40, GRASS)
    rawSetTile(routeX - 1, 40, GRASS)
    rawSetTile(routeX + 1, 40, GRASS)
    clearArea(24, 10, 5)
}

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
    let zombies = sprites.allOfKind(SpriteKind.Enemy)
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
    let doPathing = (pathUpdateCounter % 15 == 0)

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
            
            let walkSpeed = 40
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
// Player grid position and targeting helpers.
// --------------------------------------------------------------------------
function playerCol(): number {
    if (player == null) return 0
    return Math.floor(player.x / TILE)
}

function playerRow(): number {
    if (player == null) return 0
    return Math.floor(player.y / TILE)
}

function updateFacing() {
    if (inventoryOpen || gameState != PLAYING) return

    if (controller.left.isPressed()) {
        facingDx = -1
        facingDy = 0
    } else if (controller.right.isPressed()) {
        facingDx = 1
        facingDy = 0
    } else if (controller.up.isPressed()) {
        facingDx = 0
        facingDy = -1
    } else if (controller.down.isPressed()) {
        facingDx = 0
        facingDy = 1
    }
}

function updateTargetCursor() {
    if (targetCursor == null) return

    if (gameState != PLAYING || demoMode || inventoryOpen) {
        targetCursor.setFlag(SpriteFlag.Invisible, true)
        return
    }

    targetCursor.setFlag(SpriteFlag.Invisible, false)
    targetCursor.setPosition((playerCol() + facingDx) * TILE + 8, (playerRow() + facingDy) * TILE + 8)
}

// --------------------------------------------------------------------------
// Resource and building logic (Smart Targeting Mechanics)
// --------------------------------------------------------------------------
function isHarvestable(id: number): boolean {
    return id == DIRT || id == STONE || id == DIRT_WALL || id == SPIKES || id == WOOD || id == LEAVES || id == BONE
}

function matCount(): number {
    if (selectedMat == MAT_DIRT) return invDirt
    else if (selectedMat == MAT_STONE) return invStone
    else if (selectedMat == MAT_WOOD) return invWood
    else if (selectedMat == MAT_LEAVES) return invLeaves
    else return invBones
}

function selectedTile(): number {
    if (selectedMat == MAT_DIRT) return DIRT_WALL
    else if (selectedMat == MAT_STONE) return SPIKES
    else if (selectedMat == MAT_WOOD) return WOOD
    else if (selectedMat == MAT_LEAVES) return LEAVES
    else return BONE
}

function breakEffect(col: number, row: number) {
    let fx = sprites.create(blank16, SpriteKind.Food)
    fx.setPosition(col * TILE + 8, row * TILE + 8)
    fx.lifespan = 250
    fx.startEffect(effects.disintegrate, 250)
}

function buildBlock(col: number, row: number, dirX: number, dirY: number) {
    if (selectedMat == MAT_DIRT) {
        invDirt += -1
        setTile(col, row, DIRT_WALL)
    } else if (selectedMat == MAT_STONE) {
        invStone += -1
        setTile(col, row, SPIKES)
    } else if (selectedMat == MAT_WOOD) {
        invWood += -1
        setTile(col, row, WOOD)
    } else if (selectedMat == MAT_LEAVES) {
        invLeaves += -1
        setTile(col, row, LEAVES)
    } else if (selectedMat == MAT_BONE) {
        invBones += -1
        spawnSkeleton(col, row)
    }

    playPlayerAttack(dirX, dirY)
    music.playTone(175, 50)
}

/** * Instant action executor. Tries to harvest the exact tile faced first.
 * If blocked and building, automatically finds the nearest available surrounding grass.
 */
function performTargetAction() {
    if (player == null) return

    let frontCol = playerCol() + facingDx
    let frontRow = playerRow() + facingDy
    let frontId = getTileId(frontCol, frontRow)

    if (isHarvestable(frontId)) {
        if (frontId == DIRT || frontId == DIRT_WALL) invDirt += 1
        else if (frontId == STONE || frontId == SPIKES) invStone += 1
        else if (frontId == WOOD) invWood += 1
        else if (frontId == LEAVES) invLeaves += 1
        else if (frontId == BONE) invBones += 1

        setTile(frontCol, frontRow, GRASS)
        playPlayerAttack(facingDx, facingDy)
        music.playTone(262, 50)
        return
    }

    if (matCount() > 0 && selectedMat != MAT_SAVE) {
        if (frontId == GRASS) {
            buildBlock(frontCol, frontRow, facingDx, facingDy)
            return
        }

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx == 0 && dy == 0) continue
                let c = playerCol() + dx
                let r = playerRow() + dy

                if (getTileId(c, r) == GRASS) {
                    buildBlock(c, r, dx, dy)
                    return
                }
            }
        }
    }
}

// --------------------------------------------------------------------------
// Demo mode AI. Upgraded to natural 8-way diagonal steering.
// --------------------------------------------------------------------------
function isDemoActive(): boolean {
    return demoMode && gameState == PLAYING
}

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
    return id == GRASS || id == DIAMOND
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

function chooseDemoTrajectory() {
    if (player == null) return

    demoTrajectoryStartCol = currentDemoCol()
    demoTrajectoryStartRow = currentDemoRow()
    demoTrajectoryLen = randint(10, 20)

    if (demoNearDiamond()) {
        demoSeekDiamond = true
        demoTrajectoryEndCol = goalCol
        demoTrajectoryEndRow = goalRow
        demoWaypointCol = goalCol
        demoWaypointRow = goalRow
        demoWaypointUntil = game.runtime() + 4500
        demoTrajectoryUntil = demoWaypointUntil
        demoMoveUntil = 0
        return
    }

    let dx = randint(-1, 1)
    let dy = randint(-1, 1)

    if (dx == 0 && dy == 0) dx = 1

    if (demoSeekDiamond || randint(0, 100) < 30) {
        let gx = goalCol - demoTrajectoryStartCol
        let gy = goalRow - demoTrajectoryStartRow

        if (Math.abs(gx) > 3) {
            if (gx > 0) dx = 1
            else dx = -1
        }

        if (Math.abs(gy) > 3) {
            if (gy > 0) dy = 1
            else dy = -1
        }
    }

    let endCol = demoClampCol(demoTrajectoryStartCol + dx * demoTrajectoryLen)
    let endRow = demoClampRow(demoTrajectoryStartRow + dy * demoTrajectoryLen)

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
        demoTrajectoryEndCol = goalCol
        demoTrajectoryEndRow = goalRow
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
    setDemoTargetTowards(goalCol, goalRow)
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

    for (let i = 0; i < 9; i++) {
        let dx = randint(-1, 1)
        let dy = randint(-1, 1)

        if (dx != 0 || dy != 0) {
            let col = playerCol() + dx
            let row = playerRow() + dy

            if (isHarvestable(getTileId(col, row))) {
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

function demoSelectRandomMaterialWithStock(): boolean {
    for (let attempt = 0; attempt < 8; attempt++) {
        selectedMat = randint(MAT_DIRT, MAT_LEAVES)
        if (matCount() > 0) return true
    }
    if (invDirt > 0) { selectedMat = MAT_DIRT; return true; }
    if (invStone > 0) { selectedMat = MAT_STONE; return true; }
    if (invWood > 0) { selectedMat = MAT_WOOD; return true; }
    if (invLeaves > 0) { selectedMat = MAT_LEAVES; return true; }
    return false
}

function demoTryBuildRandomly(): boolean {
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
        if (!demoHarvestBlocker(finalVx, finalVy)) {
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
        demoTrajectoryEndCol = goalCol
        demoTrajectoryEndRow = goalRow
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
        demoSeekDiamond = true
        demoModeState = 3
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

// --------------------------------------------------------------------------
// Input handling.
// --------------------------------------------------------------------------
controller.up.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == TITLE) {
        titleChoice = 0
        return
    }

    if (gameState == OPTIONS) {
        optionChoice += -1
        if (optionChoice < 0) optionChoice = 4
        return
    }

    if (gameState == DIFFICULTY) {
        difficultyChoice += -1
        if (difficultyChoice < 0) difficultyChoice = 1
        return
    }

    if (gameState == SAVING) {
        saveNameIndices[saveNamePos] = (saveNameIndices[saveNamePos] + 1) % 36
        return
    }

    if (gameState == LOADING) {
        if (loadChoices.length > 0) {
            loadChoicePos = (loadChoicePos - 1 + loadChoices.length) % loadChoices.length
        }
        return
    }

    if (gameState == PLAYING && inventoryOpen) {
        moveInventorySelection(-1)
        return
    }

    if (gameState == PLAYING && !demoMode && !inventoryOpen) {
        facingDx = 0
        facingDy = -1
    }
})

controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == TITLE) {
        titleChoice = 1
        return
    }

    if (gameState == OPTIONS) {
        optionChoice += 1
        if (optionChoice > 4) optionChoice = 0
        return
    }

    if (gameState == DIFFICULTY) {
        difficultyChoice += 1
        if (difficultyChoice > 1) difficultyChoice = 0
        return
    }

    if (gameState == SAVING) {
        saveNameIndices[saveNamePos] = (saveNameIndices[saveNamePos] - 1 + 36) % 36
        return
    }

    if (gameState == LOADING) {
        if (loadChoices.length > 0) {
            loadChoicePos = (loadChoicePos + 1) % loadChoices.length
        }
        return
    }

    if (gameState == PLAYING && inventoryOpen) {
        moveInventorySelection(1)
        return
    }

    if (gameState == PLAYING && !demoMode && !inventoryOpen) {
        facingDx = 0
        facingDy = 1
    }
})

controller.left.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == DIFFICULTY) {
        if (difficultyChoice == 0) {
            if (diffZombieSpeedLevel > 1) diffZombieSpeedLevel--
        } else if (difficultyChoice == 1) {
            if (diffZombieCountOffset > -5) diffZombieCountOffset--
        }
        return
    }

    if (gameState == PLAYING && !demoMode && !inventoryOpen) {
        facingDx = -1
        facingDy = 0
    }
})

controller.right.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == DIFFICULTY) {
        if (difficultyChoice == 0) {
            if (diffZombieSpeedLevel < 5) diffZombieSpeedLevel++
        } else if (difficultyChoice == 1) {
            if (diffZombieCountOffset < 5) diffZombieCountOffset++
        }
        return
    }

    if (gameState == PLAYING && !demoMode && !inventoryOpen) {
        facingDx = 1
        facingDy = 0
    }
})

// INSTANT ACTION TRIGGER
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (gameState == VICTORY || gameState == GAMEOVER) {
        returnToTitleFromVictory()
        return
    }

    if (isDemoActive()) {
        toggleDemoPause()
        return
    }

    if (gameState == TITLE) {
        if (titleChoice == 0) startGame()
        else gameState = OPTIONS
        return
    }

    if (gameState == OPTIONS) {
        if (optionChoice == 0) {
            if (selectedLevels == INFINITY) {
                selectedLevels = 1
            } else {
                selectedLevels += 1
                if (selectedLevels > 10) selectedLevels = INFINITY
            }
        } else if (optionChoice == 1) {
            if (selectedHealth == INFINITY) {
                selectedHealth = 1
            } else {
                selectedHealth += 1
                if (selectedHealth > 7) selectedHealth = INFINITY
            }
        } else if (optionChoice == 2) {
            demoMode = !demoMode
            if (demoMode) {
                selectedLevels = INFINITY
                selectedHealth = INFINITY
            } else {
                selectedLevels = 1
                selectedHealth = 5
            }
        } else if (optionChoice == 3) {
            gameState = DIFFICULTY
            difficultyChoice = 0
        } else if (optionChoice == 4) {
            gameState = LOADING
            let q = settings.readString("saveQueue") || ""
            loadChoices = q.length > 0 ? q.split(",") : []
            loadChoicePos = 0
        }
        return
    }

    if (gameState == SAVING) {
        if (saveNamePos < 2) {
            saveNamePos++
        } else {
            let svName = saveChars.charAt(saveNameIndices[0]) + saveChars.charAt(saveNameIndices[1]) + saveChars.charAt(saveNameIndices[2])
            if (game.ask("Save as " + svName + "?", "A=Yes B=No")) {
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
                        packed |= (id << (j * 4));
                    }
                    mapArr.push(packed);
                }
                settings.writeNumberArray("sav_" + svName + "_map", mapArr)

                let zData: number[] = []
                for (let z of sprites.allOfKind(SpriteKind.Enemy)) {
                    let idx = zombieIndex(z)
                    let mode = idx >= 0 ? zombieModes[idx] : 0
                    zData.push(z.x)
                    zData.push(z.y)
                    zData.push(mode)
                }

                let data = [
                    level, info.life(), invDirt, invStone, invWood, invLeaves, invBones,
                    player.x, player.y, theme, goalCol, goalRow,
                    zData.length / 3
                ]
                for (let i = 0; i < zData.length; i++) data.push(zData[i])

                settings.writeNumberArray("sav_" + svName + "_data", data)

                gameState = PLAYING
                inventoryOpen = false
                resumeEnemies()
                resumePlayer()
            }
        }
        return
    }

    if (gameState == LOADING) {
        if (loadChoices.length > 0) {
            let svName = loadChoices[loadChoicePos]
            let data = settings.readNumberArray("sav_" + svName + "_data")
            let mapArr = settings.readNumberArray("sav_" + svName + "_map")

            if (data && data.length >= 12 && mapArr && mapArr.length == 384) {
                destroyLevelSprites()
                demoMode = false

                level = data[0]
                info.setLife(data[1])
                invDirt = data[2]
                invStone = data[3]
                invWood = data[4]
                invLeaves = data[5]
                let offset = data.length >= 13 ? 1 : 0
                invBones = offset ? data[6] : 0
                let px = data[6 + offset]
                let py = data[7 + offset]
                theme = data[8 + offset]
                goalCol = data[9 + offset]
                goalRow = data[10 + offset]
                let zCount = data[11 + offset]

                // Unpack binary map
                for (let i = 0; i < mapArr.length; i++) {
                    let packed = mapArr[i];
                    for (let j = 0; j < 6; j++) {
                        let id = (packed >> (j * 4)) & 0xF;
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
                    let zx = data[12 + i * 3]
                    let zy = data[13 + i * 3]
                    let zm = data[14 + i * 3]

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
                playLevelMusic()
            } else {
                gameState = OPTIONS
            }
        }
        return
    }

    if (gameState != PLAYING) return

    if (inventoryOpen) {
        if (selectedMat == MAT_SAVE) {
            gameState = SAVING
            saveNameIndices = [0, 0, 0]
            saveNamePos = 0
            return
        }
        inventoryOpen = false
        resumeEnemies()
        resumePlayer()
        return
    }

    // Instantly fires the harvest/build sequence
    performTargetAction()
})

controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    if (isDemoActive()) {
        toggleDemoPause()
        return
    }

    if (gameState == SAVING) {
        if (saveNamePos > 0) {
            saveNamePos--
        } else {
            gameState = PLAYING
            inventoryOpen = true
        }
        return
    }

    if (gameState == LOADING) {
        gameState = OPTIONS
        return
    }

    if (gameState == DIFFICULTY) {
        gameState = OPTIONS
        return
    }

    if (gameState == OPTIONS) {
        gameState = TITLE
        return
    }

    if (gameState != PLAYING) return

    if (!inventoryOpen) {
        inventoryOpen = true
        stopPlayer()
        stopEnemies()
    } else {
        inventoryOpen = false
        resumeEnemies()
        resumePlayer()
    }
})

// --------------------------------------------------------------------------
// Zombie spawning and behaviour.
// --------------------------------------------------------------------------
function zombieCount(): number {
    return sprites.allOfKind(SpriteKind.Enemy).length
}

function spawnZombie() {
    if (gameState != PLAYING || player == null || inventoryOpen) return
    if (zombieCount() >= maxZombies) return

    let spawnCol = 2
    let spawnRow = 2

    for (let attempt = 0; attempt < 20; attempt++) {
        spawnCol = randint(2, MAP_W - 3)
        spawnRow = randint(2, MAP_H - 3)

        if (getTileId(spawnCol, spawnRow) == GRASS && Math.abs(spawnCol - playerCol()) + Math.abs(spawnRow - playerRow()) > 12) {
            break
        }
    }

    let zombie = sprites.create(zIdle, SpriteKind.Enemy)
    zombie.z = 5
    tiles.placeOnTile(zombie, tiles.getTileLocation(spawnCol, spawnRow))
    rememberZombie(zombie)
    setZombieMode(zombie, 0)
}

game.onUpdateInterval(5000, function () {
    spawnZombie()
})

game.onUpdateInterval(250, function () {
    if (gameState != PLAYING || player == null || inventoryOpen) return

    for (let zombie of sprites.allOfKind(SpriteKind.Enemy)) {
        let near = Math.abs(player.x - zombie.x) < 32 && Math.abs(player.y - zombie.y) < 32
        if (near) setZombieMode(zombie, 1)
        else setZombieMode(zombie, 0)
    }
})

// --------------------------------------------------------------------------
// Collision and damage.
// --------------------------------------------------------------------------
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite: Sprite, otherSprite: Sprite) {
    if (invincible || gameState != PLAYING) return

    invincible = true
    scene.cameraShake(4, 300)
    playDamageSound()

    if (demoMode) {
        demoRecoveryUntil = game.runtime() + 650
        demoMoveUntil = 0
        demoHeldVx = 0
        demoHeldVy = 0
        demoStartEscape()
    }

    if (selectedHealth != INFINITY) {
        info.changeLifeBy(-1)
    }

    let pushX = getSign(sprite.x - otherSprite.x)
    let pushY = getSign(sprite.y - otherSprite.y)

    if (pushX == 0 && pushY == 0) {
        pushX = 1
    }

    let nextX = sprite.x + pushX * 14
    let nextY = sprite.y + pushY * 14
    let nextCol = Math.floor(nextX / TILE)
    let nextRow = Math.floor(nextY / TILE)
    let currentCol = Math.floor(sprite.x / TILE)
    let currentRow = Math.floor(sprite.y / TILE)

    if (!isSolid(getTileId(nextCol, currentRow))) {
        sprite.x += pushX * 10
    }
    if (!isSolid(getTileId(currentCol, nextRow))) {
        sprite.y += pushY * 10
    }

    forgetZombie(otherSprite)
    otherSprite.destroy(effects.disintegrate, 150)

    control.runInParallel(function () {
        pause(500)
        invincible = false
    })
})

sprites.onOverlap(SpriteKind.Skeleton, SpriteKind.Enemy, function (skel: Sprite, zombie: Sprite) {
    if (gameState != PLAYING) return
    forgetZombie(zombie)
    zombie.destroy(effects.fire, 200)
    forgetSkeleton(skel)
    skel.destroy(effects.fire, 200)
    music.playTone(131, 50)
    updateSkeletonTargeting()
})

info.onLifeZero(function () {
    gameState = GAMEOVER
    stopLevelMusic()
    destroyLevelSprites()
    playDeathSound()
})

// --------------------------------------------------------------------------
// Main per-frame update.
// --------------------------------------------------------------------------
game.onUpdate(function () {
    tickCoreAnimations()
    tickSkeletons()

    if (gameState != PLAYING || player == null) return

    updateDiamondMarker()

    if (inventoryOpen) {
        stopPlayer()
        stopEnemies()
        return
    }

    if (isDemoActive()) {
        updateDemoMode()
    } else {
        updateFacing()
    }

    updatePlayerAnim()

    if (!demoMode) {
        updateTargetCursor()
    } else {
        if (targetCursor != null) targetCursor.setFlag(SpriteFlag.Invisible, true)
    }

    for (let zombie of sprites.allOfKind(SpriteKind.Enemy)) {
        let zCol = Math.floor(zombie.x / TILE)
        let zRow = Math.floor(zombie.y / TILE)

        if (getTileId(zCol, zRow) == SPIKES) {
            setTile(zCol, zRow, GRASS)
            forgetZombie(zombie)
            zombie.destroy(effects.fire, 200)
            breakEffect(zCol, zRow)
        }
    }

    if (getTileId(playerCol(), playerRow()) == DIAMOND) {
        finishLevel()
    }
})

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

    let labels = ["LEVELS", "HEALTH", "DEMO", "DIFFICULTY", "LOAD"];
    for (let i = 0; i < 5; i++) {
        let iy = y0 + i * itemHeight;
        if (iy > -itemHeight && iy < 60) {
            if (optionChoice == i) menuView.print("> " + labels[i], 16, iy, 1)
            else menuView.print("  " + labels[i], 16, iy, 1)

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

// --------------------------------------------------------------------------
// Render pipeline.
// --------------------------------------------------------------------------
scene.createRenderable(100, function (target: Image, camera: scene.Camera) {
    if (gameState == TITLE) drawTitle(target)
    else if (gameState == OPTIONS) drawOptions(target)
    else if (gameState == DIFFICULTY) drawDifficultyMenu(target)
    else if (gameState == INTRO) drawIntro(target)
    else if (gameState == PLAYING) {
        drawGoalPointer(target)
        drawResourceHud(target)
        drawInventory(target)
        drawDemoPausedBanner(target)
    } else if (gameState == SAVING) {
        drawResourceHud(target)
        drawInventory(target)
        drawSaving(target)
    } else if (gameState == LOADING) drawLoading(target)
    else if (gameState == VICTORY) drawVictory(target)
    else if (gameState == GAMEOVER) drawGameOver(target)
})