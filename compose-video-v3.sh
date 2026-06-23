#!/bin/bash
# Compose AgentLedger demo video v3 — receipt-loop flow
# Screenshots + voiceover segments → single MP4

set -e

DIR="/opt/autonomous-ai/hackathons/casper/demo-assets"
OUT="$DIR/agentledger_demo_v3.mp4"

# Create problem card (black bg + white text)
ffmpeg -y -f lavfi -i "color=c=0x0a0e14:s=1920x1080:d=1" -vframes 1 "$DIR/01_problem_card.png" 2>/dev/null
ffmpeg -y -i "$DIR/01_problem_card.png" \
  -vf "drawtext=text='AI agents handle millions in decisions.':fontcolor=white:fontsize=52:x=(w-text_w)/2:y=h/2-60:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,drawtext=text='Nobody can prove what they decided.':fontcolor=0xcccccc:fontsize=40:x=(w-text_w)/2:y=h/2+20:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
  "$DIR/01_problem.png" 2>/dev/null

echo "Creating title card..."
ffmpeg -y -f lavfi -i "color=c=0x0a0e14:s=1920x1080:d=1" -vframes 1 "$DIR/00_title_base.png" 2>/dev/null
ffmpeg -y -i "$DIR/00_title_base.png" \
  -vf "drawtext=text='AgentLedger':fontcolor=0x2dd4bf:fontsize=72:x=(w-text_w)/2:y=h/2-80:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,drawtext=text='Verifiable receipts for the agent economy':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=h/2+10:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,drawtext=text='Built on Casper':fontcolor=0x888888:fontsize=28:x=(w-text_w)/2:y=h/2+70:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
  "$DIR/00_title.png" 2>/dev/null

# Get durations of each segment
get_dur() {
  ffprobe -v quiet -print_format json -show_format "$1" | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['format']['duration'])"
}

D1=$(get_dur "$DIR/01_problem.mp3")
D2=$(get_dur "$DIR/02_solution.mp3")
D3=$(get_dur "$DIR/03_dashboard.mp3")
D4=$(get_dur "$DIR/04_receipt.mp3")
D5=$(get_dur "$DIR/05_tamper.mp3")
D6=$(get_dur "$DIR/06_workbench.mp3")
D7=$(get_dur "$DIR/07_close.mp3")

echo "Segment durations: $D1 $D2 $D3 $D4 $D5 $D6 $D7"

# Create video segments: each is a still image looped for the audio duration + 0.5s padding
make_seg() {
  local img=$1 audio=$2 dur=$3 out=$4
  ffmpeg -y -loop 1 -i "$img" -i "$audio" \
    -c:v libx264 -tune stillimage -pix_fmt yuv420p \
    -c:a aac -b:a 128k \
    -t "$dur" -shortest \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0a0e14" \
    "$out" 2>/dev/null
  echo "  ✓ $(basename $out) (${dur}s)"
}

echo "Building segments..."
make_seg "$DIR/01_problem.png"         "$DIR/01_problem.mp3"   "$D1" "$DIR/seg1.mp4"
make_seg "$DIR/02_landing.png"         "$DIR/02_solution.mp3"  "$D2" "$DIR/seg2.mp4"
make_seg "$DIR/03_dashboard.png"       "$DIR/03_dashboard.mp3" "$D3" "$DIR/seg3.mp4"
make_seg "$DIR/04_receipt.png"         "$DIR/04_receipt.mp3"   "$D4" "$DIR/seg4.mp4"
make_seg "$DIR/05_receipt_tampered.png" "$DIR/05_tamper.mp3"   "$D5" "$DIR/seg5.mp4"
make_seg "$DIR/06_workbench.png"       "$DIR/06_workbench.mp3" "$D6" "$DIR/seg6.mp4"
make_seg "$DIR/09_close.png"           "$DIR/07_close.mp3"    "$D7" "$DIR/seg7.mp4"

# Concatenate all segments
echo "Concatenating..."
cat > "$DIR/concat_final.txt" << 'EOF'
file 'seg1.mp4'
file 'seg2.mp4'
file 'seg3.mp4'
file 'seg4.mp4'
file 'seg5.mp4'
file 'seg6.mp4'
file 'seg7.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$DIR/concat_final.txt" \
  -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  "$OUT" 2>/dev/null

# Get final duration
FINAL_DUR=$(ffprobe -v quiet -print_format json -show_format "$OUT" | python3 -c "import sys,json; print(f'{float(json.loads(sys.stdin.read())[\"format\"][\"duration\"]):.1f}')")
FINAL_SIZE=$(du -h "$OUT" | cut -f1)

echo ""
echo "=== DONE ==="
echo "Output: $OUT"
echo "Duration: ${FINAL_DUR}s"
echo "Size: $FINAL_SIZE"

if python3 -c "import sys; sys.exit(0 if float('$FINAL_DUR') <= 90 else 1)"; then
  echo "✓ Within 90s target"
else
  echo "⚠ OVER 90s target!"
fi
