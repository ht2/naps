import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fetchRaceCards } from "@/lib/racing-api";
import PickForm from "@/components/PickForm";
import CountdownTimer from "@/components/CountdownTimer";
import type { Runner } from "@/lib/racing-api";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string; day: string }>;
}

export default async function DayPage({ params }: PageProps) {
  const { token, day: dayStr } = await params;
  const day = parseInt(dayStr, 10);

  if (isNaN(day) || day < 1 || day > 4) {
    notFound();
  }

  const player = await prisma.player.findUnique({
    where: { token },
    include: { competition: true },
  });

  if (!player) {
    notFound();
  }

  const races = await prisma.race.findMany({
    where: { competitionId: player.competitionId, day },
    orderBy: { raceNumber: "asc" },
  });

  const existingPicks = await prisma.pick.findMany({
    where: {
      playerId: player.id,
      raceId: { in: races.map((r) => r.id) },
    },
  });

  // Calculate day date
  const dayDate = new Date(player.competition.startDate);
  dayDate.setDate(dayDate.getDate() + (day - 1));
  const dateStr = dayDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Fetch race cards if this day is today or tomorrow
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  const dayDateStr = dayDate.toISOString().slice(0, 10);

  const apiDay =
    dayDateStr === todayStr
      ? "today"
      : dayDateStr === tomorrowStr
        ? "tomorrow"
        : null;

  let runnersPerRace: Record<string, Runner[]> = {};
  let raceNamesMap: Record<string, string> = {};

  if (apiDay) {
    const raceCards = await fetchRaceCards("Cheltenham", apiDay);

    if (raceCards.length > 0) {
      // Match API races to DB races by comparing off_dt to scheduledTime
      for (const race of races) {
        const raceTime = new Date(race.scheduledTime);
        const raceHH = raceTime.getUTCHours();
        const raceMM = raceTime.getUTCMinutes();

        const matchedCard = raceCards.find((card) => {
          const offDt = new Date(card.off_dt);
          return offDt.getUTCHours() === raceHH && offDt.getUTCMinutes() === raceMM;
        });
        if (matchedCard) {
          runnersPerRace[race.id] = matchedCard.runners;
          raceNamesMap[race.id] = matchedCard.race_name;

          // Update raceName in DB if not already set
          if (!race.raceName && matchedCard.race_name) {
            await prisma.race.update({
              where: { id: race.id },
              data: { raceName: matchedCard.race_name },
            });
          }
        }
      }
    }
  }

  const nextRace = races.find((r) => r.scheduledTime > now) ?? null;

  const raceData = races.map((r) => ({
    id: r.id,
    raceNumber: r.raceNumber,
    scheduledTime: r.scheduledTime.toISOString(),
    raceName: raceNamesMap[r.id] || r.raceName || undefined,
  }));

  const pickData = existingPicks.map((p) => ({
    raceId: p.raceId,
    horseName: p.horseName,
    isNap: p.isNap,
  }));

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <Link
        href={`/play/${token}`}
        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-6"
      >
        &larr; Back to overview
      </Link>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Day {day}</h1>
          {nextRace && (
            <CountdownTimer
              targetTime={nextRace.scheduledTime.toISOString()}
              label={`Race ${nextRace.raceNumber}`}
            />
          )}
        </div>
        <p className="text-gray-600">{dateStr}</p>
        <p className="text-sm text-gray-500 mt-1">
          {player.competition.name} &middot; {player.name}
        </p>
      </div>

      {races.length === 0 ? (
        <p className="text-gray-500">No races scheduled for this day yet.</p>
      ) : (
        <PickForm
          races={raceData}
          existingPicks={pickData}
          playerToken={token}
          day={day}
          runnersPerRace={runnersPerRace}
        />
      )}
    </main>
  );
}
