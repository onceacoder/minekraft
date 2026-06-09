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
        stepDown(scale, home), home, stepDown(scale, home), home
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


