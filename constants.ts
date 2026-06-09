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
const WATER = 10

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
const OBSTACLES = 9

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

const OBSTACLE_NONE = 0
const OBSTACLE_RIVER = 1
const OBSTACLE_SURVIVE = 2
const OBSTACLE_TOLL = 3

let activeObstacle = OBSTACLE_NONE // The obstacle selected for the current level
let survivalTimer = 0 // Ticks down in survival mode before diamond spawns
let tollWood = 0 // Wood required to pass toll
let tollStone = 0 // Stone required to pass toll
let obstacleChoicePos = 0 // UI selection index for obstacles menu

// Configuration & Game Loop Settings
let selectedLevels = 1
let selectedHealth = 5
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
let invLeaves = 0
let invBones = 0
let selectedMat = MAT_DIRT // Currently selected build material
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

namespace SpriteKind {
    export const Skeleton = SpriteKind.create()
}


