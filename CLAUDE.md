# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build (standalone output)
npm run start        # Start production server
npm run scrape-odds  # Run Oddschecker odds scraper (Playwright)

npx prisma migrate deploy   # Apply migrations
npx prisma migrate dev      # Create new migration
npx prisma generate         # Regenerate client (runs automatically on npm install)
npx prisma studio           # Database GUI
```

## Architecture

NAPS is a horse racing tipping competition app for festivals (e.g. Cheltenham). Players submit picks across 4 days of 7 races, with one NAP (best bet) per day at 3x stake.

### Stack
- Next.js 15 (App Router, Server Components, Server Actions)
- Prisma + PostgreSQL
- Tailwind CSS
- Playwright (odds scraping only, not testing)
- Docker multi-stage build, deployed on Railway

### Route Structure

**Public:** `/` (leaderboard), `/leaderboard/day/[day]` (day breakdown), `/play/[token]` (player portal), `/play/[token]/day/[day]` (pick form)

**Admin (protected via cookie auth):** `/admin` (login), `/admin/(protected)/dashboard`, `/admin/(protected)/races`, `/admin/(protected)/race/[id]`, `/admin/(protected)/players/[id]`

**API:** `POST /api/odds` (odds ingestion, requires `x-api-key` header)

### Auth
- **Admin**: HMAC-SHA256 signed cookie (`admin_session`), 24h TTL. Password checked via bcrypt.
- **Players**: Token-based URL access. Middleware validates token format (min 10 chars).

### Scoring (`src/lib/scoring.ts`)
- Regular pick: stake=1, NAP: stake=3
- P&L = `(won ? stake * SP : 0) - stake`
- `winnerSP` is stored as **decimal odds** (e.g. 4.0 = 3/1). Use directly as multiplier, no conversion needed.
- Scraped odds from Oddschecker come as fractional strings — `toDecimalOdds()` converts for display.
- `formatWithCommas()` and `formatOddsString()` format odds with thousands separators for display.
- Odds display is toggleable between decimal and fractional on pick form and leaderboard pages.

### Leaderboard (`src/lib/leaderboard.ts`)
- Aggregates all picks/results per player, calculates daily and overall P&L
- Acca odds: product of all winner SPs when a day is complete
- Pick reveal controlled per-day via `Competition.picksRevealedDays` (comma-separated day numbers)

### External APIs
- **The Racing API** (`src/lib/racing-api.ts`): Fetches live race cards for today/tomorrow. Basic auth, 3-min cache. Runners matched to DB races by comparing scheduled hour:minute.
- **Oddschecker scraper** (`scripts/scrape-odds.ts`): Playwright (headless) scrapes odds for today+tomorrow, POSTs to `/api/odds`. Fuzzy name matching handles apostrophes/case differences. Determines last festival day from DB. Cron runs every 5 min via `scripts/run-scraper.sh`, logs to `logs/`.

### Key Conventions
- All pages fetching live data use `export const dynamic = "force-dynamic"` to prevent build-time caching
- Race deadline enforcement: picks locked after `race.scheduledTime` (server-side in `submitDayPicks`, client-side in `PickForm`)
- Arsenal: admin assigns the favourite to a player who missed a race
- Race card runners sorted by odds (lowest price first) in `RaceCard` component
- Race card shows 3-row layout: name+odds / jockey+trainer+owner / stats (form, OR, weight, age/sex, colour, region, last run)
- Pick form races are collapsible, start collapsed, with expand/collapse all
- When picks are hidden on leaderboard, shows player pick status and NAP confirmation
- Runner data includes fields from The Racing API: colour, region, owner, last_run

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ADMIN_PASSWORD` | Yes | Plain text, hashed with bcrypt on first use |
| `ADMIN_SECRET` | Yes | HMAC-SHA256 secret for admin session cookies |
| `RACING_API_USERNAME` | Yes | The Racing API credentials |
| `RACING_API_PASSWORD` | Yes | |
| `ODDS_API_KEY` | No | Defaults to `naps-odds-secret-2026` |
| `NEXT_PUBLIC_BASE_URL` | No | For player link generation (baked in at build time) |
