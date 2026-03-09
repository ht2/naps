export interface Runner {
  horse: string;
  horse_id: string;
  number: string;
  draw: string;
  jockey: string;
  trainer: string;
  form: string;
  age: string;
  sex_code: string;
  lbs: string;
  ofr: string;
  headgear: string;
  sire: string;
  dam: string;
  damsire: string;
}

export interface RaceCard {
  race_id: string;
  course: string;
  off_time: string;
  off_dt: string;
  race_name: string;
  distance_f: string;
  race_class: string;
  going: string;
  field_size: string;
  prize: string;
  type: string;
  runners: Runner[];
}

interface CacheEntry {
  data: RaceCard[];
  timestamp: number;
}

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
const cacheByDay: Record<string, CacheEntry> = {};

export async function fetchRaceCards(
  course = "Cheltenham",
  day: "today" | "tomorrow" = "today"
): Promise<RaceCard[]> {
  const username = process.env.RACING_API_USERNAME;
  const password = process.env.RACING_API_PASSWORD;

  if (!username || !password) {
    return [];
  }

  // Return cached data if fresh
  const cached = cacheByDay[day];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return filterByCourse(cached.data, course);
  }

  try {
    const credentials = Buffer.from(`${username}:${password}`).toString(
      "base64"
    );
    const url = new URL("https://api.theracingapi.com/v1/racecards/free");
    if (day === "tomorrow") {
      url.searchParams.set("day", "tomorrow");
    }
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      next: { revalidate: 180 }, // Next.js fetch cache: 3 minutes
    });

    if (!res.ok) {
      console.error(`Racing API error: ${res.status} ${res.statusText}`);
      return [];
    }

    const json = await res.json();
    const racecards: RaceCard[] = json.racecards ?? [];

    cacheByDay[day] = { data: racecards, timestamp: Date.now() };

    return filterByCourse(racecards, course);
  } catch (error) {
    console.error("Racing API fetch failed:", error);
    return [];
  }
}

function filterByCourse(cards: RaceCard[], course: string): RaceCard[] {
  return cards.filter(
    (card) => card.course.toLowerCase() === course.toLowerCase()
  );
}
