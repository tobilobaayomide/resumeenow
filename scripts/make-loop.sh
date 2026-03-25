#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: npm run loop:make -- <input.mp4> <output.mp4> [start=00:00:00] [duration=6]"
  echo "Example: npm run loop:make -- ~/Desktop/raw.mp4 public/loops/feature-upload.mp4 00:00:02 6"
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is not installed. Install with: brew install ffmpeg"
  exit 1
fi

INPUT="$1"
OUTPUT="$2"
START="${3:-00:00:00}"
DURATION="${4:-6}"

mkdir -p "$(dirname "$OUTPUT")"

ffmpeg -y \
  -ss "$START" \
  -t "$DURATION" \
  -i "$INPUT" \
  -vf "fps=24,scale=1920:-2:flags=lanczos" \
  -an \
  -c:v libx264 \
  -pix_fmt yuv420p \
  -profile:v high \
  -level 4.0 \
  -crf 20 \
  -preset medium \
  -movflags +faststart \
  "$OUTPUT"

echo "Created loop: $OUTPUT"
