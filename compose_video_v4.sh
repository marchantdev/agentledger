#!/bin/bash
# AgentLedger Demo Video v4 — ffmpeg composition
# 7 scenes, ~87s total, 1920x1080, clean cut transitions
set -euo pipefail
cd "$(dirname "$0")"

ASSETS="demo-assets"
OUT="demo-assets/agentledger_demo_v4.mp4"

echo "=== Step 1: Generate title card (Scene 1 — black + white text) ==="
ffmpeg -y -f lavfi -i "color=c=black:s=1920x1080:d=8" \
  -vf "drawtext=text='AI agents approve payments.':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=(h/2)-60:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='between(t,0.5,7)',drawtext=text='Execute trades.':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=(h/2):fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='between(t,1.5,7)',drawtext=text='But when something goes wrong':fontsize=42:fontcolor=white:x=(w-text_w)/2:y=(h/2)+60:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='between(t,2.5,7)',drawtext=text='there'\''s no proof.':fontsize=52:fontcolor=#FF4444:x=(w-text_w)/2:y=(h/2)+140:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:enable='between(t,4,7)'" \
  -c:v libx264 -pix_fmt yuv420p -t 8 "$ASSETS/scene1_video.mp4"

echo "=== Step 2: Create per-scene video segments with audio ==="

# Scene 1: Title card + audio
ffmpeg -y -i "$ASSETS/scene1_video.mp4" -i "$ASSETS/scene1_problem.mp3" \
  -c:v libx264 -c:a aac -shortest -pix_fmt yuv420p "$ASSETS/seg_s1.mp4"

# Scene 2: Landing page
ffmpeg -y -loop 1 -i "$ASSETS/v4_02_landing.png" -i "$ASSETS/scene2_solution.mp3" \
  -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest -vf "scale=1920:1080" "$ASSETS/seg_s2.mp4"

# Scene 3: Workbench (using workbench screenshot — fallback for non-live demo)
ffmpeg -y -loop 1 -i "$ASSETS/v4_04_workbench.png" -i "$ASSETS/scene3_workbench.mp3" \
  -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest -vf "scale=1920:1080" "$ASSETS/seg_s3.mp4"

# Scene 4: Receipt (split: receipt 10s, proof drawer 9s)
ffmpeg -y -loop 1 -t 10 -i "$ASSETS/v4_05_receipt.png" \
  -loop 1 -t 9 -i "$ASSETS/v4_06_proof_drawer.png" \
  -i "$ASSETS/scene4_receipt.mp3" \
  -filter_complex "[0:v]scale=1920:1080,setsar=1[v0];[1:v]scale=1920:1080,setsar=1[v1];[v0][v1]concat=n=2:v=1:a=0[outv]" \
  -map "[outv]" -map 2:a -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest "$ASSETS/seg_s4.mp4"

# Scene 5: Tamper detection (split: normal receipt 5s, tampered 9s)
ffmpeg -y -loop 1 -t 5 -i "$ASSETS/v4_05_receipt.png" \
  -loop 1 -t 9 -i "$ASSETS/v4_07_tampered.png" \
  -i "$ASSETS/scene5_tamper.mp3" \
  -filter_complex "[0:v]scale=1920:1080,setsar=1[v0];[1:v]scale=1920:1080,setsar=1[v1];[v0][v1]concat=n=2:v=1:a=0[outv]" \
  -map "[outv]" -map 2:a -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest "$ASSETS/seg_s5.mp4"

# Scene 6: Dispute (split: intro 7s, verdict 6s)
ffmpeg -y -loop 1 -t 7 -i "$ASSETS/v4_08_dispute_intro.png" \
  -loop 1 -t 7 -i "$ASSETS/v4_09_dispute_verdict.png" \
  -i "$ASSETS/scene6_dispute.mp3" \
  -filter_complex "[0:v]scale=1920:1080,setsar=1[v0];[1:v]scale=1920:1080,setsar=1[v1];[v0][v1]concat=n=2:v=1:a=0[outv]" \
  -map "[outv]" -map 2:a -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest "$ASSETS/seg_s6.mp4"

# Scene 7: Close (reuse landing)
ffmpeg -y -loop 1 -i "$ASSETS/v4_02_landing.png" -i "$ASSETS/scene7_close.mp3" \
  -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest -vf "scale=1920:1080" "$ASSETS/seg_s7.mp4"

echo "=== Step 3: Concat all segments ==="

# Create concat file
cat > "$ASSETS/concat_v4.txt" << 'CONCAT'
file 'seg_s1.mp4'
file 'seg_s2.mp4'
file 'seg_s3.mp4'
file 'seg_s4.mp4'
file 'seg_s5.mp4'
file 'seg_s6.mp4'
file 'seg_s7.mp4'
CONCAT

# Clean concat with professional encoding
ffmpeg -y -f concat -safe 0 -i "$ASSETS/concat_v4.txt" \
  -c:v libx264 -c:a aac -pix_fmt yuv420p -movflags +faststart \
  -b:v 4M -maxrate 6M -bufsize 8M \
  "$OUT"

echo "=== Done ==="
dur=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUT" 2>/dev/null)
size=$(du -h "$OUT" | cut -f1)
echo "Output: $OUT"
echo "Duration: ${dur}s"
echo "Size: $size"
