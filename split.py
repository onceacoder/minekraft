import os

MAIN_TS = '/Users/georgekraev/Documents/dev/MineKraft/minekraft/main.ts'
OUT_DIR = '/Users/georgekraev/Documents/dev/MineKraft/minekraft/'

with open(MAIN_TS, 'r') as f:
    lines = f.readlines()

sections = []
current_section = []
for line in lines:
    if line.startswith('// --------------------------------------------------------------------------'):
        if current_section:
            sections.append(current_section)
        current_section = [line]
    else:
        current_section.append(line)
if current_section:
    sections.append(current_section)

# Mapping of section indices to target file
file_mapping = {
    'constants.ts': [1, 2, 3, 4],
    'world.ts': [5, 6, 11, 12, 15, 16, 17, 18],
    'audio.ts': [13, 14],
    'enemies.ts': [19, 20, 21, 32, 33],
    'demo.ts': [28, 29],
    'player.ts': [7, 8, 9, 10, 24, 25, 26, 27, 30, 31, 34, 35],
    'ui.ts': [22, 23, 38, 39],
    'main.ts': [0, 36, 37, 40, 41]
}

for filename, indices in file_mapping.items():
    content = ""
    for idx in indices:
        content += "".join(sections[idx]) + "\n"
    
    with open(os.path.join(OUT_DIR, filename), 'w') as f:
        f.write(content)

print("Split completed successfully!")
