#!/usr/bin/env python3
"""Record voiceover segments via ElevenLabs API."""
import requests
import os
import json

API_KEY = open('/opt/autonomous-ai/.elevenlabs-api-key').read().strip()
VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'  # Daniel - Steady Broadcaster
MODEL = 'eleven_flash_v2_5'
OUT_DIR = '/opt/autonomous-ai/hackathons/casper/video'

# Each segment matches a scene in demo-script.md
# Written for natural spoken delivery (phonetic adjustments applied)
SEGMENTS = [
    {
        'name': '01_problem',
        'text': 'A-I agents now approve payments, execute trades, and make decisions autonomously. But when something goes wrong, there is no proof of what actually happened.'
    },
    {
        'name': '02_solution',
        'text': 'Agent Ledger. Every agent decision gets a tamper-proof hash on Casper. If an agent gets paid, it leaves a receipt.'
    },
    {
        'name': '03_dashboard',
        'text': "Here's the dashboard. Six agent decisions from four different agents, each recorded on Casper testnet. Every receipt shows the agent, the action, and a link to the on-chain transaction."
    },
    {
        'name': '04_verify_pass',
        'text': "Now the key feature. Click the guided demo button. It loads a treasury agent's payment approval with the original data, and verifies it against the on-chain hash. Both hashes match. This decision is verified."
    },
    {
        'name': '05_tamper_detect',
        'text': 'Now watch. The demo tampers the payment amount in the output data. The modified badge appears. It re-verifies, and the hash breaks instantly. Tamper detected. The on-chain receipt proves exactly what the agent originally decided. The ledger never lies.'
    },
    {
        'name': '06_explorer',
        'text': 'Every receipt links directly to the Casper block explorer. Real transactions on testnet. Cryptographic proof anyone can verify independently.'
    },
    {
        'name': '07_close',
        'text': 'Agent Ledger. Verifiable receipts for the agent economy. Built on Casper. Open source on GitHub.'
    },
]

def generate_segment(segment):
    url = f'https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}'
    headers = {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
    }
    data = {
        'text': segment['text'],
        'model_id': MODEL,
        'voice_settings': {
            'stability': 0.6,
            'similarity_boost': 0.8,
            'style': 0.3,
        }
    }

    print(f"Generating {segment['name']}...")
    resp = requests.post(url, headers=headers, json=data, timeout=30)
    if resp.status_code != 200:
        print(f"  ERROR {resp.status_code}: {resp.text[:200]}")
        return False

    outpath = os.path.join(OUT_DIR, f"{segment['name']}.mp3")
    with open(outpath, 'wb') as f:
        f.write(resp.content)

    size_kb = len(resp.content) / 1024
    print(f"  Saved {outpath} ({size_kb:.1f} KB)")
    return True

if __name__ == '__main__':
    os.makedirs(OUT_DIR, exist_ok=True)
    success = 0
    for seg in SEGMENTS:
        if generate_segment(seg):
            success += 1
    print(f"\nDone: {success}/{len(SEGMENTS)} segments generated")
