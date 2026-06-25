#!/usr/bin/env python3
"""v9 voiceover — edge-tts (Microsoft en-GB-RyanNeural, free, no quota) — Northwind Cloud / receipt #119."""
import asyncio, edge_tts, subprocess, os
VOICE="en-GB-RyanNeural"
OUT="/opt/autonomous-ai/hackathons/casper/demo-assets"
SCENES=[
 ("scene4_receipt_v9.mp3","The on-chain receipt for Northwind Cloud. Agent, action, job payment reference — eight thousand five hundred U-S-D-T — all verified. Expand the Casper proof drawer: transaction hash, block height, named arguments from the smart contract. Verified client-side against Casper R-P-C."),
 ("scene5_tamper_v9.mp3","Try tampering. Change the amount from eighty-five hundred to fifteen thousand. Re-hash against the chain. Instantly: tampered. The hash mismatch proves what the agent originally decided."),
 ("scene6_dispute_v9.mp3","Northwind Cloud claims fifteen thousand dollars instead of the recorded eighty-five hundred. Hash mismatch. Disproved by cryptographic evidence. Seconds, not weeks."),
]
async def main():
    for fn,txt in SCENES:
        p=os.path.join(OUT,fn)
        await edge_tts.Communicate(txt,VOICE).save(p)
        d=subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration","-of","csv=p=0",p],capture_output=True,text=True).stdout.strip()
        print("  %s: %.1fs"%(fn,float(d)))
asyncio.run(main())
