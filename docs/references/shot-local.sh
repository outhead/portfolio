#!/bin/bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE="/Users/egor/cloud project/portfolio/portfolio-next/docs/references"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,4800 --virtual-time-budget=10000 \
  --screenshot="$BASE/local-home.png" \
  "http://localhost:3000/" 2>&1 | tail -3
ls -la "$BASE/local-home.png"
