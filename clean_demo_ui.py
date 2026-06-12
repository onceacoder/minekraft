import re

with open('ui.ts', 'r') as f:
    content = f.read()

# Remove drawDemoPausedBanner function block completely
content = re.sub(r'function drawDemoPausedBanner\(target: Image\) \{[\s\S]*?\}\n', '', content)

with open('ui.ts', 'w') as f:
    f.write(content)

with open('main.ts', 'r') as f:
    content = f.read()

# Remove drawDemoPausedBanner call
content = re.sub(r'^\s*drawDemoPausedBanner\(target\)\n', '', content, flags=re.MULTILINE)

with open('main.ts', 'w') as f:
    f.write(content)
