#!/bin/bash
export PATH="/home/jmullaney/.nvm/versions/node/v24.9.0/bin:$PATH"
cd /home/jmullaney/repos/naps
LOGFILE="logs/odds-$(date +%Y%m%d-%H%M%S).log"
npx tsx scripts/scrape-odds.ts > "$LOGFILE" 2>&1
