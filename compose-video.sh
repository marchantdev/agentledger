#!/bin/bash
# Compose AgentLedger demo video from screenshots + voiceover
set -e

cd /opt/autonomous-ai/hackathons/casper
SDIR=screenshots
VDIR=video
OUT=video/agentledger-demo.mp4

# Step 1: Create problem title card (black bg, white text)
echo "Creating title card..."
ffmpeg -y -f lavfi -i "color=c=0x0a0e14:s=1920x1080:d=1" -vframes 1 \
  -vf "drawtext=text='AI agents handle millions in transactions.':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h/2)-50:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,drawtext=text='Nobody can prove what they decided.':fontsize=48:fontcolor=0x2dd4bf:x=(w-text_w)/2:y=(h/2)+30:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
  ${VDIR}/title_card.png 2>/dev/null

# Step 2: Create closing card
echo "Creating closing card..."
ffmpeg -y -f lavfi -i "color=c=0x0a0e14:s=1920x1080:d=1" -vframes 1 \
  -vf "drawtext=text='AgentLedger':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h/2)-80:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,drawtext=text='Verifiable receipts for the agent economy':fontsize=36:fontcolor=0x2dd4bf:x=(w-text_w)/2:y=(h/2):fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,drawtext=text='Built on Casper | Open Source | github.com/marchantdev/agentledger':fontsize=24:fontcolor=0x888888:x=(w-text_w)/2:y=(h/2)+60:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
  ${VDIR}/closing_card.png 2>/dev/null

# Step 3: Concatenate all audio segments
echo "Concatenating audio..."
ffmpeg -y \
  -i ${VDIR}/01_problem.mp3 \
  -i ${VDIR}/02_solution.mp3 \
  -i ${VDIR}/03_dashboard.mp3 \
  -i ${VDIR}/04_verify_pass.mp3 \
  -i ${VDIR}/05_tamper_detect.mp3 \
  -i ${VDIR}/06_explorer.mp3 \
  -i ${VDIR}/07_close.mp3 \
  -filter_complex "[0:a][1:a][2:a][3:a][4:a][5:a][6:a]concat=n=7:v=0:a=1[out]" \
  -map "[out]" ${VDIR}/voiceover_full.mp3 2>/dev/null

TOTAL_DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${VDIR}/voiceover_full.mp3)
echo "Total audio duration: ${TOTAL_DUR}s"

# Get individual segment durations
D1=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${VDIR}/01_problem.mp3)
D2=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${VDIR}/02_solution.mp3)
D3=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${VDIR}/03_dashboard.mp3)
D4=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${VDIR}/04_verify_pass.mp3)
D5=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${VDIR}/05_tamper_detect.mp3)
D6=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${VDIR}/06_explorer.mp3)
D7=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${VDIR}/07_close.mp3)

echo "Segment durations: $D1, $D2, $D3, $D4, $D5, $D6, $D7"

# Step 4: Create video segments from images, each matching audio duration
# Scene 1: Problem title card
echo "Creating scene 1 (problem)..."
ffmpeg -y -loop 1 -i ${VDIR}/title_card.png -t ${D1} -c:v libx264 -pix_fmt yuv420p -r 30 ${VDIR}/s1.mp4 2>/dev/null

# Scene 2: Landing page (solution)
echo "Creating scene 2 (solution)..."
ffmpeg -y -loop 1 -i ${SDIR}/02_landing.png -t ${D2} -vf "scale=1920:1080" -c:v libx264 -pix_fmt yuv420p -r 30 ${VDIR}/s2.mp4 2>/dev/null

# Scene 3: Dashboard
echo "Creating scene 3 (dashboard)..."
ffmpeg -y -loop 1 -i ${SDIR}/03_dashboard.png -t ${D3} -vf "scale=1920:1080" -c:v libx264 -pix_fmt yuv420p -r 30 ${VDIR}/s3.mp4 2>/dev/null

# Scene 4: Verify page start -> pass
echo "Creating scene 4 (verify pass)..."
ffmpeg -y -loop 1 -i ${SDIR}/05_verify_start.png -t ${D4} -vf "scale=1920:1080" -c:v libx264 -pix_fmt yuv420p -r 30 ${VDIR}/s4.mp4 2>/dev/null

# Scene 5: Tamper detection (split: show modified, then TAMPERED result)
HALF5=$(python3 -c "print(float('${D5}')/2)")
echo "Creating scene 5 (tamper detect)..."
# First half: show modified badge
ffmpeg -y -loop 1 -i ${SDIR}/06_verify_pass.png -t ${HALF5} -vf "scale=1920:1080" -c:v libx264 -pix_fmt yuv420p -r 30 ${VDIR}/s5a.mp4 2>/dev/null
# Second half: show TAMPERED result
ffmpeg -y -loop 1 -i ${SDIR}/08_verify_fail.png -t ${HALF5} -vf "scale=1920:1080" -c:v libx264 -pix_fmt yuv420p -r 30 ${VDIR}/s5b.mp4 2>/dev/null

# Scene 6: Explorer (use landing page scrolled down as proxy since we don't have real explorer screenshot)
echo "Creating scene 6 (explorer proof)..."
ffmpeg -y -loop 1 -i ${SDIR}/09_explore.png -t ${D6} -vf "scale=1920:1080" -c:v libx264 -pix_fmt yuv420p -r 30 ${VDIR}/s6.mp4 2>/dev/null

# Scene 7: Closing card
echo "Creating scene 7 (close)..."
ffmpeg -y -loop 1 -i ${VDIR}/closing_card.png -t ${D7} -vf "scale=1920:1080" -c:v libx264 -pix_fmt yuv420p -r 30 ${VDIR}/s7.mp4 2>/dev/null

# Step 5: Concatenate all video segments
echo "Concatenating video segments..."
cat > ${VDIR}/concat.txt << 'EOF'
file 's1.mp4'
file 's2.mp4'
file 's3.mp4'
file 's4.mp4'
file 's5a.mp4'
file 's5b.mp4'
file 's6.mp4'
file 's7.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i ${VDIR}/concat.txt -c copy ${VDIR}/video_only.mp4 2>/dev/null

# Step 6: Merge video + audio
echo "Merging video + audio..."
ffmpeg -y -i ${VDIR}/video_only.mp4 -i ${VDIR}/voiceover_full.mp3 \
  -c:v copy -c:a aac -b:a 128k -shortest \
  ${OUT} 2>/dev/null

FINAL_DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${OUT})
FINAL_SIZE=$(du -h ${OUT} | awk '{print $1}')
echo ""
echo "=== DONE ==="
echo "Output: ${OUT}"
echo "Duration: ${FINAL_DUR}s"
echo "Size: ${FINAL_SIZE}"
