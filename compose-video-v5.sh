#!/bin/bash
# AgentLedger Demo Video v5 — Live Writable Flow
# Composes screenshots + voiceover audio into final demo video
#
# Prerequisites:
# - v5_* screenshots in demo-assets/ (from capture-v5-live.js)
# - scene*_*.mp3 audio files in demo-assets/ (from ElevenLabs)
# - ffmpeg installed
#
# Usage: bash compose-video-v5.sh

set -euo pipefail
cd "$(dirname "$0")"
ASSETS="demo-assets"
OUT="${ASSETS}/agentledger_demo_v5.mp4"

# Check prerequisites
for f in scene1_problem scene2_solution scene3_workbench scene4_receipt scene5_tamper scene6_dispute scene7_close; do
  if [ ! -f "${ASSETS}/${f}.mp3" ]; then
    echo "ERROR: Missing ${ASSETS}/${f}.mp3"
    exit 1
  fi
done

echo "=== AgentLedger Demo v5 Composition ==="
echo ""

# Get audio durations
dur1=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${ASSETS}/scene1_problem.mp3")
dur2=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${ASSETS}/scene2_solution.mp3")
dur3=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${ASSETS}/scene3_workbench.mp3")
dur4=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${ASSETS}/scene4_receipt.mp3")
dur5=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${ASSETS}/scene5_tamper.mp3")
dur6=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${ASSETS}/scene6_dispute.mp3")
dur7=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${ASSETS}/scene7_close.mp3")

echo "Scene durations: ${dur1}s / ${dur2}s / ${dur3}s / ${dur4}s / ${dur5}s / ${dur6}s / ${dur7}s"

# === Scene 1: Problem (black screen with text overlay) ===
echo "[1/7] Scene 1: Problem title card..."
ffmpeg -y -loglevel error \
  -f lavfi -i "color=c=0x111111:s=1920x1080:d=${dur1}" \
  -i "${ASSETS}/scene1_problem.mp3" \
  -vf "drawtext=text='AI agents approve payments.':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2-40:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='between(t,0.5,${dur1})',drawtext=text='Execute trades. But when something goes wrong —':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2+20:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:enable='between(t,1.5,${dur1})',drawtext=text='there is no proof.':fontcolor=#34d399:fontsize=56:x=(w-text_w)/2:y=(h-text_h)/2+90:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:enable='between(t,3,${dur1})'" \
  -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest \
  "${ASSETS}/seg1_v5.mp4"

# === Scene 2: Landing page ===
echo "[2/7] Scene 2: Landing page..."
# Use v5 screenshot if available, fallback to v4
LANDING="${ASSETS}/v5_02_landing.png"
[ ! -f "$LANDING" ] && LANDING="${ASSETS}/v4_02_landing.png"
ffmpeg -y -loglevel error \
  -loop 1 -t "${dur2}" -i "${LANDING}" \
  -i "${ASSETS}/scene2_solution.mp3" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111111" \
  -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest \
  "${ASSETS}/seg2_v5.mp4"

# === Scene 3: Workbench (LIVE RECORDING — multiple shots) ===
echo "[3/7] Scene 3: Workbench live recording..."
# Split the 19.9s audio into sub-segments for the multi-shot scene
# 3a: Cards (0-3s) → 3b: Evaluation (3-8s) → 3c: Decision (8-12s) → 3d: Recording+Confirmed (12-20s)
CARDS="${ASSETS}/v5_03a_workbench_cards.png"
EVAL="${ASSETS}/v5_03b_trace_evaluating.png"
DECISION="${ASSETS}/v5_03d_decision.png"
CONFIRMED="${ASSETS}/v5_03f_confirmed.png"
# Fallbacks
[ ! -f "$CARDS" ] && CARDS="${ASSETS}/v4_04_workbench.png"
[ ! -f "$EVAL" ] && EVAL="${ASSETS}/v4_04_workbench.png"
[ ! -f "$DECISION" ] && DECISION="${ASSETS}/v4_04_workbench.png"
[ ! -f "$CONFIRMED" ] && CONFIRMED="${ASSETS}/v4_04_workbench.png"

ffmpeg -y -loglevel error \
  -loop 1 -t 4 -i "${CARDS}" \
  -loop 1 -t 5 -i "${EVAL}" \
  -loop 1 -t 4 -i "${DECISION}" \
  -loop 1 -t 7.9 -i "${CONFIRMED}" \
  -i "${ASSETS}/scene3_workbench.mp3" \
  -filter_complex "\
    [0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111111[v0]; \
    [1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111111[v1]; \
    [2:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111111[v2]; \
    [3:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111111[v3]; \
    [v0][v1]xfade=transition=fade:duration=0.3:offset=3.7[x01]; \
    [x01][v2]xfade=transition=fade:duration=0.3:offset=8.7[x02]; \
    [x02][v3]xfade=transition=fade:duration=0.3:offset=12.7[outv]" \
  -map "[outv]" -map 4:a \
  -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest \
  "${ASSETS}/seg3_v5.mp4"

# === Scene 4: Receipt with Casper Proof ===
echo "[4/7] Scene 4: Receipt + proof drawer..."
# Split: receipt (0-10s) → proof drawer (10-18.7s)
RECEIPT="${ASSETS}/v5_04_receipt_verified.png"
PROOF="${ASSETS}/v5_04b_proof_drawer.png"
[ ! -f "$RECEIPT" ] && RECEIPT="${ASSETS}/v4_05_receipt.png"
[ ! -f "$PROOF" ] && PROOF="${ASSETS}/v4_06_proof_drawer.png"

ffmpeg -y -loglevel error \
  -loop 1 -t 10 -i "${RECEIPT}" \
  -loop 1 -t 9 -i "${PROOF}" \
  -i "${ASSETS}/scene4_receipt.mp3" \
  -filter_complex "\
    [0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111111[v0]; \
    [1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111111[v1]; \
    [v0][v1]xfade=transition=fade:duration=0.3:offset=9.7[outv]" \
  -map "[outv]" -map 2:a \
  -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest \
  "${ASSETS}/seg4_v5.mp4"

# === Scene 5: Tamper Detection ===
echo "[5/7] Scene 5: Tamper detection..."
TAMPER="${ASSETS}/v5_05_tampered.png"
[ ! -f "$TAMPER" ] && TAMPER="${ASSETS}/v4_07_tampered.png"

ffmpeg -y -loglevel error \
  -loop 1 -t "${dur5}" -i "${TAMPER}" \
  -i "${ASSETS}/scene5_tamper.mp3" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111111" \
  -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest \
  "${ASSETS}/seg5_v5.mp4"

# === Scene 6: Dispute Case File ===
echo "[6/7] Scene 6: Dispute case file..."
DISPUTE_INTRO="${ASSETS}/v5_06a_dispute_intro.png"
DISPUTE_VERDICT="${ASSETS}/v5_06b_dispute_verdict.png"
[ ! -f "$DISPUTE_INTRO" ] && DISPUTE_INTRO="${ASSETS}/v4_08_dispute_intro.png"
[ ! -f "$DISPUTE_VERDICT" ] && DISPUTE_VERDICT="${ASSETS}/v4_09_dispute_verdict.png"

ffmpeg -y -loglevel error \
  -loop 1 -t 7 -i "${DISPUTE_INTRO}" \
  -loop 1 -t 7 -i "${DISPUTE_VERDICT}" \
  -i "${ASSETS}/scene6_dispute.mp3" \
  -filter_complex "\
    [0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111111[v0]; \
    [1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111111[v1]; \
    [v0][v1]xfade=transition=fade:duration=0.3:offset=6.7[outv]" \
  -map "[outv]" -map 2:a \
  -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest \
  "${ASSETS}/seg6_v5.mp4"

# === Scene 7: Close ===
echo "[7/7] Scene 7: Close..."
CLOSE="${ASSETS}/v5_02_landing.png"
[ ! -f "$CLOSE" ] && CLOSE="${ASSETS}/v4_02_landing.png"

ffmpeg -y -loglevel error \
  -loop 1 -t "${dur7}" -i "${CLOSE}" \
  -i "${ASSETS}/scene7_close.mp3" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x111111,drawtext=text='Built on Casper':fontcolor=#34d399:fontsize=36:x=(w-text_w)/2:y=h-80:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" \
  -c:v libx264 -preset fast -pix_fmt yuv420p -c:a aac -shortest \
  "${ASSETS}/seg7_v5.mp4"

# === Concatenate all segments ===
echo ""
echo "Concatenating segments..."
cat > "${ASSETS}/concat_v5.txt" << CONCAT
file 'seg1_v5.mp4'
file 'seg2_v5.mp4'
file 'seg3_v5.mp4'
file 'seg4_v5.mp4'
file 'seg5_v5.mp4'
file 'seg6_v5.mp4'
file 'seg7_v5.mp4'
CONCAT

ffmpeg -y -loglevel error \
  -f concat -safe 0 -i "${ASSETS}/concat_v5.txt" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  "${OUT}"

# Final check
DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${OUT}")
SIZE=$(du -h "${OUT}" | cut -f1)
echo ""
echo "=== Done ==="
echo "Output: ${OUT}"
echo "Duration: ${DURATION}s"
echo "Size: ${SIZE}"
echo ""
echo "Verify: ffplay ${OUT}"
