// --------------------------------------------------------------------------
// HUD and screen rendering helpers.

// --------------------------------------------------------------------------
function printBold(target: Image, text: string, x: number, y: number, color: number) {
    target.print(text, x, y, color)
    target.print(text, x + 1, y, color)
}

function clampScreen(value: number, minValue: number, maxValue: number): number {
    if (value < minValue) return minValue
    if (value > maxValue) return maxValue
    return value
}

function drawGoalPointer(target: Image) {
    if (gameState != PLAYING || player == null || inDungeon) return

    if (getTileId(goalCol, goalRow) != DIAMOND) return

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
    if (mat == MAT_DIRT) target.drawTransparentImage(bricksTile, x, y)
    else if (mat == MAT_STONE) target.drawTransparentImage(stoneBlockTile, x, y)
    else if (mat == MAT_IRON) target.drawTransparentImage(spikesTile, x, y)
    else if (mat == MAT_WOOD) target.drawTransparentImage(timberTile, x, y)
    else if (mat == MAT_GRASS) target.drawTransparentImage(hayTile, x, y)
    else target.drawTransparentImage(boneTile, x, y)
}

// 8x8 icon drawer — uses scaled-down versions of actual tile images (generated in initTiles)
function drawMatIconMini(target: Image, mat: number, x: number, y: number) {
    if (mat == MAT_DIRT) target.drawTransparentImage(miniBricks, x, y)
    else if (mat == MAT_STONE) target.drawTransparentImage(miniStoneBlock, x, y)
    else if (mat == MAT_IRON) target.drawTransparentImage(miniSpikes, x, y)
    else if (mat == MAT_WOOD) target.drawTransparentImage(miniTimber, x, y)
    else if (mat == MAT_GRASS) target.drawTransparentImage(miniHay, x, y)
    else target.drawTransparentImage(miniSkeleton, x, y)
}

function selectedIconY(): number {
    if (selectedMat == MAT_DIRT) return 42
    else if (selectedMat == MAT_STONE) return 54
    else if (selectedMat == MAT_WOOD) return 66
    else if (selectedMat == MAT_GRASS) return 78
    else if (selectedMat == MAT_BONE) return 90
    else if (selectedMat == MAT_IRON) return 102
    else return 114
}

function drawBlockyZombie_OLD(target: Image, x: number, y: number) {
    target.fillRect(x + 4, y, 8, 8, 7)
    target.fillRect(x + 2, y + 8, 12, 12, 6)
    target.fillRect(x, y + 10, 3, 8, 7)
    target.fillRect(x + 13, y + 10, 3, 8, 7)
    target.fillRect(x + 3, y + 20, 4, 8, 7)
    target.fillRect(x + 9, y + 20, 4, 8, 7)
    target.setPixel(x + 6, y + 3, 1)
    target.setPixel(x + 10, y + 3, 1)
}

function drawBlockyMiner_OLD(target: Image, x: number, y: number) {
    target.fillRect(x + 4, y, 8, 8, 14)
    target.fillRect(x + 3, y + 8, 10, 12, 9)
    target.fillRect(x, y + 10, 3, 8, 12)
    target.fillRect(x + 13, y + 10, 3, 8, 12)
    target.fillRect(x + 3, y + 20, 4, 8, 12)
    target.fillRect(x + 9, y + 20, 4, 8, 12)
    target.setPixel(x + 6, y + 3, 1)
    target.setPixel(x + 10, y + 3, 1)
}

function drawTitle_OLD(target: Image) {
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

    drawBlockyMiner_OLD(target, 35, 58)
    drawBlockyZombie_OLD(target, 104, 58)

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

function drawRpgMiner(target: Image, x: number, y: number) {
    target.drawTransparentImage(pDown, x, y)
}

function drawRpgZombie(target: Image, x: number, y: number) {
    target.drawTransparentImage(zIdle, x, y)
}

function drawTitle(target: Image) {
    // Dynamic sky background
    target.fillRect(0, 0, 160, 120, 9)
    target.fillRect(0, 72, 160, 48, 7)
    target.fillRect(0, 88, 160, 32, 4)
    target.fillRect(0, 102, 160, 18, 5)

    // Forest inspired background
    for (let x = 0; x < 160; x += 24) {
        target.fillRect(x + 8, 46, 8, 34, 14)
        target.fillRect(x, 34, 24, 18, 7)
        target.fillRect(x + 4, 24, 16, 18, 6)
    }

    // Classic RPG Logo Box
    target.fillRect(10, 5, 140, 42, 15)
    target.drawRect(10, 5, 140, 42, 1)
    target.drawRect(12, 7, 136, 38, 11) // Inner gold border
    
    // Title Text
    target.print("MINEKRAFT", 52, 12, 1)
    target.print("by Luca", 62, 31, 1)

    // Draw characters
    drawRpgMiner(target, 40, 60)
    drawRpgZombie(target, 104, 60)
    
    // Small diamond in middle
    target.drawTransparentImage(diamondTile, 72, 60)

    // Main Menu Selection Box
    target.fillRect(34, 84, 92, 34, 15)
    target.drawRect(34, 84, 92, 34, 1)
    target.drawRect(36, 86, 88, 30, 11)

    if (titleChoice == 0) {
        target.print("START", 60, 92, 2)
        target.drawTransparentImage(arrowR, 44, 92)
        target.print("SETTINGS", 52, 104, 1)
    } else {
        target.print("START", 60, 92, 1)
        target.print("SETTINGS", 52, 104, 2)
        target.drawTransparentImage(arrowR, 36, 104)
    }
}

function drawInfinity(target: Image, x: number, y: number, colour: number) {
    target.drawCircle(x + 4, y + 4, 4, colour)
    target.drawCircle(x + 12, y + 4, 4, colour)
    target.setPixel(x + 8, y + 4, colour)
}

function drawScrollIndicator(target: Image, x: number, y: number, viewHeight: number, totalHeight: number, scrollY: number, color: number) {
    if (totalHeight <= viewHeight) return;
    let thumbHeight = Math.floor((viewHeight / totalHeight) * viewHeight);
    if (thumbHeight < 4) thumbHeight = 4;
    let maxScroll = totalHeight - viewHeight;
    let scrollRatio = maxScroll > 0 ? scrollY / maxScroll : 0;
    if (scrollRatio < 0) scrollRatio = 0;
    if (scrollRatio > 1) scrollRatio = 1;
    let thumbY = y + Math.floor(scrollRatio * (viewHeight - thumbHeight));
    
    target.fillRect(x, thumbY, 2, thumbHeight, color);
}

function drawOptions(target: Image) {
    target.fillRect(0, 0, 160, 120, 15)
    target.drawRect(10, 12, 140, 100, 1)
    printBold(target, "SETTINGS", 56, 20, 1)

    let itemHeight = 18;
    let selectedY = optionChoice * itemHeight;

    // Smooth scrolling window calculator
    if (selectedY - menuScrollY > 40) menuScrollY = selectedY - 40;
    if (selectedY - menuScrollY < 0) menuScrollY = selectedY;

    menuView.fill(0)
    let y0 = 0 - menuScrollY;

    let labels = ["LEVELS", "HEALTH", "DIFFICULTY >>", "LOAD >>"];
    for (let i = 0; i < 4; i++) {
        let iy = y0 + i * itemHeight;
        if (iy > -itemHeight && iy < 60) {
            let col = (i >= 2) ? 5 : 1;
            if (optionChoice == i) {
                menuView.drawTransparentImage(arrowR, 4, iy)
                menuView.print(labels[i], 16, iy, col)
            } else {
                menuView.print(labels[i], 16, iy, col)
            }

            if (i == 0) {
                let valCol = (optionChoice == 0 && isEditingOption) ? 5 : 1
                if (selectedLevels == INFINITY) {
                    menuView.print("<", 84, iy, valCol)
                    drawInfinity(menuView, 95, iy - 1, valCol)
                    menuView.print(">", 118, iy, valCol)
                } else {
                    menuView.print("< " + selectedLevels + " >", 84, iy, valCol)
                }
            } else if (i == 1) {
                let valCol = (optionChoice == 1 && isEditingOption) ? 5 : 1
                if (selectedHealth == INFINITY) {
                    menuView.print("<", 84, iy, valCol)
                    drawInfinity(menuView, 95, iy - 1, valCol)
                    menuView.print(">", 118, iy, valCol)
                } else {
                    menuView.print("< " + selectedHealth + " >", 84, iy, valCol)
                }
            }
        }
    }

    // Drawing clipped menu viewport prevents overlapping the bottom legend
    target.drawTransparentImage(menuView, 12, 38)
    drawScrollIndicator(target, 146, 38, 60, 5 * itemHeight, menuScrollY, 1)
    target.print("A:SEL L/R:ADJ B:BACK", 12, 102, 1)
}

function drawDifficultyMenu(target: Image) {
    target.fillRect(0, 0, 160, 120, 15)
    target.drawRect(10, 12, 140, 100, 1)
    printBold(target, "DIFFICULTY", 42, 20, 1)

    let itemHeight = 24;
    let selectedY = difficultyChoice * itemHeight;

    // Smooth scrolling window calculator
    if (selectedY - menuScrollY > 40) menuScrollY = selectedY - 40;
    if (selectedY - menuScrollY < 0) menuScrollY = selectedY;

    menuView.fill(0)
    let y0 = 0 - menuScrollY;

    let labels = ["ZMB SPEED", "ZMB COUNT", "OBSTACLES >>"];
    for (let i = 0; i < 3; i++) {
        let iy = y0 + i * itemHeight;
        if (iy > -itemHeight && iy < 60) {
            let col = (i == 2) ? 5 : 1;
            if (difficultyChoice == i) {
                menuView.drawTransparentImage(arrowR, 4, iy)
                menuView.print(labels[i], 16, iy, col)
            } else {
                menuView.print(labels[i], 16, iy, col)
            }

            if (i == 0) {
                menuView.print("< " + diffZombieSpeedLevel + " >", 84, iy, 1)
            } else if (i == 1) {
                let sign = diffZombieCountOffset >= 0 ? "+" : ""
                menuView.print("< " + sign + diffZombieCountOffset + " >", 84, iy, 1)
            }
        }
    }

    target.drawTransparentImage(menuView, 12, 38)
    drawScrollIndicator(target, 146, 38, 60, 3 * itemHeight, menuScrollY, 1)
    target.print("A:SEL L/R:ADJ B:BACK", 12, 102, 1)
}

function drawObstaclesMenu(target: Image) {
    target.fillRect(0, 0, 160, 120, 15)
    target.drawRect(10, 12, 140, 100, 1)
    printBold(target, "OBSTACLES", 44, 20, 1)

    let itemHeight = 18;
    let selectedY = obstacleChoicePos * itemHeight;

    if (selectedY - menuScrollY > 40) menuScrollY = selectedY - 40;
    if (selectedY - menuScrollY < 0) menuScrollY = selectedY;

    menuView.fill(0)
    let y0 = 0 - menuScrollY;

    let labels = ["RIVERS", "SURVIVAL", "TOLLS", "KEY CRAWL", "FREEZING NIGHT"];
    let toggles = [optRiver, optSurvive, optToll, optDungeon, optFreeze];
    
    for (let i = 0; i < 5; i++) {
        let iy = y0 + i * itemHeight;
        if (iy > -itemHeight && iy < 60) {
            if (obstacleChoicePos == i) {
                menuView.drawTransparentImage(arrowR, 4, iy + 4)
                menuView.print(labels[i], 16, iy + 4, 1)
            } else {
                menuView.print(labels[i], 16, iy + 4, 1)
            }

            menuView.drawRect(90, iy + 2, 10, 10, 1)
            if (toggles[i]) {
                menuView.print("x", 92, iy + 3, 5)
            }
        }
    }

    target.drawTransparentImage(menuView, 12, 38)
    drawScrollIndicator(target, 146, 38, 60, 5 * itemHeight, menuScrollY, 1)
    target.print("A:TOGGLE B:BACK", 22, 102, 1)
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
    // Hide default hearts if health is INFINITY
    if (selectedHealth == INFINITY) {
        target.fillRect(0, 0, 80, 12, 15) // Black background over hearts area
        target.print("LIFE: \u221E", 2, 2, 1) // Print white "LIFE: infinity symbol"
    }

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

    // Dynamic Obstacles HUD
    renderObstacleUI(target, w)
}

function drawTollDialog(target: Image) {
    target.fillRect(20, 20, 120, 80, 15)
    target.drawRect(20, 20, 120, 80, 1)
    printBold(target, "PAY TOLL?", 48, 28, 1)

    target.print("Req:", 30, 46, 1)
    drawMatIconMini(target, tollMat, 60, 46)
    target.print("" + tollAmount, 70, 46, 1)

    let current = 0
    if (tollMat == MAT_DIRT) current = invDirt
    else if (tollMat == MAT_STONE) current = invStone
    else if (tollMat == MAT_IRON) current = invIron
    else if (tollMat == MAT_WOOD) current = invWood
    else if (tollMat == MAT_GRASS) current = invGrass
    else if (tollMat == MAT_BONE) current = invBones

    target.print("Has:", 30, 62, 1)
    drawMatIconMini(target, tollMat, 60, 62)
    let color = current >= tollAmount ? 1 : 2
    target.print("" + current, 70, 62, color)

    target.print("A:Pay  B:Cancel", 26, 84, 1)
}

function drawInventory(target: Image) {
    if (!inventoryOpen) return

    target.fillRect(16, 24, 128, 92, 1)
    target.drawRect(16, 24, 128, 92, 15)
    printBold(target, "Inventory", 48, 28, 15)

    let itemHeight = 18;
    let selectedY = inventoryCursor * itemHeight;

    if (selectedY - menuScrollY > 40) menuScrollY = selectedY - 40;
    if (selectedY - menuScrollY < 0) menuScrollY = selectedY;

    menuView.fill(0)
    let y0 = 0 - menuScrollY;

    let labels = ["Bricks: " + invDirt, "Stone Blk: " + invStone, "Timber: " + invWood, "Hay: " + invGrass, "Skeleton: " + invBones, "Spikes: " + invIron, "Save Game"];

    for (let i = 0; i < 7; i++) {
        let iy = y0 + i * itemHeight;
        if (iy > -itemHeight && iy < 92) {
            if (inventoryCursor == i) menuView.drawTransparentImage(arrowR, 4, iy + 4)

            if (i != MAT_SAVE) {
                drawMatIcon(menuView, i, 16, iy)
                menuView.print(labels[i], 36, iy + 4, 15)
            } else {
                menuView.print(labels[i], 36, iy + 4, 15)
            }
        }
    }

    target.drawTransparentImage(menuView, 20, 42)
    drawScrollIndicator(target, 138, 42, 60, 7 * itemHeight, menuScrollY, 15)
    target.print("A:select B:close", 20, 104, 15)
}

function drawSaving(target: Image) {
    target.fillRect(30, 30, 100, 60, 15)
    target.drawRect(30, 30, 100, 60, 1)
    printBold(target, "SAVE GAME", 44, 38, 1)

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
    printBold(target, "LOAD GAME", 46, 10, 1)

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
    drawScrollIndicator(target, 150, 32, 60, loadChoices.length * itemHeight, menuScrollY, 1)
    target.print("A:Load  B:Cancel", 18, 105, 1)
}

function drawVictory(target: Image) {
    // Classic RPG Victory Screen
    // Forest-inspired backdrop with a golden window
    target.fillRect(0, 0, 160, 120, 15)
    for (let x = 0; x < 160; x += 24) {
        target.fillRect(x, 120 - 40, 24, 40, 7)
        target.fillRect(x + 4, 120 - 60 + (x % 3) * 5, 16, 20, 6)
    }

    // Gold bordered window
    target.fillRect(16, 16, 128, 88, 15)
    target.drawRect(15, 15, 130, 90, 5) // Yellow
    target.drawRect(14, 14, 132, 92, 4) // Orange
    target.drawRect(16, 16, 128, 88, 1) // White inner border

    printBold(target, "VICTORY", 52, 28, 5)
    
    // Draw player and diamond
    target.drawTransparentImage(pDown, 60, 54)
    target.drawTransparentImage(tileImages[DIAMOND], 84, 54)

    target.print("GAME COMPLETE", 28, 80, 1)
    target.print("Press A", 54, 94, 5)
}

function drawGameOver(target: Image) {
    // Classic RPG Game Over Screen
    // Spooky red sky backdrop
    target.fillRect(0, 0, 160, 120, 2)
    for (let x = 0; x < 160; x += 24) {
        target.fillRect(x, 120 - 40, 24, 40, 15)
        target.fillRect(x + 4, 120 - 60 + (x % 3) * 5, 16, 20, 15)
    }

    // Red bordered window
    target.fillRect(20, 30, 120, 60, 15)
    target.drawRect(19, 29, 122, 62, 2) // Red
    target.drawRect(18, 28, 124, 64, 2) // Red
    target.drawRect(20, 30, 120, 60, 1) // White inner border

    printBold(target, "GAME OVER", 44, 45, 2)
    target.print("Press A", 54, 70, 1)
}



// --------------------------------------------------------------------------
// Banner system — dissolving phase announcements.

// --------------------------------------------------------------------------
function showBanner(text: string) {
    bannerText = text
    bannerUntil = game.runtime() + 2500 // 2.5 seconds
}

function drawBanner(target: Image) {
    if (bannerText == "" || game.runtime() > bannerUntil) {
        bannerText = ""
        return
    }

    let remaining = bannerUntil - game.runtime()
    let textWidth = bannerText.length * 6
    let boxW = textWidth + 16
    let boxX = 80 - Math.floor(boxW / 2)
    let boxY = 36
    let boxH = 20

    // Draw solid banner
    target.fillRect(boxX, boxY, boxW, boxH, 1)
    target.drawRect(boxX, boxY, boxW, boxH, 15)
    printBold(target, bannerText, boxX + 8, boxY + 6, 15)

    // Dissolve effect: punch random transparent holes during last 800ms
    if (remaining < 800) {
        let dissolveStrength = Math.floor((800 - remaining) / 50) // 0-16 passes
        for (let pass = 0; pass < dissolveStrength; pass++) {
            for (let dx = 0; dx < boxW; dx += 2) {
                for (let dy = 0; dy < boxH; dy += 2) {
                    if (randint(0, 3) == 0) {
                        target.setPixel(boxX + dx, boxY + dy, 0)
                    }
                }
            }
        }
    }
}


// --------------------------------------------------------------------------
// Harvest gate HUD — shows mining progress counter.

// --------------------------------------------------------------------------
function drawHarvestGate(target: Image) {
    if (harvestGoal == 0) return
    
    // Position near top right
    let x = 110
    let y = 4
    
    target.fillRect(x, y, 46, 12, 1)
    target.drawRect(x, y, 46, 12, 5)
    
    // Draw the tiny diamond icon
    target.drawTransparentImage(diamondTile, x - 4, y - 2) // We'll just overlap it
    
    // Print progress: 5/10
    let pct = harvestCount + "/" + harvestGoal
    target.print(pct, x + 16, y + 3, 15)
}

function drawCampfires(target: Image) {
    if (gameState != PLAYING || campfireFrames.length == 0) return
    let cx = scene.cameraProperty(CameraProperty.Left)
    let cy = scene.cameraProperty(CameraProperty.Top)
    
    let frameIdx = Math.floor(game.runtime() / 150) % campfireFrames.length
    let frame = campfireFrames[frameIdx]
    
    for (let i = 0; i < campfireCols.length; i++) {
        let scx = campfireCols[i] * TILE - cx
        let scy = campfireRows[i] * TILE - cy
        
        if (scx >= -16 && scx <= 160 && scy >= -16 && scy <= 120) {
            target.drawTransparentImage(frame, scx, scy)
            
            // Draw health indicator
            let hp = campfireHealths[i]
            let w = Math.ceil((hp / 3000) * 12)
            if (w < 0) w = 0
            if (w > 12) w = 12
            
            target.fillRect(scx + 2, scy - 4, 12, 3, 1) // Outline
            target.fillRect(scx + 2, scy - 4, w, 3, 5)  // Yellow fill
        }
    }
}
