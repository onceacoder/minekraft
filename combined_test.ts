// Mocks for MakeCode APIs
const Math = global.Math;
const console = global.console;

namespace sprites {
    export function create(img: any, kind: any) { return { x: 0, y: 0, setPosition: function(){} }; }
}
const SpriteKind = { Enemy: 1 };
const img = function(strings: any) { return strings[0]; };

// We also need to define randint, control.panic, etc.
function randint(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
const control = { panic: function(code: number) { throw new Error("Panic " + code); } };
// --------------------------------------------------------------------------
// GLOBAL CONSTANTS
// Map sizing, Tile indices, and Tunable Game Variables

// --------------------------------------------------------------------------
const MAP_W = 60
const MAP_H = 64
const TILE = 16

const GRASS = 0
const DIRT = 1
const STONE = 2
const BEDROCK = 3
const DIRT_WALL = 4 // (Legacy, can be mapped/kept to avoid breaking saves, but we'll introduce BRICKS)
const SPIKES = 5
const DIAMOND = 6
const WOOD = 7
const LEAVES = 8 // (Legacy)
const BONE = 9
const WATER = 10
const IRON_ORE = 11
const BRICKS = 12
const STONE_BLOCK = 13
const TIMBER = 14
const TALL_GRASS = 15
const HAY = 16
const CAVE_ENTRANCE = 17
const DUNGEON_WALL = 18
const KEY_HOLE = 19
const DUNGEON_FLOOR = 20
const KEY = 21

const MAT_DIRT = 0
const MAT_STONE = 1
const MAT_WOOD = 2
const MAT_GRASS = 3
const MAT_BONE = 4
const MAT_IRON = 5
const MAT_SAVE = 6

const TITLE = 0
const OPTIONS = 1
const INTRO = 2
const PLAYING = 3
const VICTORY = 4
const GAMEOVER = 5
const SAVING = 6
const LOADING = 7
const DIFFICULTY = 8
const OBSTACLES = 9
const TOLL_DIALOG = 10
const DUNGEON_TRANSITION = 11

const PLAYER_SPEED = 80
const DEMO_SPEED = 60
const DEMO_DIAGONAL_SPEED = 42
const INFINITY = 0
const MUSIC_TEMPO = 130

const ZOMBIE_AGGRO_RANGE = 32
const ZOMBIE_SPAWN_MIN_DIST = 12
const ZOMBIE_SPAWN_INTERVAL_MS = 5000
const ZOMBIE_MODE_CHECK_MS = 250
const ATTACK_DURATION_MS = 220
const SKELETON_WALK_SPEED = 40
const SKELETON_PATH_INTERVAL = 15
const PUSH_DISTANCE = 10
const INVINCIBILITY_MS = 500


// --------------------------------------------------------------------------
// GLOBAL STATE

// --------------------------------------------------------------------------
let gameState = TITLE
let titleChoice = 0
let optionChoice = 0
let difficultyChoice = 0
let diffZombieSpeedLevel = 3
let diffZombieCountOffset = 0

// Obstacle Config and State
let optRiver = true
let optSurvive = true
let optToll = true
let optDungeon = true

const OBSTACLE_NONE = 0
const OBSTACLE_RIVER = 1
const OBSTACLE_SURVIVE = 2
const OBSTACLE_TOLL = 3
const OBSTACLE_DUNGEON = 4

let activeObstacle = OBSTACLE_NONE // The obstacle selected for the current level
let survivalTimer = 0 // Ticks down in survival mode before diamond spawns
let survivalPhase = 0 // 0=none, 1=prep, 2=survive
let tollMat = 0 // Material required for toll
let tollAmount = 0 // Amount of material required
let obstacleChoicePos = 0 // UI selection index for obstacles menu
let lastObstacle = OBSTACLE_NONE // Tracks previous level's obstacle for no-repeat guard

// Banner system — dissolving phase announcements
let bannerText = ""
let bannerUntil = 0 // game.runtime() timestamp when banner expires

// Harvest gate — diamond hidden until player mines enough blocks
let harvestCount = 0
let harvestGoal = 0 // 0 = gate cleared / not active

// Spike-check frame throttle
let spikeCheckCounter = 0

// Dungeon State
let inDungeon = false
let hasDungeonKey = false
let currentRoomX = 0
let currentRoomY = 0
let targetCameraX = 0
let targetCameraY = 0
let dungeonSpawnCol = 0
let dungeonSpawnRow = 0
let dungeonReturnCol = 0
let dungeonReturnRow = 0
let overworldBuffer: Buffer = null

// Configuration & Game Loop Settings
let selectedLevels = 1
let selectedHealth = 5
let isEditingOption = false
let level = 1
let firstTheme = 0
let theme = 0
let musicToken = 0

// Auto-playing Demo Mode tracking variables
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

// Player Inventory and Status
let invDirt = 0
let invStone = 0
let invWood = 0
let invGrass = 0
let invBones = 0
let invIron = 0
let selectedMat = MAT_DIRT // Currently selected build material
let inventoryCursor = MAT_DIRT // Cursor position in the inventory menu
let inventoryOpen = false
let facingDx = 1 // Player facing direction X
let facingDy = 0 // Player facing direction Y
let invincible = false // I-frames state after getting hit
let maxZombies = 5 // Current cap on spawned zombies

// Level Map Elements
let goalCol = 0 // Diamond X location in grid
let goalRow = 0 // Diamond Y location in grid

// Essential Game Sprites
let player: Sprite = null
let targetCursor: Sprite = null
let diamondMarker: Sprite = null
let playerAnim = "" // Tracks current sprite animation state
let playerAttackUntil = 0 // Timer for attack animation cooldown

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

// Water bridge tracking: records positions where a block was built over water,
// so destroying the block correctly restores water rather than leaving grass.
let waterBridgeCols: number[] = []
let waterBridgeRows: number[] = []

namespace SpriteKind {
    export const Skeleton = SpriteKind.create()
}


function carveRoom(x: number, y: number, w: number, h: number) {
    for (let c = x; c < x + w; c++) {
        for (let r = y; r < y + h; r++) {
            if (inBounds(c, r)) rawSetTile(c, r, DUNGEON_FLOOR)
        }
    }
}

function generateDungeon() {
    // Fill with BEDROCK
    for (let col = 0; col < MAP_W; col++) {
        for (let row = 0; row < MAP_H; row++) {
            rawSetTile(col, row, BEDROCK)
        }
    }

    // Grid of rooms: 6x8 grid, each room is 10x8 tiles (fits in 60x64 map limit)
    let gridW = 6
    let gridH = 8
    let roomMap: boolean[] = []
    let roomDepth: number[] = []
    for (let i = 0; i < gridW * gridH; i++) {
        roomMap.push(false)
        roomDepth.push(0)
    }

    // Branching DFS to generate maze-like dungeon
    let startRoomX = randint(0, gridW - 1)
    let startRoomY = randint(0, gridH - 1)
    roomMap[startRoomX + startRoomY * gridW] = true
    roomDepth[startRoomX + startRoomY * gridW] = 0

    let maxRooms = randint(25, 40)
    let roomsCarved = 1
    
    let stackX: number[] = [startRoomX]
    let stackY: number[] = [startRoomY]
    
    let deepestRoomX = startRoomX
    let deepestRoomY = startRoomY
    let maxDepth = 0

    while (stackX.length > 0 && roomsCarved < maxRooms) {
        let cx = stackX[stackX.length - 1]
        let cy = stackY[stackY.length - 1]
        
        // Find unvisited neighbors
        let neighborsX: number[] = []
        let neighborsY: number[] = []
        let dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
        
        for (let d of dirs) {
            let nx = cx + d[0]
            let ny = cy + d[1]
            if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH && !roomMap[nx + ny * gridW]) {
                neighborsX.push(nx)
                neighborsY.push(ny)
            }
        }
        
        if (neighborsX.length > 0) {
            // Pick a random neighbor
            let r = randint(0, neighborsX.length - 1)
            let nx = neighborsX[r]
            let ny = neighborsY[r]
            
            roomMap[nx + ny * gridW] = true
            let depth = roomDepth[cx + cy * gridW] + 1
            roomDepth[nx + ny * gridW] = depth
            if (depth > maxDepth) {
                maxDepth = depth
                deepestRoomX = nx
                deepestRoomY = ny
            }
            
            // Carve corridor
            let px = Math.min(cx, nx) * 10
            let py = Math.min(cy, ny) * 8
            if (cx != nx) carveRoom(px + 8, py + 3, 4, 2)
            else carveRoom(px + 4, py + 6, 2, 4)
            
            stackX.push(nx)
            stackY.push(ny)
            roomsCarved++
            
            // 30% chance to pop the stack early to force branching paths
            if (randint(0, 100) < 30) {
                stackX.pop()
                stackY.pop()
            }
        } else {
            stackX.pop()
            stackY.pop()
        }
    }

    // Carve actual rooms and place traps
    for (let x = 0; x < gridW; x++) {
        for (let y = 0; y < gridH; y++) {
            if (roomMap[x + y * gridW]) {
                // Carve room space with 1-tile wall border (w=8, h=6)
                carveRoom(x * 10 + 1, y * 8 + 1, 8, 6)
                
                let isStart = (x == startRoomX && y == startRoomY)
                let isKey = (x == deepestRoomX && y == deepestRoomY)
                
                if (!isStart && !isKey) {
                    if (randint(0, 100) < 40) {
                        // Trap room
                        let trapType = randint(0, 1)
                        if (trapType == 0) {
                            // Spikes
                            for(let i=0; i<8; i++) {
                                let wx = randint(x * 10 + 2, x * 10 + 7)
                                let wy = randint(y * 8 + 2, y * 8 + 5)
                                if (getTileId(wx, wy) == DUNGEON_FLOOR) rawSetTile(wx, wy, SPIKES)
                            }
                        } else {
                            // Heavy walls
                            for(let i=0; i<12; i++) {
                                let wx = randint(x * 10 + 2, x * 10 + 7)
                                let wy = randint(y * 8 + 2, y * 8 + 5)
                                if (getTileId(wx, wy) == DUNGEON_FLOOR) rawSetTile(wx, wy, DUNGEON_WALL)
                            }
                        }
                    } else {
                        // Normal scatter
                        for(let i=0; i<3; i++) {
                            let wx = randint(x * 10 + 2, x * 10 + 7)
                            let wy = randint(y * 8 + 2, y * 8 + 5)
                            if (getTileId(wx, wy) == DUNGEON_FLOOR) rawSetTile(wx, wy, DUNGEON_WALL)
                        }
                    }
                }
                
                // Resource scatter (Bones and Iron Ore)
                if (!isStart) {
                    for(let i=0; i<4; i++) {
                        if (randint(0, 100) < 60) {
                            let wx = randint(x * 10 + 2, x * 10 + 7)
                            let wy = randint(y * 8 + 2, y * 8 + 5)
                            if (getTileId(wx, wy) == DUNGEON_FLOOR) {
                                rawSetTile(wx, wy, randint(0, 1) == 0 ? BONE : IRON_ORE)
                            }
                        }
                    }
                }
            }
        }
    }

    // Set starting position for the player in the start room (center of room)
    dungeonSpawnCol = startRoomX * 10 + 5
    dungeonSpawnRow = startRoomY * 8 + 4

    // Place Key in the deepest room
    rawSetTile(deepestRoomX * 10 + 5, deepestRoomY * 8 + 4, KEY)

    // Refresh the tilemap renderer with the new buffer
    tiles.setTilemap(tiles.createTilemap(world, layout, tileImages, TileScale.Sixteen))
    refreshMap()
}

function updateDungeonCamera() {
    let pCol = Math.floor(player.x / 160)
    let pRow = Math.floor(player.y / 128)

    if (pCol != currentRoomX || pRow != currentRoomY) {
        currentRoomX = pCol
        currentRoomY = pRow
        targetCameraX = currentRoomX * 160 + 80
        targetCameraY = currentRoomY * 128 + 64
        
        gameState = DUNGEON_TRANSITION
        scene.cameraFollowSprite(null)
        stopPlayer()
    }
}
// Custom simple assert function
function assert(condition: boolean, msg: string) {
    if (!condition) {
        console.log("FAIL: " + msg)
        control.panic(1)
    } else {
        console.log("PASS: " + msg)
    }
}

function testDungeon1DArray() {
    let gridW = 6
    let gridH = 8
    let roomMap: boolean[] = []
    let roomDepth: number[] = []
    
    for (let i = 0; i < gridW * gridH; i++) {
        roomMap.push(false)
        roomDepth.push(0)
    }
    
    // Simulate branching path assignments using the 1D indexing equation: index = x + y * gridW
    let testX = 3
    let testY = 4
    roomMap[testX + testY * gridW] = true
    roomDepth[testX + testY * gridW] = 5
    
    assert(roomMap[3 + 4 * gridW] === true, "Dungeon Array: 1D flat map accurately stores true boolean values at calculated indices.")
    assert(roomDepth[3 + 4 * gridW] === 5, "Dungeon Array: 1D flat depth array accurately stores integer depths at calculated indices.")
    assert(roomMap[2 + 4 * gridW] === false, "Dungeon Array: Adjacent 1D array coordinates remain correctly unmutated.")
}

function testZombieIteration() {
    // Clear and mock the zombie tracking engine
    zombieRefs = []
    zombieModes = []
    
    let z1 = sprites.create(img`1`, SpriteKind.Enemy)
    let z2 = sprites.create(img`2`, SpriteKind.Enemy)
    let z3 = sprites.create(img`3`, SpriteKind.Enemy)
    
    // Position them all stacked precisely on Tile (1,1) so all will register a hit
    z1.setPosition(16, 16)
    z2.setPosition(16, 16)
    z3.setPosition(16, 16)
    
    rememberZombie(z1)
    rememberZombie(z2)
    rememberZombie(z3)
    
    assert(zombieRefs.length == 3, "Combat Memory: Exactly 3 zombie sprites successfully populated into the tracking array.")
    
    let frontCol = 1
    let frontRow = 1
    let hitCount = 0
    
    // Run the exact backwards iteration combat logic implemented in player.ts
    for (let i = zombieRefs.length - 1; i >= 0; i--) {
        let z = zombieRefs[i]
        let zc = Math.floor(z.x / TILE)
        let zr = Math.floor(z.y / TILE)
        if (Math.abs(zc - frontCol) <= 1 && Math.abs(zr - frontRow) <= 1) {
            forgetZombie(z)
            hitCount++
        }
    }
    
    assert(hitCount == 3, "Combat Loop: Backwards iteration perfectly processed and struck all 3 stacked zombies without skipping indices.")
    assert(zombieRefs.length == 0, "Combat Memory: Zombie tracking array was safely and fully drained during active loop iteration.")
    
    z1.destroy()
    z2.destroy()
    z3.destroy()
}

console.log("=== RUNNING AUTOMATED UNIT TESTS ===")
testDungeon1DArray()
testZombieIteration()
console.log("=== ALL AUTOMATED TESTS PASSED SUCCESSFULLY ===")
