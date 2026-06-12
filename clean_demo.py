import re
import glob

def clean_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Remove demoStartEscape() and demoSelectBridgeMaterial() calls
    content = re.sub(r'^\s*demoStartEscape\(\)\n', '', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*demoSelectBridgeMaterial\(\)\n', '', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*let success = demoSelectBridgeMaterial\(\)\n', '', content, flags=re.MULTILINE)

    # Remove demoMode conditions.
    # We'll just replace '|| demoMode' or '&& !demoMode' with '' to maintain logic
    content = content.replace(" || demoMode", "")
    content = content.replace(" && !demoMode", "")
    content = content.replace("demoMode || ", "")
    content = content.replace("!demoMode && ", "")

    # For standalone if (demoMode), we can just remove the block if it's a single line like `if (demoMode) return`
    content = re.sub(r'^\s*if\s*\(\s*demoMode\s*\)\s*return\n', '', content, flags=re.MULTILINE)
    
    # Specific removals for blocks
    # game_lifecycle.ts:
    content = re.sub(r'\s*if \(demoMode\) \{\n\s*demoStartedAt = game.runtime\(\)\n\s*\}', '', content)
    
    # For UI.ts:
    content = re.sub(r'\s*if \(demoMode\)\s*menuView\.print\("< ON >", 84, iy, 1\)', '', content)
    content = re.sub(r'\s*if \(!isDemoActive\(\) \|\| !demoPaused\) return', '', content)
    
    # Replace any leftover if (demoMode) { ... } blocks
    # Actually, let's just do a manual cleanup for the remaining lines to be safe.
    
    with open(filepath, 'w') as f:
        f.write(content)

for ts in glob.glob('*.ts'):
    clean_file(ts)
