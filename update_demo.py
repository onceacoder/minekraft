import json

# 1. Update pxt.json
with open('pxt.json', 'r') as f:
    config = json.load(f)

if "demo.ts" in config.get("files", []):
    config["files"].remove("demo.ts")

if "testFiles" not in config:
    config["testFiles"] = []

if "demo.ts" not in config["testFiles"]:
    config["testFiles"].append("demo.ts")

with open('pxt.json', 'w') as f:
    json.dump(config, f, indent=4)

