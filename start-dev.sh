#!/bin/bash
cd "/Users/egor/cloud project/portfolio/portfolio-next"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
nohup npm run dev > /tmp/next-dev.log 2>&1 &
echo $! > /tmp/next-dev.pid
echo "started, pid=$(cat /tmp/next-dev.pid)"
