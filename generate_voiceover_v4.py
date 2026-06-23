"""Generate v4 demo voiceover — scene-by-scene for timing control."""
import os
import requests
import json

API_KEY = open("/opt/autonomous-ai/.elevenlabs-api-key").read().strip()
VOICE_ID = "onwK4e9ZLuTAKqWW03F9"  # Daniel
MODEL = "eleven_flash_v2_5"
OUT_DIR = "/opt/autonomous-ai/hackathons/casper/demo-assets"

SCENES = [
    ("scene1_problem.mp3", "A-I agents approve payments and execute trades. But when something goes wrong, there's no proof."),
    ("scene2_solution.mp3", "Agent Ledger. Tamper-proof receipts on Casper. If an agent gets paid, it leaves a receipt."),
    ("scene3_workbench.mp3", "The Agent Workbench. Pick a scenario: vendor payment. Watch the agent evaluate: read invoice, check trust score, apply budget rules. Decision: approve ten thousand dollars. Hash recorded on Casper testnet. Every step visible."),
    ("scene4_receipt.mp3", "The on-chain receipt. Agent, action, and job payment reference hash, all verified. Expand the Casper proof drawer: transaction hash, block height, named arguments from the smart contract. Verified client-side against Casper R-P-C."),
    ("scene5_tamper.mp3", "Try tampering. Change the amount from ten thousand to fifteen thousand. Re-hash against the chain. Instantly: tampered. The hash mismatch proves what the agent originally decided."),
    ("scene6_dispute.mp3", "A vendor claims fifteen thousand dollars. The dispute case file shows the agent approved ten thousand. Hash mismatch. Disproved by cryptographic evidence. Seconds, not weeks."),
    ("scene7_close.mp3", "Agent Ledger. Verifiable receipts for the agent economy. Built on Casper."),
]

os.makedirs(OUT_DIR, exist_ok=True)

for filename, text in SCENES:
    out_path = os.path.join(OUT_DIR, filename)
    if os.path.exists(out_path):
        print(f"SKIP (exists): {filename}")
        continue

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
                "stability": 0.7,
                "similarity_boost": 0.8,
                "style": 0.0,
                "use_speaker_boost": True,
            },
        },
    )

    if resp.status_code == 200:
        with open(out_path, "wb") as f:
            f.write(resp.content)
        print(f"  OK: {len(resp.content)} bytes -> {out_path}")
    else:
        print(f"  ERROR {resp.status_code}: {resp.text[:200]}")

# Also generate the full concatenated version
full_text = " ".join(text for _, text in SCENES)
full_path = os.path.join(OUT_DIR, "voiceover_v4_full.mp3")
if not os.path.exists(full_path):
    print(f"\nGenerating full voiceover ({len(full_text)} chars)...")
    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "text": full_text,
            "model_id": MODEL,
            "voice_settings": {
                "stability": 0.7,
                "similarity_boost": 0.8,
                "style": 0.0,
                "use_speaker_boost": True,
            },
        },
    )
    if resp.status_code == 200:
        with open(full_path, "wb") as f:
            f.write(resp.content)
        print(f"  OK: {len(resp.content)} bytes -> {full_path}")
    else:
        print(f"  ERROR {resp.status_code}: {resp.text[:200]}")
else:
    print(f"SKIP (exists): voiceover_v4_full.mp3")

# Report durations
print("\n--- Audio Durations ---")
for filename, _ in SCENES:
    path = os.path.join(OUT_DIR, filename)
    if os.path.exists(path):
        import subprocess
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", path],
            capture_output=True, text=True
        )
        dur = result.stdout.strip()
        print(f"  {filename}: {float(dur):.1f}s" if dur else f"  {filename}: (no duration)")

full_path2 = os.path.join(OUT_DIR, "voiceover_v4_full.mp3")
if os.path.exists(full_path2):
    import subprocess
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", full_path2],
        capture_output=True, text=True
    )
    dur = result.stdout.strip()
    print(f"  voiceover_v4_full.mp3: {float(dur):.1f}s (TOTAL)" if dur else f"  voiceover_v4_full.mp3: (no duration)")
