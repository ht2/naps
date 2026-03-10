# NAPS

A horse racing tipping competition app built for festivals like Cheltenham. Players submit their picks (NAPs) for each race across multiple days, and the leaderboard tracks standings in real time as results come in.

## How It Works

### The Game

- An admin creates a **competition** spanning multiple days (e.g. 4 days of Cheltenham)
- **Players** are added and receive unique links to submit their picks
- Each day has 7 races — players pick one horse per race
- One pick per day is marked as the **NAP** (best bet), which carries a 3x stake
- If a player misses a race, the admin can **arsenal** them (assign the favourite)
- Results are entered by the admin with the winner's name and SP (starting price)
- P&L is calculated: `winnings = stake × SP` (NAP stake = 3, regular = 1)
- The admin can toggle per-day **pick reveal** to control when other players can see each other's selections
- Before picks are revealed, the leaderboard shows each player's pick status and NAP confirmation

### Scoring

| Pick type | Stake | Win return | Loss return |
|-----------|-------|------------|-------------|
| Regular   | 1     | 1 × SP     | -1          |
| NAP       | 3     | 3 × SP     | -3          |

Odds can be toggled between **decimal** (e.g. 4.00) and **fractional** (e.g. 3/1) display on all pages. Large odds include thousands separators.

## Tech Stack

- **Next.js 15** (App Router, Server Components, Server Actions)
- **TypeScript**
- **Prisma** with PostgreSQL
- **Tailwind CSS**
- **Playwright** (odds scraping from Oddschecker)
- **Docker** (multi-stage build for production)
- **Railway** for deployment

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and other settings

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_PASSWORD` | Password for the admin panel |
| `ADMIN_SECRET` | Secret used for admin session cookies |
| `NEXT_PUBLIC_BASE_URL` | Public URL of the app (for player links) |
| `RACING_API_USERNAME` | Racing API credentials (optional) |
| `RACING_API_PASSWORD` | Racing API credentials (optional) |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Public leaderboard
│   ├── leaderboard/day/[day]/            # Day-by-day breakdown
│   ├── play/[token]/                     # Player pick submission
│   │   └── day/[day]/                    # Per-day pick form
│   ├── admin/                            # Admin login
│   │   └── (protected)/
│   │       ├── dashboard/                # Admin dashboard
│   │       ├── races/                    # Race management
│   │       ├── race/[id]/                # Individual race + results
│   │       └── players/[id]/             # Player management
│   └── api/odds/                         # Odds ingestion endpoint
├── components/
│   ├── LeaderboardTable.tsx              # Main standings table
│   ├── DayBreakdown.tsx                  # Per-day race results & picks
│   ├── PlayerPicksTable.tsx              # Admin pick editing
│   ├── PickForm.tsx                      # Player pick submission form (collapsible races)
│   ├── RaceCard.tsx                      # Runner display with odds, form, stats
│   ├── CountdownTimer.tsx               # Next race countdown
│   └── AdminNav.tsx                      # Admin navigation
├── lib/
│   ├── prisma.ts                         # Prisma client singleton
│   ├── scoring.ts                        # P&L calculation & odds conversion
│   └── leaderboard.ts                    # Leaderboard data aggregation
prisma/
│   └── schema.prisma                     # Database schema
scripts/
│   ├── scrape-odds.ts                    # Oddschecker odds scraper
│   └── run-scraper.sh                   # Cron wrapper for scheduled scraping
Dockerfile                                # Multi-stage production build
```

## Deployment

The app deploys to Railway with Docker:

```bash
# Build and deploy
railway up
```

The Dockerfile uses a multi-stage build (deps → builder → runner) with Next.js standalone output mode. Database migrations run automatically on container start.

## Odds Scraping

The scraper fetches live odds from Oddschecker using Playwright:

```bash
npm run scrape-odds
```

This scrapes odds for both today and tomorrow's races (skipping tomorrow on the last festival day) and pushes to both local and production via the `/api/odds` endpoint.

A cron wrapper (`scripts/run-scraper.sh`) is provided for scheduled runs every 5 minutes, with timestamped logs written to `logs/`.

## License

MIT
