import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DayOverview from "@/components/DayOverview";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PlayerPage({ params }: PageProps) {
  const { token } = await params;

  const player = await prisma.player.findUnique({
    where: { token },
    include: {
      competition: {
        include: {
          races: {
            orderBy: [{ day: "asc" }, { raceNumber: "asc" }],
          },
        },
      },
      picks: true,
    },
  });

  if (!player) {
    notFound();
  }

  const { competition, picks } = player;

  // Group races by day
  const racesByDay = new Map<number, typeof competition.races>();
  for (const race of competition.races) {
    const existing = racesByDay.get(race.day) ?? [];
    existing.push(race);
    racesByDay.set(race.day, existing);
  }

  // Build day summaries for days 1-4
  const days = [1, 2, 3, 4].map((day) => {
    const dayRaces = racesByDay.get(day) ?? [];
    const dayRaceIds = new Set(dayRaces.map((r) => r.id));
    const dayPicks = picks.filter((p) => dayRaceIds.has(p.raceId));
    const hasNap = dayPicks.some((p) => p.isNap);

    // Calculate date from competition start date
    const date = new Date(competition.startDate);
    date.setDate(date.getDate() + (day - 1));
    const dateStr = date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    return {
      day,
      date: dateStr,
      picksCount: dayPicks.length,
      hasNap,
      totalRaces: dayRaces.length,
    };
  });

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold mb-1">{competition.name}</h1>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Leaderboard
          </Link>
        </div>
        <p className="text-gray-600">
          Welcome, <span className="font-medium">{player.name}</span>
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-4">Your Picks</h2>

      <div className="grid gap-4">
        {days.map((d) => (
          <DayOverview
            key={d.day}
            day={d.day}
            date={d.date}
            picksCount={d.picksCount}
            hasNap={d.hasNap}
            totalRaces={d.totalRaces}
            token={token}
          />
        ))}
      </div>
    </main>
  );
}
