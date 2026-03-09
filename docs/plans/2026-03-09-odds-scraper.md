# Odds Scraper Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scrape horse racing odds from Oddschecker via a local Playwright script, push to Railway app via API, display prices on race cards.

**Architecture:** Local scraper script uses Playwright to load Oddschecker pages, parses the odds grid, calculates most common price per horse, and POSTs results to a Next.js API route. The API upserts odds into a `HorseOdds` Prisma model. The day page reads cached odds from DB and passes them to the RaceCard component for display.

**Tech Stack:** Playwright (local only), Next.js API routes, Prisma/PostgreSQL, node-cron (local)

---

### Task 1: Prisma Schema — Add HorseOdds Model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add HorseOdds model to schema**

Add to end of `prisma/schema.prisma`:

```prisma
model HorseOdds {
  id         String   @id @default(cuid())
  raceDate   String   // "2026-03-10"
  raceTime   String   // "13:20"
  horseName  String
  odds       String   // fractional e.g. "9/4"
  fetchedAt  DateTime @default(now())

  @@unique([raceDate, raceTime, horseName])
  @@index([raceDate, raceTime])
}
```

**Step 2: Run migration**

Run: `npx prisma migrate dev --name add-horse-odds`
Expected: Migration applied, Prisma Client regenerated

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add HorseOdds model for cached odds data"
```

---

### Task 2: API Route — POST /api/odds

**Files:**
- Create: `src/app/api/odds/route.ts`
- Modify: `.env` — add `ODDS_API_KEY`
- Modify: `.env.example` — add `ODDS_API_KEY`

**Step 1: Add ODDS_API_KEY to env files**

`.env` — append:
```
ODDS_API_KEY=naps-odds-secret-2026
```

`.env.example` — append:
```
ODDS_API_KEY=
```

**Step 2: Create the API route**

Create `src/app/api/odds/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface OddsEntry {
  horseName: string;
  odds: string;
}

interface OddsPayload {
  raceDate: string;  // "2026-03-10"
  raceTime: string;  // "13:20"
  horses: OddsEntry[];
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.ODDS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: OddsPayload = await request.json();

    if (!body.raceDate || !body.raceTime || !Array.isArray(body.horses)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const now = new Date();

    await prisma.$transaction(
      body.horses.map((h) =>
        prisma.horseOdds.upsert({
          where: {
            raceDate_raceTime_horseName: {
              raceDate: body.raceDate,
              raceTime: body.raceTime,
              horseName: h.horseName,
            },
          },
          update: { odds: h.odds, fetchedAt: now },
          create: {
            raceDate: body.raceDate,
            raceTime: body.raceTime,
            horseName: h.horseName,
            odds: h.odds,
            fetchedAt: now,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      race: `${body.raceDate} ${body.raceTime}`,
      horses: body.horses.length,
    });
  } catch (error) {
    console.error("Odds API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

**Step 3: Test with curl**

Run: `curl -X POST http://localhost:3000/api/odds -H "Content-Type: application/json" -H "x-api-key: naps-odds-secret-2026" -d '{"raceDate":"2026-03-10","raceTime":"13:20","horses":[{"horseName":"Test Horse","odds":"5/1"}]}'`
Expected: `{"success":true,"race":"2026-03-10 13:20","horses":1}`

**Step 4: Commit**

```bash
git add src/app/api/odds/route.ts .env.example
git commit -m "feat: add POST /api/odds endpoint for odds ingestion"
```

---

### Task 3: Local Scraper Script

**Files:**
- Create: `scripts/scrape-odds.ts`
- Modify: `package.json` — add playwright dev dependency and scrape script

**Step 1: Install Playwright**

Run: `npm install -D playwright`
Run: `npx playwright install chromium`

**Step 2: Create scraper script**

Create `scripts/scrape-odds.ts`:

```typescript
import { chromium } from "playwright";

const TARGETS = [
  { url: "http://localhost:3000/api/odds", label: "local" },
  { url: "https://naps-production.up.railway.app/api/odds", label: "prod" },
];

const API_KEY = process.env.ODDS_API_KEY || "naps-odds-secret-2026";

// Cheltenham race times (UTC hours:minutes)
const RACE_TIMES = ["13:20", "14:00", "14:40", "15:20", "16:00", "16:40", "17:20"];

interface HorseOdds {
  horseName: string;
  odds: string;
}

function getMostCommonOdds(oddsList: string[]): string {
  const counts: Record<string, number> = {};
  for (const o of oddsList) {
    counts[o] = (counts[o] || 0) + 1;
  }
  let best = oddsList[0];
  let bestCount = 0;
  for (const [odds, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count;
      best = odds;
    }
  }
  return best;
}

async function scrapeRace(raceDate: string, raceTime: string): Promise<HorseOdds[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://www.oddschecker.com/horse-racing/${raceDate}-cheltenham/${raceTime}/winner`;
  console.log(`  Fetching: ${url}`);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Wait for odds table to render
    await page.waitForSelector("tr[data-bname]", { timeout: 15000 }).catch(() => null);

    const horses = await page.evaluate(() => {
      const rows = document.querySelectorAll("tr[data-bname]");
      const results: { name: string; odds: string[] }[] = [];

      rows.forEach((row) => {
        const name = row.getAttribute("data-bname") || "";
        const cells = row.querySelectorAll("td[data-odig]");
        const odds: string[] = [];
        cells.forEach((cell) => {
          const val = cell.getAttribute("data-odig");
          if (val && val !== "" && val !== "SP") {
            odds.push(val);
          }
        });
        if (name && odds.length > 0) {
          results.push({ name, odds });
        }
      });

      return results;
    });

    await browser.close();

    return horses.map((h) => ({
      horseName: h.name,
      odds: getMostCommonOdds(h.odds),
    }));
  } catch (error) {
    console.error(`  Error scraping ${raceTime}:`, error);
    await browser.close();
    return [];
  }
}

async function pushOdds(target: { url: string; label: string }, raceDate: string, raceTime: string, horses: HorseOdds[]) {
  try {
    const res = await fetch(target.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ raceDate, raceTime, horses }),
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`  [${target.label}] Pushed ${horses.length} horses for ${raceTime}`);
    } else {
      console.error(`  [${target.label}] Error: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.error(`  [${target.label}] Failed to push:`, error);
  }
}

async function main() {
  // Default to tomorrow if no date arg provided
  const dateArg = process.argv[2];
  let raceDate: string;

  if (dateArg) {
    raceDate = dateArg;
  } else {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    raceDate = tomorrow.toISOString().slice(0, 10);
  }

  console.log(`Scraping Cheltenham odds for ${raceDate}`);

  for (const raceTime of RACE_TIMES) {
    console.log(`\nRace ${raceTime}:`);
    const horses = await scrapeRace(raceDate, raceTime);

    if (horses.length === 0) {
      console.log("  No odds found, skipping");
      continue;
    }

    console.log(`  Found ${horses.length} horses`);
    horses.forEach((h) => console.log(`    ${h.horseName}: ${h.odds}`));

    for (const target of TARGETS) {
      await pushOdds(target, raceDate, raceTime, horses);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
```

**Step 3: Add npm script**

Add to `package.json` scripts:
```json
"scrape-odds": "npx tsx scripts/scrape-odds.ts"
```

**Step 4: Test the scraper**

Run: `npm run scrape-odds 2026-03-10`
Expected: Scrapes 7 Cheltenham races, prints horse names and odds, pushes to local and prod

**Step 5: Commit**

```bash
git add scripts/scrape-odds.ts package.json
git commit -m "feat: add local odds scraper using Playwright"
```

---

### Task 4: Day Page — Read Odds from DB

**Files:**
- Modify: `src/app/play/[token]/day/[day]/page.tsx`

**Step 1: Add odds lookup after runner matching**

After the `runnersPerRace` block (around line 99), add odds lookup:

```typescript
// Look up cached odds for each race
let oddsPerRace: Record<string, Record<string, string>> = {};

if (Object.keys(runnersPerRace).length > 0) {
  const raceDateStr = dayDate.toISOString().slice(0, 10);
  const oddsRows = await prisma.horseOdds.findMany({
    where: { raceDate: raceDateStr },
  });

  // Group by raceTime, then by horseName
  for (const row of oddsRows) {
    // Find the race ID that matches this time
    const matchedRace = races.find((r) => {
      const rt = new Date(r.scheduledTime);
      const hh = rt.getUTCHours().toString().padStart(2, "0");
      const mm = rt.getUTCMinutes().toString().padStart(2, "0");
      return `${hh}:${mm}` === row.raceTime;
    });
    if (matchedRace) {
      if (!oddsPerRace[matchedRace.id]) oddsPerRace[matchedRace.id] = {};
      oddsPerRace[matchedRace.id][row.horseName] = row.odds;
    }
  }
}
```

**Step 2: Pass oddsPerRace to PickForm**

Update the PickForm JSX to include `oddsPerRace`:

```tsx
<PickForm
  races={raceData}
  existingPicks={pickData}
  playerToken={token}
  day={day}
  runnersPerRace={runnersPerRace}
  oddsPerRace={oddsPerRace}
/>
```

**Step 3: Commit**

```bash
git add src/app/play/[token]/day/[day]/page.tsx
git commit -m "feat: read cached odds from DB and pass to PickForm"
```

---

### Task 5: PickForm + RaceCard — Display Odds

**Files:**
- Modify: `src/components/PickForm.tsx`
- Modify: `src/components/RaceCard.tsx`

**Step 1: Update PickForm to accept and pass odds**

Add to `PickFormProps`:
```typescript
oddsPerRace?: Record<string, Record<string, string>>;
```

Add to destructured props:
```typescript
oddsPerRace = {},
```

Pass odds to RaceCard:
```tsx
<RaceCard
  runners={runners}
  selectedHorse={horseNames[race.id] ?? ""}
  onSelect={(horseName) =>
    setHorseNames((prev) => ({
      ...prev,
      [race.id]: horseName,
    }))
  }
  locked={locked}
  odds={oddsPerRace[race.id]}
/>
```

**Step 2: Update RaceCard to display odds**

Add `odds` to props:
```typescript
interface RaceCardProps {
  runners: Runner[];
  selectedHorse: string;
  onSelect: (horseName: string) => void;
  locked: boolean;
  odds?: Record<string, string>;  // horseName -> fractional odds
}
```

Add `odds = {}` to destructured props.

In each runner button, display the price. Add to the right-side info area (before form figures):

```tsx
{odds[runner.horse] && (
  <span className="font-semibold text-green-700">
    {odds[runner.horse]}
  </span>
)}
```

**Step 3: Commit**

```bash
git add src/components/PickForm.tsx src/components/RaceCard.tsx
git commit -m "feat: display scraped odds on race card runners"
```

---

### Task 6: Verify End-to-End

**Step 1: Run the scraper against local**

Run: `npm run scrape-odds 2026-03-10`
Expected: Odds scraped and pushed to localhost

**Step 2: Load the day page and verify odds display**

Navigate to: `http://localhost:3000/play/{token}/day/1`
Expected: Each runner shows their fractional odds (e.g. "9/4") next to form figures

**Step 3: Deploy and test prod**

Push to Railway, then run scraper again to push to prod endpoint.

---

## Files Summary

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Modify — add HorseOdds model |
| `src/app/api/odds/route.ts` | Create — POST endpoint for odds ingestion |
| `scripts/scrape-odds.ts` | Create — local Playwright scraper |
| `src/app/play/[token]/day/[day]/page.tsx` | Modify — read odds from DB |
| `src/components/PickForm.tsx` | Modify — pass odds to RaceCard |
| `src/components/RaceCard.tsx` | Modify — display odds per runner |
| `.env` / `.env.example` | Modify — add ODDS_API_KEY |
| `package.json` | Modify — add playwright dep and scrape script |
