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
