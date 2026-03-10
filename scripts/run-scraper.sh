#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Source nvm if available, to get node/npx on PATH
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd "$PROJECT_DIR"
mkdir -p logs
LOGFILE="logs/odds-$(date +%Y%m%d-%H%M%S).log"
npx tsx scripts/scrape-odds.ts > "$LOGFILE" 2>&1
