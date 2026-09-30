#!/bin/zsh
# Visual check: screenshots of every stop on the frog's path, desktop (1600x900) and phone (500x1082).
# Usage: pnpm build && scripts/visual-check.sh [out-dir] [stops...]
# Uses the built site in ./out and the page's ?shot=N test mode (snaps the frog to stop N).
set -e
cd "${0:A:h}/.."
OUT=${1:-/tmp/janys-visual}; shift 2>/dev/null || true
if (( $# )); then STOPS=("$@"); else STOPS=(0 1 3 4 5 6 7 8 9 10 11); fi
mkdir -p "$OUT"
(cd out && python3 -m http.server 8799 >/dev/null 2>&1 &) ; sleep 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for s in $STOPS; do
  "$CH" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=1600,900 --virtual-time-budget=12000 --screenshot="$OUT/desktop-$s.png" "http://localhost:8799/?shot=$s" >/dev/null 2>&1
  "$CH" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --window-size=500,1082 --virtual-time-budget=12000 --screenshot="$OUT/mobile-$s.png" "http://localhost:8799/?shot=$s" >/dev/null 2>&1
  echo "stop $s ✓"
done
pkill -f "http.server 8799" || true
echo "screenshots in $OUT"
