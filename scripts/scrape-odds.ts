import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGETS = [
  { url: "http://localhost:3000/api/odds", label: "local" },
  { url: "https://naps-production.up.railway.app/api/odds", label: "prod" },
];

const API_KEY = process.env.ODDS_API_KEY || "naps-odds-secret-2026";

const RACE_TIMES = [
  "13:20",
  "14:00",
  "14:40",
  "15:20",
  "16:00",
  "16:40",
  "17:20",
];

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

async function scrapeRace(
  raceDate: string,
  raceTime: string
): Promise<HorseOdds[]> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  const url = `https://www.oddschecker.com/horse-racing/${raceDate}-cheltenham/${raceTime}/winner`;
  console.log(`  Fetching: ${url}`);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page
      .waitForSelector("tr[data-bname]", { timeout: 15000 })
      .catch(() => null);

    const horses = await page.evaluate(() => {
      const rows = document.querySelectorAll("tr[data-bname]");
      const results: { name: string; odds: string[] }[] = [];

      rows.forEach((row) => {
        const name = row.getAttribute("data-bname") || "";
        const cells = row.querySelectorAll("td[data-o]");
        const odds: string[] = [];
        cells.forEach((cell) => {
          const val = cell.getAttribute("data-o");
          if (val && val !== "" && val !== "SP" && val !== "EVS") {
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

async function pushOdds(
  target: { url: string; label: string },
  raceDate: string,
  raceTime: string,
  horses: HorseOdds[]
) {
  try {
    const res = await fetch(target.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({ raceDate, raceTime, horses }),
    });
    if (res.ok) {
      const data = await res.json();
      console.log(
        `  [${target.label}] Pushed ${data.horses} horses for ${raceTime}`
      );
    } else {
      console.error(
        `  [${target.label}] Error: ${res.status} ${res.statusText}`
      );
    }
  } catch (error) {
    console.error(`  [${target.label}] Failed to push:`, error);
  }
}

async function getLastFestivalDay(): Promise<string | null> {
  const lastRace = await prisma.race.findFirst({
    orderBy: { scheduledTime: "desc" },
    select: { scheduledTime: true },
  });
  if (!lastRace) return null;
  return lastRace.scheduledTime.toISOString().slice(0, 10);
}

async function scrapeAndPushDate(raceDate: string) {
  console.log(`\n=== Scraping Cheltenham odds for ${raceDate} ===`);

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
}

async function main() {
  const dateArg = process.argv[2];

  if (dateArg) {
    // Manual single-date mode
    await scrapeAndPushDate(dateArg);
  } else {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    // Scrape today
    await scrapeAndPushDate(todayStr);

    // Scrape tomorrow unless today is the last day of the festival
    const lastDay = await getLastFestivalDay();
    if (lastDay && todayStr !== lastDay) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      await scrapeAndPushDate(tomorrow.toISOString().slice(0, 10));
    }
  }

  await prisma.$disconnect();
  console.log("\nDone!");
}

main().catch(console.error);
