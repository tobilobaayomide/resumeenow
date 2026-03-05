#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: npm run assets:optimize -- <input> <output> [maxWidth] [quality]"
  echo "Example: npm run assets:optimize -- src/assets/hero.png src/assets/hero.jpg 1600 72"
  exit 1
fi

if ! command -v sips >/dev/null 2>&1; then
  echo "Error: 'sips' is required for this script (macOS)."
  exit 1
fi

INPUT="$1"
OUTPUT="$2"
MAX_WIDTH="${3:-1600}"
QUALITY="${4:-72}"
OUT_EXT="${OUTPUT##*.}"

if [[ ! -f "$INPUT" ]]; then
  echo "Error: input file not found: $INPUT"
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT")"

TMP_FILE="$(mktemp /tmp/resumeenow-image-optimize.XXXXXX)"
cp "$INPUT" "$TMP_FILE"

sips -Z "$MAX_WIDTH" "$TMP_FILE" >/dev/null

case "${OUT_EXT,,}" in
  jpg|jpeg)
    sips -s format jpeg -s formatOptions "$QUALITY" "$TMP_FILE" --out "$OUTPUT" >/dev/null
    ;;
  png)
    sips -s format png "$TMP_FILE" --out "$OUTPUT" >/dev/null
    ;;
  *)
    echo "Error: unsupported output extension '$OUT_EXT'. Use .jpg/.jpeg or .png."
    rm -f "$TMP_FILE"
    exit 1
    ;;
esac

IN_SIZE=$(wc -c <"$INPUT")
OUT_SIZE=$(wc -c <"$OUTPUT")
IN_KB=$(awk "BEGIN { printf \"%.1f\", $IN_SIZE/1024 }")
OUT_KB=$(awk "BEGIN { printf \"%.1f\", $OUT_SIZE/1024 }")

echo "Optimized image:"
echo "- Input : $INPUT ($IN_KB KB)"
echo "- Output: $OUTPUT ($OUT_KB KB)"

rm -f "$TMP_FILE"
