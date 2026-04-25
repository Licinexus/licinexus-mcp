#!/usr/bin/env bash
# Generates a 60-second launch video for LinkedIn / Twitter from existing assets.
#
# Composition:
#   0:00–0:05  Title card  (logo + tagline)        — scripts/launch-cards/title.png
#   0:05–0:50  Demo        (CLI demo, sped up)     — .github/assets/demo.gif
#   0:50–1:00  CTA         (install command + URL) — scripts/launch-cards/cta.png
#
# Output: .github/assets/launch-video.mp4 (1280×720, 30 fps, H.264)
#
# Re-render cards (after editing HTML):
#   bash scripts/generate-launch-video.sh --rebuild-cards
#
# Re-run video only:
#   bash scripts/generate-launch-video.sh

set -euo pipefail

cd "$(dirname "$0")/.."

W=1280
H=720
TITLE_DUR=5
DEMO_DUR=45
CTA_DUR=10

DEMO=".github/assets/demo.gif"
CARDS_DIR="scripts/launch-cards"
TITLE_PNG="$CARDS_DIR/title.png"
CTA_PNG="$CARDS_DIR/cta.png"
OUT=".github/assets/launch-video.mp4"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# ── Optional: re-render cards ────────────────────────────────────────────────
if [[ "${1:-}" == "--rebuild-cards" ]] || [[ ! -f "$TITLE_PNG" ]] || [[ ! -f "$CTA_PNG" ]]; then
  echo "▶ Rendering cards from HTML…"
  pushd "$CARDS_DIR" > /dev/null
  for card in title cta; do
    "$CHROME" --headless --disable-gpu --no-sandbox \
      --window-size=${W},${H} --hide-scrollbars \
      --screenshot="$card.png" "file://$(pwd)/$card.html" 2>/dev/null
  done
  popd > /dev/null
  echo "  cards rendered."
fi

[[ -f "$DEMO" ]]      || { echo "Missing $DEMO" >&2; exit 1; }
[[ -f "$TITLE_PNG" ]] || { echo "Missing $TITLE_PNG" >&2; exit 1; }
[[ -f "$CTA_PNG" ]]   || { echo "Missing $CTA_PNG" >&2; exit 1; }

TMP="$(mktemp -d)"
trap "rm -rf '$TMP'" EXIT

echo "▶ Building title segment (${TITLE_DUR}s)…"
ffmpeg -hide_banner -loglevel error -y \
  -loop 1 -framerate 30 -i "$TITLE_PNG" \
  -t $TITLE_DUR -r 30 -pix_fmt yuv420p \
  -c:v libx264 -preset medium -crf 20 \
  -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=#0d0d1a" \
  "$TMP/title.mp4"

echo "▶ Building demo segment (${DEMO_DUR}s, sped up)…"
ffmpeg -hide_banner -loglevel error -y \
  -i "$DEMO" \
  -filter_complex "[0:v]setpts=0.78*PTS,scale=${W}:${H}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=#0d0d1a,fps=30[v]" \
  -map "[v]" -t $DEMO_DUR \
  -pix_fmt yuv420p -c:v libx264 -preset medium -crf 20 \
  "$TMP/demo.mp4"

echo "▶ Building CTA segment (${CTA_DUR}s)…"
ffmpeg -hide_banner -loglevel error -y \
  -loop 1 -framerate 30 -i "$CTA_PNG" \
  -t $CTA_DUR -r 30 -pix_fmt yuv420p \
  -c:v libx264 -preset medium -crf 20 \
  -vf "scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=#0d0d1a" \
  "$TMP/cta.mp4"

echo "▶ Concatenating…"
cat > "$TMP/list.txt" <<EOF
file '$TMP/title.mp4'
file '$TMP/demo.mp4'
file '$TMP/cta.mp4'
EOF

ffmpeg -hide_banner -loglevel error -y \
  -f concat -safe 0 -i "$TMP/list.txt" \
  -c copy \
  "$OUT"

echo ""
echo "✓ Done: $OUT"
ffmpeg -hide_banner -i "$OUT" 2>&1 | grep -E "(Duration|Stream)" | head -3
ls -lh "$OUT"
