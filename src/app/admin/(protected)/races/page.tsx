import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { toggleDayReveal } from "../../actions";

export default async function AdminRacesPage() {
  const competition = await prisma.competition.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, picksRevealedDays: true },
  });

  const revealedDays = competition?.picksRevealedDays
    ? competition.picksRevealedDays.split(",").filter(Boolean).map(Number)
    : [];

  const races = await prisma.race.findMany({
    orderBy: [{ day: "asc" }, { raceNumber: "asc" }],
    include: { competition: { select: { name: true } } },
  });

  const now = new Date();

  // Group races by day
  const grouped: Record<number, typeof races> = {};
  for (const race of races) {
    if (!grouped[race.day]) grouped[race.day] = [];
    grouped[race.day].push(race);
  }

  const days = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  function statusColor(race: (typeof races)[0]) {
    if (race.winnerName) return "bg-green-100 border-green-300 text-green-800";
    if (race.scheduledTime < now)
      return "bg-yellow-100 border-yellow-300 text-yellow-800";
    return "bg-gray-100 border-gray-300 text-gray-600";
  }

  function statusLabel(race: (typeof races)[0]) {
    if (race.winnerName) return "Result entered";
    if (race.scheduledTime < now) return "Awaiting result";
    return "Upcoming";
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin — All Races</h1>

      {days.length === 0 && (
        <p className="text-gray-500">No races found.</p>
      )}

      {days.map((day) => {
        const isRevealed = revealedDays.includes(day);

        return (
          <div key={day} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Day {day}</h2>
              {competition && (
                <form action={toggleDayReveal}>
                  <input type="hidden" name="competitionId" value={competition.id} />
                  <input type="hidden" name="day" value={day} />
                  <button
                    type="submit"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isRevealed
                        ? "bg-green-100 text-green-800 hover:bg-green-200 border border-green-300"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                    }`}
                  >
                    {isRevealed ? "Picks visible" : "Picks hidden"}
                  </button>
                </form>
              )}
            </div>
            <div className="space-y-2">
              {grouped[day].map((race) => (
                <Link
                  key={race.id}
                  href={`/admin/race/${race.id}`}
                  className={`block border rounded-lg px-4 py-3 transition-colors hover:opacity-80 ${statusColor(race)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Race {race.raceNumber}</span>
                      <span className="mx-2 text-sm">·</span>
                      <span className="text-sm">
                        {race.scheduledTime.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {race.winnerName && (
                        <>
                          <span className="mx-2 text-sm">·</span>
                          <span className="text-sm font-medium">
                            Winner: {race.winnerName} (SP {race.winnerSP})
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50">
                      {statusLabel(race)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </main>
  );
}
