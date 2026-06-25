#!/usr/bin/env python3
"""Generate corrected voiceover for scenes 4/5/6 — v8.
Fixes: $10,000/CloudServ → $8,500/Northwind Cloud to match receipt #119 visuals.
"""
import os
import requests
import subprocess

API_KEY = open("/opt/autonomous-ai/.elevenlabs-api-key").read().strip()
VOICE_ID = "onwK4e9ZLuTAKqWW03F9"  # Daniel - Steady Broadcaster
MODEL = "eleven_flash_v2_5"
OUT_DIR = "/opt/autonomous-ai/hackathons/casper/demo-assets"

SCENES = [
    (
        "scene4_receipt_v8.mp3",
        "The on-chain receipt for Northwind Cloud. Agent, action, job payment reference — "
        "eight thousand five hundred U-S-D-T — all verified. "
        "Expand the Casper proof drawer: transaction hash, block height, "
        "named arguments from the smart contract. "
        "Verified client-side against Casper R-P-C."
    ),
    (
        "scene5_tamper_v8.mp3",
        "Try tampering. Change the amount from eighty-five hundred to fifteen thousand. "
        "Re-hash against the chain. Instantly: tampered. "
        "The hash mismatch proves what the agent originally decided."
    ),
    (
        "scene6_dispute_v8.mp3",
        "Northwind Cloud claims fifteen thousand dollars instead of the recorded "
        "eighty-five hundred. Hash mismatch. "
        "Disproved by cryptographic evidence. Seconds, not weeks."
    ),
]

os.makedirs(OUT_DIR, exist_ok=True)

for filename, text in SCENES:
    out_path = os.path.join(OUT_DIR, filename)
    print(f"Generating: {filename} ({len(text)} chars)...")
    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "model_id": MODEL,
            "voice_settings": {
                "stability": 0.71,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True,
            },
        },
    )

    if resp.status_code == 200:
        with open(out_path, "wb") as f:
            f.write(resp.content)
        print(f"  OK: {len(resp.content)} bytes")
    else:
        print(f"  ERROR {resp.status_code}: {resp.text[:200]}")
        continue

    # Report duration
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", out_path],
        capture_output=True, text=True
    )
    dur = result.stdout.strip()
    if dur:
        print(f"  Duration: {float(dur):.1f}s")

print("\nDone. Use scene*_v8.mp3 files in compose_v8.py")
