with open('/Users/georgekraev/.gemini/antigravity-ide/brain/5cb7fc7d-60c1-412e-9cc9-ebdbe1b44ab7/artifacts/task.md', 'r') as f:
    content = f.read()

content += "\n- [x] Verify Scarecrow Interaction logic (fixed a leak preventing scarecrows from despawning on level change)\n"

with open('/Users/georgekraev/.gemini/antigravity-ide/brain/5cb7fc7d-60c1-412e-9cc9-ebdbe1b44ab7/artifacts/task.md', 'w') as f:
    f.write(content)
