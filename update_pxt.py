import json

with open('pxt.json', 'r') as f:
    config = json.load(f)

# Remove test.ts from testFiles
if "testFiles" in config and "test.ts" in config["testFiles"]:
    config["testFiles"].remove("test.ts")

# Remove audio.ts from files
if "files" in config and "audio.ts" in config["files"]:
    config["files"].remove("audio.ts")

with open('pxt.json', 'w') as f:
    json.dump(config, f, indent=4)
