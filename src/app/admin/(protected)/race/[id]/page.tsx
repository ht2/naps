import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RaceResultForm from "@/components/RaceResultForm";
import PlayerPicksTable from "@/components/PlayerPicksTable";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminRaceDetailPage({ params }: Props) {
  const { id } = await params;

  const race = await prisma.race.findUnique({
    where: { id },
    include: {
      competition: true,
      picks: {
        include: { player: { select: { id: true, name: true } } },
        orderBy: { player: { name: "asc" } },
      },
    },
  });

  if (!race) return notFound();

  const allPlayers = await prisma.player.findMany({
    where: { competitionId: race.competitionId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <a
          href="/admin/races"
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Back to all races
        </a>
        <h1 className="text-2xl font-bold mt-2">
          Day {race.day} — Race {race.raceNumber}
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Scheduled:{" "}
          {race.scheduledTime.toLocaleString("en-GB", {
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <RaceResultForm
        raceId={race.id}
        currentWinnerName={race.winnerName}
        currentWinnerSP={race.winnerSP}
      />

      <div>
        <h2 className="text-lg font-semibold mb-3">Player Picks</h2>
        <PlayerPicksTable
          picks={race.picks}
          race={{
            id: race.id,
            winnerName: race.winnerName,
            winnerSP: race.winnerSP,
          }}
          allPlayers={allPlayers}
        />
      </div>
    </main>
  );
}
