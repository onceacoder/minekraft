import re

# save.ts
with open('save.ts', 'r') as f:
    content = f.read()
content = re.sub(r'^\s*playLevelMusic\(\)\n', '', content, flags=re.MULTILINE)
with open('save.ts', 'w') as f:
    f.write(content)

# game_lifecycle.ts
with open('game_lifecycle.ts', 'r') as f:
    content = f.read()
content = re.sub(r'^\s*if \(activeObstacle == OBSTACLE_FREEZE\) \{\n\s*playNightMusic\(\)\n\s*\} else \{\n\s*playLevelMusic\(\)\n\s*\}', '', content, flags=re.MULTILINE)
with open('game_lifecycle.ts', 'w') as f:
    f.write(content)

# main.ts
with open('main.ts', 'r') as f:
    content = f.read()
content = re.sub(r'^\s*stopLevelMusic\(\)\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*playLevelMusic\(\)\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*playDungeonMusic\(\)\n', '', content, flags=re.MULTILINE)
with open('main.ts', 'w') as f:
    f.write(content)

