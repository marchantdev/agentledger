#!/usr/bin/env python3
"""Record voiceover segments via ElevenLabs API — v3b TIGHTER scripts for <=85s."""
import requests
import os
import subprocess
import json

API_KEY = open('/opt/autonomous-ai/.elevenlabs-api-key').read().strip()
VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'  # Daniel - Steady Broadcaster
MODEL = 'eleven_flash_v2_5'
OUT_DIR = '/opt/autonomous-ai/hackathons/casper/demo-assets'

SEGMENTS = [
    {
        'name': '01_problem',
        'text': 'A-I agents handle millions in autonomous decisions. But when something goes wrong, there is no proof of what they decided.'
    },
    {
        'name': '02_solution',
        'text': 'Agent Ledger. Tamper-proof receipts on Casper, tied to payment and job reference hashes.'
    },
    {
        'name': '03_dashboard',
        'text': "The dashboard shows eight decisions from four agents on Casper testnet. Real metrics: on-chain receipts, confirmations, and the latest block."
    },
    {
        'name': '04_receipt',
        'text': "Click any decision for its on-chain receipt. Agent, action, job payment reference, Casper transaction hash — all verified from R-P-C. Shareable via Q-R code."
    },
    {
        'name': '05_tamper',
        'text': "Now watch. Tamper the payment amount. The hash breaks instantly. Tampered. The on-chain receipt proves exactly what the agent originally decided."
    },
    {
        'name': '06_workbench',
        'text': "The Agent Workbench. Pick a scenario, record on Casper, get a verifiable receipt. Rate-limited and balance-protected for safe public access."
    },
    {
        'name': '07_close',
        'text': "Export audit-ready reports in Markdown or J-SON. No raw data stored on chain. Agent Ledger. Verifiable receipts for the agent economy. Built on Casper."
    },
]

os.makedirs(OUT_DIR, exist_ok=True)

for seg in SEGMENTS:
    print(f"Recording {seg['name']}...", end=' ', flush=True)
    url = f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}'
    resp = requests.post(url, headers={
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
    }, json={
        'text': seg['text'],
        'model_id': MODEL,
        'voice_settings': {
            'stability': 0.71,
            'similarity_boost': 0.75,
            'style': 0.0,
            'use_speaker_boost': True,
        }
    })
    if resp.status_code == 200:
        out_path = os.path.join(OUT_DIR, f"{seg['name']}.mp3")
        with open(out_path, 'wb') as f:
            f.write(resp.content)
        print(f"OK ({len(resp.content)/1024:.0f}KB)")
    else:
        print(f"FAIL ({resp.status_code}: {resp.text[:200]})")

# Concatenate
print("\nConcatenating full voiceover...")
concat_list = os.path.join(OUT_DIR, 'concat_v3b.txt')
with open(concat_list, 'w') as f:
    for seg in SEGMENTS:
        f.write(f"file '{seg['name']}.mp3'\n")

subprocess.run([
    'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
    '-i', concat_list, '-c', 'copy',
    os.path.join(OUT_DIR, 'full_voiceover_v3b.mp3')
], check=True, capture_output=True)

# Durations
result = subprocess.run([
    'ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format',
    os.path.join(OUT_DIR, 'full_voiceover_v3b.mp3')
], capture_output=True, text=True)
total = float(json.loads(result.stdout)['format']['duration'])
print(f"Full voiceover: {total:.1f}s")

print("\nSegment durations:")
for seg in SEGMENTS:
    r = subprocess.run([
        'ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format',
        os.path.join(OUT_DIR, f"{seg['name']}.mp3")
    ], capture_output=True, text=True)
    d = float(json.loads(r.stdout)['format']['duration'])
    print(f"  {seg['name']}: {d:.1f}s")

if total > 90:
    print(f"\n⚠ WARNING: {total:.1f}s exceeds 90s target!")
else:
    print(f"\n✓ Within 90s target ({total:.1f}s)")
