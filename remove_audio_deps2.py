import re

# game_lifecycle.ts
with open('game_lifecycle.ts', 'r') as f:
    content = f.read()
content = re.sub(r'^\s*chooseTheme\(\)\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*stopLevelMusic\(\)\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*playVictoryJingle\(\)\n', '', content, flags=re.MULTILINE)
with open('game_lifecycle.ts', 'w') as f:
    f.write(content)

# player.ts
with open('player.ts', 'r') as f:
    content = f.read()
content = re.sub(r'^\s*playDamageSound\(\)\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*stopLevelMusic\(\)\n', '', content, flags=re.MULTILINE)
content = re.sub(r'^\s*playDeathSound\(\)\n', '', content, flags=re.MULTILINE)
with open('player.ts', 'w') as f:
    f.write(content)

