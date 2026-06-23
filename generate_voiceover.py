#!/usr/bin/env python3
"""Generate demo voiceover audio using ElevenLabs TTS."""
import os
import json
import requests

API_KEY = open(os.path.expanduser("/opt/autonomous-ai/.elevenlabs-api-key")).read().strip()
OUTPUT_DIR = "/opt/autonomous-ai/hackathons/casper/demo-assets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Voice: use a professional male voice
# First, list available voices to pick the best one
def list_voices():
    resp = requests.get(
        "https://api.elevenlabs.io/v1/voices",
        headers={"xi-api-key": API_KEY},
    )
    resp.raise_for_status()
    voices = resp.json()["voices"]
    for v in voices:
        labels = v.get("labels", {})
        print(f"  {v['voice_id'][:12]}... {v['name']:20s} {labels}")
    return voices

# Generate speech for a segment
def generate_speech(text, output_path, voice_id="pNInz6obpgDQGcFmaJgB"):  # Adam - professional male
    resp = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={
            "xi-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.6,
                "similarity_boost": 0.75,
                "style": 0.2,
                "use_speaker_boost": True,
            },
        },
    )
    resp.raise_for_status()
    with open(output_path, "wb") as f:
        f.write(resp.content)
    size_kb = len(resp.content) / 1024
    print(f"  Saved {output_path} ({size_kb:.0f} KB)")

# Full voiceover script — natural, conversational, ~75 seconds
SEGMENTS = [
    {
        "name": "01_problem",
        "text": "AI agents now approve payments, execute trades, and make decisions autonomously. But when something goes wrong, there's no proof of what actually happened.",
    },
    {
        "name": "02_solution",
        "text": "AgentLedger. Every agent decision gets a tamper-proof hash on Casper. If an agent gets paid, it leaves a receipt.",
    },
    {
        "name": "03_dashboard",
        "text": "Here's the dashboard. Six agent decisions, each recorded on Casper testnet. Every receipt shows the agent, the action, and a link to the on-chain transaction.",
    },
    {
        "name": "04_verify_pass",
        "text": "Now the key feature. Select a treasury agent's payment approval. The original input and output data are loaded. Click verify. Both hashes match the on-chain attestation. This decision is verified.",
    },
    {
        "name": "05_tamper_detect",
        "text": "But what if someone changes the amount after the fact? Change ten thousand to fifty thousand and verify again. The hash breaks. Tamper detected. The on-chain receipt proves the original decision. The ledger never lies.",
    },
    {
        "name": "06_explorer",
        "text": "Every receipt links directly to the Casper block explorer. Real transactions on testnet. Cryptographic proof anyone can verify independently.",
    },
    {
        "name": "07_close",
        "text": "AgentLedger. Verifiable receipts for the agent economy. Built on Casper. Open source on GitHub.",
    },
]

if __name__ == "__main__":
    print("Listing available voices...")
    voices = list_voices()

    print("\nGenerating voiceover segments...")
    for seg in SEGMENTS:
        out = os.path.join(OUTPUT_DIR, f"{seg['name']}.mp3")
        print(f"\n[{seg['name']}]")
        print(f"  Text: {seg['text'][:60]}...")
        generate_speech(seg["text"], out)

    print(f"\nAll {len(SEGMENTS)} segments saved to {OUTPUT_DIR}/")

    # Also generate a single combined version
    full_text = " ".join(seg["text"] for seg in SEGMENTS)
    full_out = os.path.join(OUTPUT_DIR, "full_voiceover.mp3")
    print(f"\nGenerating full combined voiceover...")
    generate_speech(full_text, full_out)
    print("Done!")
