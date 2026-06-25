#!/usr/bin/env python3
"""Create a clean VERIFIED card image for the v8 video ending."""
from PIL import Image, ImageDraw, ImageFont
import os

WIDTH = 1920
HEIGHT = 1080
OUT_DIR = "/opt/autonomous-ai/hackathons/casper/demo-assets"

# Colors matching the app's dark theme
BG_COLOR = (17, 24, 39)         # Dark navy (Tailwind gray-900)
CARD_BG = (31, 41, 55)          # Slightly lighter (gray-800)
GREEN = (16, 185, 129)          # Emerald-500 (verified color)
GREEN_DIM = (6, 78, 59)         # Emerald-900 (badge bg)
WHITE = (255, 255, 255)
GRAY = (156, 163, 175)          # Gray-400
TEAL = (45, 212, 191)           # Teal-400 (accent)

img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
draw = ImageDraw.Draw(img)

# Try to use a good font, fall back to default
try:
    title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
    label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
    detail_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
    mono_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 22)
except:
    title_font = ImageFont.load_default()
    label_font = title_font
    detail_font = title_font
    small_font = title_font
    mono_font = title_font

# Central card
card_w = 900
card_h = 500
card_x = (WIDTH - card_w) // 2
card_y = (HEIGHT - card_h) // 2

# Card background with rounded corners (approximate with rectangle)
draw.rounded_rectangle(
    [(card_x, card_y), (card_x + card_w, card_y + card_h)],
    radius=20, fill=CARD_BG, outline=(55, 65, 81), width=2
)

# Green checkmark circle
circle_cx = WIDTH // 2
circle_cy = card_y + 80
circle_r = 40
draw.ellipse(
    [(circle_cx - circle_r, circle_cy - circle_r),
     (circle_cx + circle_r, circle_cy + circle_r)],
    fill=GREEN_DIM, outline=GREEN, width=3
)
# Checkmark (simple lines)
check_pts = [
    (circle_cx - 18, circle_cy + 2),
    (circle_cx - 4, circle_cy + 16),
    (circle_cx + 22, circle_cy - 14),
]
draw.line(check_pts, fill=GREEN, width=5, joint="curve")

# "VERIFIED" title
draw.text((WIDTH // 2, circle_cy + 60), "VERIFIED", fill=GREEN, font=title_font, anchor="mt")

# "via Casper RPC"
draw.text((WIDTH // 2, circle_cy + 130), "via Casper RPC", fill=GRAY, font=label_font, anchor="mt")

# Separator line
sep_y = circle_cy + 175
draw.line([(card_x + 60, sep_y), (card_x + card_w - 60, sep_y)], fill=(55, 65, 81), width=1)

# Receipt details
details_y = sep_y + 25
details = [
    ("Receipt", "#119"),
    ("Vendor", "Northwind Cloud"),
    ("Amount", "8,500 USDT"),
    ("Block", "8299405"),
    ("TX", "c737ef8d...09846682"),
]

for i, (label, value) in enumerate(details):
    y = details_y + i * 38
    draw.text((card_x + 100, y), label, fill=GRAY, font=detail_font)
    draw.text((card_x + card_w - 100, y), value, fill=WHITE, font=detail_font, anchor="ra")

# Bottom: "AgentLedger" branding
draw.text((WIDTH // 2, card_y + card_h + 40), "AgentLedger", fill=TEAL, font=label_font, anchor="mt")
draw.text((WIDTH // 2, card_y + card_h + 80),
          "Verifiable receipts for the agent economy", fill=GRAY, font=small_font, anchor="mt")

# Save
out_path = os.path.join(OUT_DIR, "v9_verified_card.png")
img.save(out_path, "PNG")
print(f"Created: {out_path} ({os.path.getsize(out_path)/1024:.0f}KB)")
