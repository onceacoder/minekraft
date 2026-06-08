def on_b_pressed():
    global adj, inventory_dirt, inventory_stone
    adj = get_facing_location()
    if controller.up.is_pressed():
        if inventory_dirt >= 1 and tiles.tile_at_location_equals(adj, imgAir):
            tiles.set_tile_at(adj, imgDirtWall)
            tiles.set_wall_at(adj, True)
            inventory_dirt += 0 - 1
    elif controller.down.is_pressed():
        if inventory_stone >= 1 and tiles.tile_at_location_equals(adj, imgAir):
            below = tiles.get_tile_location(adj.col, adj.row + 1)
            if not (tiles.tile_at_location_equals(below, imgAir)):
                tiles.set_tile_at(adj, imgSpikes)
                inventory_stone += 0 - 1
    elif tiles.tile_at_location_equals(adj, imgDirt):
        tiles.set_tile_at(adj, imgAir)
        tiles.set_wall_at(adj, False)
        inventory_dirt += 1
    elif tiles.tile_at_location_equals(adj, imgStone):
        tiles.set_tile_at(adj, imgAir)
        tiles.set_wall_at(adj, False)
        inventory_stone += 1
controller.B.on_event(ControllerButtonEvent.PRESSED, on_b_pressed)

def on_overlap_tile(p, loc):
    if int(p.y / 16) >= 60:
        game.over(True)
scene.on_overlap_tile(SpriteKind.player, imgDiamond, on_overlap_tile)

# =============================================================
# 4. CONTROLS
# =============================================================

def on_a_pressed():
    if Player_Miner.is_hitting_tile(CollisionDirection.BOTTOM):
        Player_Miner.vy = -150
controller.A.on_event(ControllerButtonEvent.PRESSED, on_a_pressed)

def on_overlap_tile2(e, loc2):
    e.destroy()
    tiles.set_tile_at(loc2, imgAir)
    scene.camera_shake(2, 200)
    sprites.destroy_all_sprites_of_kind(SpriteKind.enemy, effects.disintegrate, 200)
scene.on_overlap_tile(SpriteKind.enemy, imgSpikes, on_overlap_tile2)

def on_life_zero():
    game.over(False)
info.on_life_zero(on_life_zero)

# =============================================================
# 6. COLLISIONS
# =============================================================

def on_on_overlap(q, f):
    global isPlayerInvincible, invincibility_end
    if not (isPlayerInvincible):
        info.change_life_by(-1)
        f.destroy()
        q.vy = -100
        q.vx = -150 if q.x < f.x else 150
        isPlayerInvincible = True
        q.set_flag(SpriteFlag.GHOST_THROUGH_SPRITES, True)
        invincibility_end = game.runtime() + 500
sprites.on_overlap(SpriteKind.player, SpriteKind.enemy, on_on_overlap)

def get_facing_location():
    global plrCol, plrRow
    plrCol = int(Player_Miner.x / 16)
    plrRow = int(Player_Miner.y / 16)
    if Player_Miner.vx >= 0:
        return tiles.get_tile_location(plrCol + 1, plrRow)
    else:
        return tiles.get_tile_location(plrCol - 1, plrRow)
active: List[Sprite] = []
plrRow = 0
plrCol = 0
invincibility_end = 0
isPlayerInvincible = False
inventory_stone = 0
inventory_dirt = 0
adj: tiles.Location = None
Player_Miner: Sprite = None
imgDiamond: Image = None
imgSpikes: Image = None
imgDirtWall: Image = None
imgStone: Image = None
imgDirt: Image = None
imgAir: Image = None
# Block Miner Survival: Final Stable Version
# All lambdas replaced with named functions
# =============================================================
# 1. ARTWORK GENERATION
# =============================================================
imgBackground = image.create(160, 120)
imgBackground.fill(9)
imgBackground.fill_rect(0, 80, 160, 40, 7)
imgBackground.fill_rect(20, 60, 10, 20, 14)
imgBackground.fill_rect(10, 40, 30, 20, 7)
imgBackground.fill_rect(110, 50, 10, 30, 14)
imgBackground.fill_rect(100, 30, 30, 20, 7)
imgPlayer = img("""
    . . . . . 4 4 4 4 4 . . . . .
    . . . . 4 e e e e e 4 . . . .
    . . . 4 e d d d d d e 4 . . .
    . . . 4 d f d d d f d 4 . . .
    . . . 4 d d d d d d d 4 . . .
    . . . c d 1 d d d 1 d c . . .
    . . . e d d d d d d d e . . .
    . . f e d d d d d d d e f . .
    . . f 8 8 8 8 8 8 8 8 8 f . .
    . . f 8 8 8 8 8 8 8 8 8 f . .
    . . . 8 8 8 8 8 8 8 8 8 . . .
    . . . d d d d d d d d d . . .
    . . . d d . . . . . d d . . .
    . . . d d . . . . . d d . . .
    . . e e e . . . . . e e e . .
    . . e e e . . . . . e e e . .
    """)
imgZombie = img("""
    . . . . . 7 7 7 7 7 . . . . .
    . . . . 7 6 6 6 6 6 7 . . . .
    . . . 7 6 a a a a a 6 7 . . .
    . . . 7 a f a a a f a 7 . . .
    . . . 7 a a a a a a a 7 . . .
    . . . 2 a 1 a a a 1 a 2 . . .
    . . . 6 a a a a a a a 6 . . .
    . . f 6 a a a a a a a 6 f . .
    . . f 2 2 2 2 2 2 2 2 2 f . .
    . . f 2 2 2 2 2 2 2 2 2 f . .
    . . . 2 2 2 2 2 2 2 2 2 . . .
    . . . a a a a a a a a a . . .
    . . . a a . . . . . a a . . .
    . . . a a . . . . . a a . . .
    . . 6 6 6 . . . . . 6 6 6 . .
    . . 6 6 6 . . . . . 6 6 6 . .
    """)
imgAir = img("""
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    """)
imgDirt = img("""
    e d d d d d d d d d d d d d d e
    d d d d d d d d d d d d d d d d
    d d d e e e e e e e e e d d d d
    d d e e d d d d d d d e e d d d
    d d e d d d d d d d d d e d d d
    d e e d d d d d d d d d e e d d
    d e d d d d d d d d d d d e d d
    d e d d d d d d d d d d d e d d
    d e d d d d d d d d d d d e d d
    d e d d d d d d d d d d d e d d
    d e e d d d d d d d d d e e d d
    d d e d d d d d d d d d e d d d
    d d e e d d d d d d d e e d d d
    d d d e e e e e e e e e d d d d
    d d d d d d d d d d d d d d d d
    e d d d d d d d d d d d d d d e
    """)
imgStone = img("""
    c c c c c c c c c c c c c c c c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c c c c c c c c c c c c c c c c
    """)
imgBedrock = img("""
    1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 f f f f f f f f f f f f f 1 .
    1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1
    """)
imgDirtWall = img("""
    e e e e e e e e e e e e e e e e
    e d d d d d d d d d d d d d d e
    e d d d d d d d d d d d d d d e
    e d d d d d d d d d d d d d d e
    e d d d d d d d d d d d d d d e
    e d d d d d d d d d d d d d d e
    e d d d d d d d d d d d d d d e
    e e e e e e e e e e e e e e e e
    e e e e e e e e e e e e e e e e
    e d d d d d d d d d d d d d d e
    e d d d d d d d d d d d d d d e
    e d d d d d d d d d d d d d d e
    e d d d d d d d d d d d d d d e
    e d d d d d d d d d d d d d d e
    e d d d d d d d d d d d d d d e
    e e e e e e e e e e e e e e e e
    """)
imgSpikes = img("""
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . f . . f . . f . . f . . .
    . . f b f f b f f b f f b f . .
    . . f b f f b f f b f f b f . .
    . f b b b b b b b b b b b b f .
    . f b b b b b b b b b b b b f .
    f b b b b b b b b b b b b b b f
    f b b b b b b b b b b b b b b f
    c c c c c c c c c c c c c c c c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c b b b b b b b b b b b b b b c
    c c c c c c c c c c c c c c c c
    """)
imgDiamond = img("""
    . . . . . . . . . . . . . . . .
    . . . . . 9 9 9 9 9 . . . . . .
    . . . . 9 1 1 1 1 1 9 . . . . .
    . . . 9 1 1 1 1 1 1 1 9 . . . .
    . . 9 1 1 1 1 1 1 1 1 1 9 . . .
    . 9 1 1 1 f 1 1 1 f 1 1 1 9 . .
    9 1 1 1 1 1 1 1 1 1 1 1 1 1 9 .
    9 1 1 1 1 1 1 1 1 1 1 1 1 1 9 .
    9 1 1 1 f 1 1 1 1 f 1 1 1 1 9 .
    9 1 1 1 1 1 1 1 1 1 1 1 1 1 9 .
    . 9 1 1 1 1 1 1 1 1 1 1 1 9 . .
    . . 9 1 1 1 1 1 1 1 1 1 9 . . .
    . . . 9 1 1 1 1 1 1 1 9 . . . .
    . . . . 9 1 1 1 1 1 9 . . . . .
    . . . . . 9 9 9 9 9 . . . . . .
    . . . . . . . . . . . . . . . .
    """)
# =============================================================
# 2. GLOBAL VARIABLES
# =============================================================
globalGravity = 300
Player_Miner = sprites.create(imgPlayer, SpriteKind.player)
max_zombies = 5
# =============================================================
# 3. INITIALIZATION
# =============================================================
scene.set_background_image(imgBackground)
scene.set_background_color(9)
# World Generation
for col in range(64):
    for row in range(17, 62):
        loc3 = tiles.get_tile_location(col, row)
        if row < 35:
            tiles.set_tile_at(loc3, imgDirt)
            tiles.set_wall_at(loc3, True)
        elif row < 60:
            tiles.set_tile_at(loc3, imgStone)
            tiles.set_wall_at(loc3, True)
        elif row == 60:
            if randint(1, 10) > 9:
                tiles.set_tile_at(loc3, imgDiamond)
            else:
                tiles.set_tile_at(loc3, imgBedrock)
                tiles.set_wall_at(loc3, True)
        elif row == 61:
            tiles.set_tile_at(loc3, imgBedrock)
            tiles.set_wall_at(loc3, True)
Player_Miner.ay = globalGravity
Player_Miner.z = 10
tiles.place_on_tile(Player_Miner, tiles.get_tile_location(32, 16))
scene.camera_follow_sprite(Player_Miner)
info.set_life(5)
info.set_score(0)
controller.move_sprite(Player_Miner, 80, 0)

def on_on_update():
    global isPlayerInvincible
    if isPlayerInvincible and game.runtime() > invincibility_end:
        isPlayerInvincible = False
        Player_Miner.set_flag(SpriteFlag.GHOST_THROUGH_SPRITES, False)
    for g in sprites.all_of_kind(SpriteKind.enemy):
        if g.x < Player_Miner.x:
            g.vx = 40
        else:
            g.vx = -40
    info.set_score(int(Player_Miner.y / 16))
game.on_update(on_on_update)

# =============================================================
# 5. SPAWNING AND UPDATING
# =============================================================

def on_update_interval():
    global active
    active = sprites.all_of_kind(SpriteKind.enemy)
    if len(active) < max_zombies:
        z = sprites.create(imgZombie, SpriteKind.enemy)
        z.z = 5
        z.ay = globalGravity
        tiles.place_on_tile(z, tiles.get_tile_location(randint(1, 62), 16))
game.on_update_interval(5000, on_update_interval)
