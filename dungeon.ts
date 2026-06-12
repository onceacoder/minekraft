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

    // Dungeon Memory Layout (1D Flattened Arrays):
    // To minimize memory overhead on hardware, we represent the 2D 6x8 grid 
    // of rooms using 1D arrays. `roomMap` tracks if a room exists, and 
    // `roomDepth` tracks its distance from the spawn to determine the key location.
    let gridW = 6
    let gridH = 8
    let roomMap: boolean[] = []
    let roomDepth: number[] = []
    for (let i = 0; i < gridW * gridH; i++) {
        roomMap.push(false)
        roomDepth.push(0)
    }

    // Procedural Generation: Key Crawl Algorithm (DFS)
    // We use a randomized Depth-First Search to carve a maze-like layout.
    // The algorithm starts at a random room, picks a random unvisited neighbor, 
    // and carves a corridor. It tracks the "deepest" room to hide the Dungeon Key.
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
