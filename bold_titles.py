import os

filepath = '/Users/georgekraev/Documents/dev/MineKraft/minekraft/ui.ts'
with open(filepath, 'r') as f:
    content = f.read()

helper = """function printBold(target: Image, text: string, x: number, y: number, color: number) {
    target.print(text, x, y, color)
    target.print(text, x + 1, y, color)
}

function clampScreen"""

content = content.replace("function clampScreen", helper)

replacements = [
    ('target.print("MINEKRAFT", 52, 12, 1)', 'printBold(target, "MINEKRAFT", 52, 12, 1)'),
    ('target.print("SETTINGS", 56, 20, 1)', 'printBold(target, "SETTINGS", 56, 20, 1)'),
    ('target.print("DIFFICULTY", 42, 20, 1)', 'printBold(target, "DIFFICULTY", 42, 20, 1)'),
    ('target.print("Inventory", 48, 28, 15)', 'printBold(target, "Inventory", 48, 28, 15)'),
    ('target.print("SAVE GAME", 44, 38, 1)', 'printBold(target, "SAVE GAME", 44, 38, 1)'),
    ('target.print("LOAD GAME", 46, 10, 1)', 'printBold(target, "LOAD GAME", 46, 10, 1)'),
    ('target.print("MINEKRAFT", 52, 22, 1)', 'printBold(target, "MINEKRAFT", 52, 22, 1)'),
    ('target.print("GAME COMPLETE", 34, 38, 1)', 'printBold(target, "GAME COMPLETE", 34, 38, 1)'),
    ('target.print("WELL DONE!", 48, 52, 1)', 'printBold(target, "WELL DONE!", 48, 52, 1)'),
    ('target.print("GAME OVER", 44, 45, 2)', 'printBold(target, "GAME OVER", 44, 45, 2)'),
    ('target.print("PAUSED", 62, 50, 15)', 'printBold(target, "PAUSED", 62, 50, 15)')
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, 'w') as f:
    f.write(content)

print("Done")
