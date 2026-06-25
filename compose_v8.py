#!/usr/bin/env python3
"""Compose AgentLedger demo video v8 -- tight cut with corrected audio.
Fixes from v7:
  1. Audio: $8,500/Northwind Cloud (was $10K/CloudServ) in scenes 4/5/6
  2. Ending: clean VERIFIED card (was raw JSON flash)
Structure: dispute stakes -> receipt #119 -> tamper mismatch -> VERIFIED card
"""
import os, subprocess, sys

BASE = "/opt/autonomous-ai/hackathons/casper"
ASSETS = os.path.join(BASE, "demo-assets")
VIDEO_DIR = os.path.join(BASE, "video")
os.makedirs(VIDEO_DIR, exist_ok=True)

def get_duration(path):
    try:
        r = subprocess.run(["ffprobe","-v","quiet","-show_entries","format=duration",
            "-of","default=noprint_wrappers=1:nokey=1",path],capture_output=True,text=True)
        return float(r.stdout.strip())
    except: return 0

def img(name):
    for d in [ASSETS, os.path.join(BASE,"screenshots")]:
        p = os.path.join(d, name)
        if os.path.exists(p): return p
    print(f"  [MISSING] {name}"); return None

def still_clip(image_path, duration, output):
    r = subprocess.run([
        "ffmpeg","-y","-loop","1","-i",image_path,
        "-c:v","libx264","-tune","stillimage","-pix_fmt","yuv420p",
        "-vf","scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black",
        "-an","-t",str(duration),output],capture_output=True)
    return r.returncode == 0

def compose_scene(audio_path, image_specs, output):
    dur = get_duration(audio_path)
    if dur < 0.5: return False
    if len(image_specs) == 1:
        r = subprocess.run([
            "ffmpeg","-y","-loop","1","-i",image_specs[0][0],"-i",audio_path,
            "-c:v","libx264","-tune","stillimage","-pix_fmt","yuv420p",
            "-vf","scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black",
            "-c:a","aac","-b:a","192k","-shortest","-t",str(dur),output],capture_output=True)
        return r.returncode == 0
    total_fixed = sum(d for _,d in image_specs if d is not None)
    rem_count = sum(1 for _,d in image_specs if d is None)
    rem_each = max(1.0,(dur-total_fixed)/rem_count) if rem_count>0 else 0
    parts = []
    for i,(seg_img,seg_dur) in enumerate(image_specs):
        t = seg_dur if seg_dur is not None else rem_each
        part = output.replace(".mp4",f"_p{i}.mp4")
        still_clip(seg_img, t, part); parts.append(part)
    cl = output.replace(".mp4","_cl.txt")
    with open(cl,"w") as f:
        for p in parts: f.write(f"file '{p}'\n")
    r = subprocess.run([
        "ffmpeg","-y","-f","concat","-safe","0","-i",cl,"-i",audio_path,
        "-c:v","libx264","-crf","18","-pix_fmt","yuv420p",
        "-c:a","aac","-b:a","192k","-shortest",output],capture_output=True)
    for p in parts:
        try: os.remove(p)
        except: pass
    try: os.remove(cl)
    except: pass
    return r.returncode == 0 and os.path.exists(output)

def main():
    print("=== AgentLedger Demo Video v8 — Corrected Audio + VERIFIED Card ===\n")
    scenes = []

    # 1. Dispute stakes (uses v8 corrected dispute audio)
    print("[1] Dispute stakes (Northwind Cloud $8,500)...")
    a1 = os.path.join(ASSETS,"scene6_dispute_v8.mp3")
    imgs1 = [(img("v7_landing_hero.png"),5.0),(img("v6_02_job_brief.png"),None)]
    o1 = os.path.join(VIDEO_DIR,"v8_dispute.mp4")
    if all(p for p,_ in imgs1) and os.path.exists(a1):
        ok = compose_scene(a1, imgs1, o1)
        print(f"  {'OK' if ok else 'FAIL'} ({get_duration(o1):.1f}s)")
        if ok: scenes.append(o1)
    else: print("  SKIP — missing assets")

    # 2. Receipt #119 (uses v8 corrected receipt audio)
    print("[2] Receipt #119 (Northwind Cloud $8,500)...")
    a2 = os.path.join(ASSETS,"scene4_receipt_v8.mp3")
    imgs2 = [(img("v7_receipt114.png"),7.0),(img("v7_receipt114_verified.png"),None)]
    o2 = os.path.join(VIDEO_DIR,"v8_receipt114.mp4")
    if all(p for p,_ in imgs2) and os.path.exists(a2):
        ok = compose_scene(a2, imgs2, o2)
        print(f"  {'OK' if ok else 'FAIL'} ({get_duration(o2):.1f}s)")
        if ok: scenes.append(o2)
    else: print("  SKIP — missing assets")

    # 3. Tamper mismatch (uses v8 corrected tamper audio)
    print("[3] Tamper mismatch ($8,500 → $15,000)...")
    a3 = os.path.join(ASSETS,"scene5_tamper_v8.mp3")
    imgs3 = [(img("v6_07a_tamper_comparison.png"),5.0),(img("v6_07b_tampered.png"),None)]
    o3 = os.path.join(VIDEO_DIR,"v8_tamper.mp4")
    if all(p for p,_ in imgs3) and os.path.exists(a3):
        ok = compose_scene(a3, imgs3, o3)
        print(f"  {'OK' if ok else 'FAIL'} ({get_duration(o3):.1f}s)")
        if ok: scenes.append(o3)
    else: print("  SKIP — missing assets")

    # 4. VERIFIED card (3s with short voiceover confirmation)
    print("[4] VERIFIED card (clean ending)...")
    vi = img("v8_verified_card.png")
    o4 = os.path.join(VIDEO_DIR,"v8_verified_card.mp4")
    if vi:
        # Silent 4s card with fade-in feel
        r = subprocess.run([
            "ffmpeg","-y","-loop","1","-i",vi,
            "-f","lavfi","-i","anullsrc=channel_layout=stereo:sample_rate=44100",
            "-c:v","libx264","-tune","stillimage","-pix_fmt","yuv420p",
            "-vf","scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black",
            "-c:a","aac","-b:a","192k","-t","4",o4],capture_output=True)
        if r.returncode == 0:
            print(f"  OK (4.0s)"); scenes.append(o4)
        else: print("  FAIL")
    else: print("  SKIP — missing card image")

    if not scenes:
        print("No scenes!"); sys.exit(1)

    total = sum(get_duration(f) for f in scenes)
    print(f"\nConcatenating {len(scenes)} scenes ({total:.1f}s)...")
    concat = os.path.join(VIDEO_DIR,"v8_concat.txt")
    with open(concat,"w") as f:
        for sf in scenes: f.write(f"file '{sf}'\n")
    final = os.path.join(VIDEO_DIR,"agentledger_demo_v8.mp4")
    r = subprocess.run([
        "ffmpeg","-y","-f","concat","-safe","0","-i",concat,
        "-c:v","libx264","-crf","18","-preset","medium",
        "-pix_fmt","yuv420p","-c:a","aac","-b:a","192k",final],
        capture_output=True,text=True)
    if r.returncode != 0:
        print(f"ffmpeg error: {r.stderr[-300:]}"); sys.exit(1)
    dur = get_duration(final)
    mb = os.path.getsize(final)/1024/1024
    print(f"\n=== DONE ===")
    print(f"Duration: {dur:.1f}s")
    print(f"Size: {mb:.1f}MB")
    print(f"Path: {final}")

    # Frame check
    print(f"\n--- Frame Check ---")
    for ts in [2, 5, 12, 20, 30, 35, 38]:
        if ts < dur:
            frame_path = f"/tmp/v8_frame_{ts}s.png"
            subprocess.run([
                "ffmpeg","-y","-ss",str(ts),"-i",final,
                "-vframes","1","-q:v","2",frame_path],capture_output=True)
            if os.path.exists(frame_path):
                print(f"  {ts}s: frame extracted ({os.path.getsize(frame_path)/1024:.0f}KB)")

if __name__ == "__main__":
    main()
