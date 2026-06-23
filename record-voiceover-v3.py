#!/usr/bin/env python3
"""Record voiceover segments via ElevenLabs API — v3 receipt-loop flow."""
import requests
import os

API_KEY = open('/opt/autonomous-ai/.elevenlabs-api-key').read().strip()
VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'  # Daniel - Steady Broadcaster
MODEL = 'eleven_flash_v2_5'
OUT_DIR = '/opt/autonomous-ai/hackathons/casper/demo-assets'

SEGMENTS = [
    {
        'name': '01_problem',
        'text': 'A-I agents now approve payments, execute trades, and make decisions autonomously. But when something goes wrong, there is no proof of what actually happened.'
    },
    {
        'name': '02_solution',
        'text': 'Agent Ledger. Every agent decision gets a tamper-proof receipt on Casper, bound to a payment or job reference hash. If an agent gets paid, it leaves a receipt.'
    },
    {
        'name': '03_dashboard',
        'text': "Here's the dashboard. Eight agent decisions from four different agents, each recorded on Casper testnet. Real metrics. On-chain receipts, confirmation count, and the latest Casper block number."
    },
    {
        'name': '04_receipt',
        'text': "Click any decision to see its on-chain receipt. Every field is here. The agent, the action, the job payment reference hash, and the Casper transaction. The verification badge confirms the hashes match the on-chain data in real time. Each receipt is shareable with a Q-R code."
    },
    {
        'name': '05_tamper',
        'text': "Now watch. Click try tampering. The system modifies the payment amount in the output data. It re-verifies against the on-chain hash, and the receipt instantly shows tampered. The hash mismatch proves exactly what the agent originally decided. The ledger never lies."
    },
    {
        'name': '06_workbench',
        'text': "The Agent Workbench lets you try it live. Pick a scenario. Vendor payment, dee-fi swap, or risk alert. The agent makes a decision, records the hash on Casper testnet, and you get a verifiable receipt. Every recording is rate-limited and balance-protected."
    },
    {
        'name': '07_close',
        'text': "Every receipt can be exported as an audit-ready report. Markdown or J-SON, with chain verification status and a privacy note that no raw data is stored on chain. Agent Ledger. Verifiable receipts for the agent economy. Built on Casper. Open source on GitHub."
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

# Concatenate all segments into full voiceover
print("\nConcatenating full voiceover...")
import subprocess
concat_list = os.path.join(OUT_DIR, 'concat_v3.txt')
with open(concat_list, 'w') as f:
    for seg in SEGMENTS:
        f.write(f"file '{seg['name']}.mp3'\n")

subprocess.run([
    'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
    '-i', concat_list,
    '-c', 'copy',
    os.path.join(OUT_DIR, 'full_voiceover_v3.mp3')
], check=True, capture_output=True)

# Get duration
result = subprocess.run([
    'ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format',
    os.path.join(OUT_DIR, 'full_voiceover_v3.mp3')
], capture_output=True, text=True)
import json
duration = float(json.loads(result.stdout)['format']['duration'])
print(f"Full voiceover: {duration:.1f}s")

# Per-segment durations
print("\nSegment durations:")
for seg in SEGMENTS:
    result = subprocess.run([
        'ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format',
        os.path.join(OUT_DIR, f"{seg['name']}.mp3")
    ], capture_output=True, text=True)
    dur = float(json.loads(result.stdout)['format']['duration'])
    print(f"  {seg['name']}: {dur:.1f}s")
