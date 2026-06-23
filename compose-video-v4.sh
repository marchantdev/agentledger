#!/bin/bash
# Compose AgentLedger demo video v4 — scene-by-scene with audio sync
# Uses ffmpeg with crossfade transitions

set -e
cd /opt/autonomous-ai/hackathons/casper/demo-assets

# Scene durations from ElevenLabs audio (seconds)
# Scene 1: problem — 7.5s (black screen with text)
# Scene 2: landing — 7.0s
# Scene 3: workbench — 19.9s
# Scene 4: receipt — 18.7s
# Scene 5: tamper — 13.8s
# Scene 6: dispute — 13.1s
# Scene 7: close — 6.4s

# First: create title screen (black with white text)
ffmpeg -y -f lavfi -i "color=c=black:s=1920x1080:d=7.5" \
  -vf "drawtext=text='AI agents approve payments.':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=(h-text_h)/2-40:enable='between(t,0.5,7)',drawtext=text='But when something goes wrong...':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=(h-text_h)/2+30:enable='between(t,2.5,7)',drawtext=text='there'\''s no proof.':fontcolor=#3ecead:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2+90:enable='between(t,4.5,7)'" \
  -c:v libx264 -pix_fmt yuv420p -r 30 \
  /tmp/scene1_video.mp4

echo "Scene 1 title done"

# Scene 2-7: static screenshots with duration matching audio
for scene_num in 2 3 4 5 6 7; do
  case $scene_num in
    2) img="v4_02_landing.png"; dur="7.0" ;;
    3) img="v4_04_workbench.png"; dur="19.9" ;;
    4) img="v4_06_proof_drawer.png"; dur="18.7" ;;
    5) img="v4_07_tampered.png"; dur="13.8" ;;
    6) img="v4_08_dispute_intro.png"; dur="13.1" ;;
    7) img="v4_02_landing.png"; dur="6.4" ;;  # Closing on landing
  esac

  ffmpeg -y -loop 1 -t "$dur" -i "$img" \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" \
    -c:v libx264 -pix_fmt yuv420p -r 30 \
    "/tmp/scene${scene_num}_video.mp4"

  echo "Scene $scene_num ($img, ${dur}s) done"
done

# Create file list for concatenation
cat > /tmp/scenes.txt << 'FILELIST'
file '/tmp/scene1_video.mp4'
file '/tmp/scene2_video.mp4'
file '/tmp/scene3_video.mp4'
file '/tmp/scene4_video.mp4'
file '/tmp/scene5_video.mp4'
file '/tmp/scene6_video.mp4'
file '/tmp/scene7_video.mp4'
FILELIST

# Concat all video scenes
ffmpeg -y -f concat -safe 0 -i /tmp/scenes.txt \
  -c:v libx264 -pix_fmt yuv420p -r 30 \
  /tmp/all_scenes.mp4

echo "Scenes concatenated"

# Create audio list for concatenation
cat > /tmp/audio.txt << 'AUDIOLIST'
file 'scene1_problem.mp3'
file 'scene2_solution.mp3'
file 'scene3_workbench.mp3'
file 'scene4_receipt.mp3'
file 'scene5_tamper.mp3'
file 'scene6_dispute.mp3'
file 'scene7_close.mp3'
AUDIOLIST

# Concat all audio
ffmpeg -y -f concat -safe 0 -i /tmp/audio.txt \
  -c:a aac -b:a 192k \
  /tmp/all_audio.m4a

echo "Audio concatenated"

# Final compose: video + audio
OUTPUT="/opt/autonomous-ai/hackathons/casper/demo-assets/agentledger-demo-v4.mp4"
ffmpeg -y -i /tmp/all_scenes.mp4 -i /tmp/all_audio.m4a \
  -c:v libx264 -crf 23 -preset medium \
  -c:a aac -b:a 192k \
  -shortest \
  "$OUTPUT"

echo ""
echo "=== DONE ==="
ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUTPUT"
echo "seconds"
ls -lh "$OUTPUT"
