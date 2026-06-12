with open('demo.ts', 'r') as f:
    content = f.read()

content = content.replace("function isDemoActive(): boolean {", "isDemoActive = function(): boolean {")
content = content.replace("function toggleDemoPause() {", "toggleDemoPause = function() {")
content = content.replace("function updateDemoMode() {", "updateDemoMode = function() {")
content = content.replace("function demoStartEscape() {", "demoStartEscape = function() {")
content = content.replace("function demoSelectBridgeMaterial(): boolean {", "demoSelectBridgeMaterial = function(): boolean {")

with open('demo.ts', 'w') as f:
    f.write(content)

