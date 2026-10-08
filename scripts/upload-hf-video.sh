#!/usr/bin/env bash
# Upload a HyperFrames rendered MP4 to the backend R2 store.
# Usage: ./scripts/upload-hf-video.sh <path-to-mp4> [base-url]
#
# Example:
#   ./scripts/upload-hf-video.sh \
#     /home/voltrix/videos/general-relativity-explained/renders/general-relativity.mp4 \
#     https://voltrix.stream

set -euo pipefail

MP4="${1:-}"
BASE="${2:-https://voltrix.stream}"

if [[ -z "$MP4" ]]; then
  echo "Usage: $0 <path-to-mp4> [base-url]" >&2
  exit 1
fi

if [[ ! -f "$MP4" ]]; then
  echo "File not found: $MP4" >&2
  exit 1
fi

NAME="$(basename "$MP4")"
URL="$BASE/api/hf-videos/upload"

echo "Uploading $NAME → $URL"
curl -s -X POST "$URL" \
  -F "name=$NAME" \
  -F "file=@$MP4;type=video/mp4" | jq .

echo ""
echo "Playback URL: $BASE/api/hf-videos/$NAME"
