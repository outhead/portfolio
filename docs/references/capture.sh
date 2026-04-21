#!/bin/bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE="/Users/egor/cloud project/portfolio/portfolio-next/docs/references"

# Full page screenshots (tall window to capture entire page without scrolling)
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,3400 --virtual-time-budget=8000 \
  --screenshot="$BASE/colorblind/full-page.png" \
  "https://www.colorblind.cc/" 2>&1 | tail -2

"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,6000 --virtual-time-budget=8000 \
  --screenshot="$BASE/stokt/full-page.png" \
  "https://wearestokt.com/" 2>&1 | tail -2

echo ---
ls -la "$BASE/colorblind" "$BASE/stokt"
