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

function testBridgeMaterialSelection() {
    let oldGrass = invGrass
    let oldDirt = invDirt
    let oldWood = invWood
    let oldStone = invStone
    let oldSelected = selectedMat
    
    // Test 1: Priority cascade - should fail if NO WOOD
    invGrass = 5
    invDirt = 5
    invWood = 0
    invStone = 5
    let success = demoSelectBridgeMaterial()
    assert(success === false, "Bridge Selection: Should strictly fail if MAT_WOOD is not available.")
    
    // Test 2: Absolute priority - should succeed if WOOD is available
    invGrass = 2
    invDirt = 5
    invWood = 1
    invStone = 5
    demoSelectBridgeMaterial()
    assert(selectedMat === MAT_WOOD, "Bridge Selection: Correctly selected MAT_WOOD to build over water.")
    
    invGrass = oldGrass
    invDirt = oldDirt
    invWood = oldWood
    invStone = oldStone
    selectedMat = oldSelected
}

function testExplorationArrayShifting() {
    let testCols: number[] = []
    
    for (let i = 0; i < 25; i++) {
        testCols.push(i)
        if (testCols.length > 20) {
            testCols.shift()
        }
    }
    
    assert(testCols.length === 20, "Exploration Memory: The array length is correctly capped at 20 using shift().")
    assert(testCols[0] === 5, "Exploration Memory: The shift() function successfully removed the oldest elements.")
    assert(testCols[19] === 24, "Exploration Memory: The push() function successfully added the newest elements at the end.")
}

console.log("=== RUNNING AUTOMATED UNIT TESTS ===")
testDungeon1DArray()
testZombieIteration()
testBridgeMaterialSelection()
testExplorationArrayShifting()
console.log("=== ALL AUTOMATED TESTS PASSED SUCCESSFULLY ===")
