import re

with open('player.ts', 'r') as f:
    content = f.read()

new_func = """function performLongAction() {
    if (player == null) return

    let frontCol = playerCol() + facingDx
    let frontRow = playerRow() + facingDy
    let frontId = getTileId(frontCol, frontRow)

    if (matCount() > 0 && selectedMat != MAT_SAVE) {
        if ((selectedMat == MAT_BONE && frontId == HAY) || (selectedMat == MAT_GRASS && frontId == SPIKES)) {
            if (inDungeon) {
                music.playTone(131, 40)
                showBanner("NOT IN DUNGEON")
                return
            }
            if (selectedMat == MAT_BONE) invBones += -1
            else invGrass += -1

            setTile(frontCol, frontRow, GRASS)
            spawnScarecrow(frontCol, frontRow)
            playPlayerAttack(facingDx, facingDy)
            music.playTone(392, 100)
            let fx = new sprites.BaseSprite(frontCol * TILE + 8, frontRow * TILE + 8, null)
            fx.startEffect(effects.starField, 500)
            return
        }

        if ((selectedMat == MAT_WOOD && frontId == HAY) || (selectedMat == MAT_GRASS && frontId == TIMBER) || frontId == CAMPFIRE) {
            if (inDungeon) {
                music.playTone(131, 40)
                showBanner("NOT IN DUNGEON")
                return
            }
            if (frontId != CAMPFIRE) {
                if (selectedMat == MAT_WOOD) invWood += -1
                else invGrass += -1
                setTile(frontCol, frontRow, CAMPFIRE)
                campfireCols.push(frontCol)
                campfireRows.push(frontRow)
                campfireHealths.push(3000)
            } else {
                if (selectedMat == MAT_WOOD) invWood += -1
                else if (selectedMat == MAT_GRASS) invGrass += -1
                else return
                
                for (let i = 0; i < campfireCols.length; i++) {
                    if (campfireCols[i] == frontCol && campfireRows[i] == frontRow) {
                        let fuelAmt = (selectedMat == MAT_WOOD) ? 4500 : 1500
                        campfireHealths[i] += fuelAmt
                        break
                    }
                }
            }

            playPlayerAttack(facingDx, facingDy)
            music.playTone(175, 100)
            
            let fx = sprites.create(blank16, SpriteKind.Food)
            fx.setPosition(frontCol * TILE + 8, frontRow * TILE + 8)
            fx.z = 20
            fx.lifespan = 500
            fx.startEffect(effects.fire, 500)
            return
        }
    }
}"""

pattern = r"function performLongAction\(\) \{.*?\n\}(?=\n\nlet aPressStart)"
content = re.sub(pattern, new_func, content, flags=re.DOTALL)

with open('player.ts', 'w') as f:
    f.write(content)
