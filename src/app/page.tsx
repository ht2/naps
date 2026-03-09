import Link from "next/link";
import { getActiveCompetition, getLeaderboard } from "@/lib/leaderboard";
import LeaderboardTable from "@/components/LeaderboardTable";

export const dynamic = "force-dynamic";

export default async function Home() {
  const competition = await getActiveCompetition();

  if (!competition) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">NAPS</h1>
          <p className="text-gray-600">No active competition</p>
        </div>
      </main>
    );
  }

  const { standings, accaOdds, competition: compInfo } =
    await getLeaderboard(competition.id);

  const totalPot = standings.length * (compInfo?.entryFee ?? 0);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {compInfo?.name ?? "NAPS"}{" "}
                <span className="text-gray-500 font-normal text-lg">
                  {compInfo?.year}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {standings.length} player{standings.length !== 1 ? "s" : ""} | Pot:{" "}
                <span className="font-semibold text-gray-700">
                  &pound;{totalPot}
                </span>
              </p>
            </div>
            <a
              href="/admin"
              target="_blank"
              className="text-sm text-gray-400 hover:text-gray-600 font-medium"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Day navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[1, 2, 3, 4].map((d) => (
            <Link
              key={d}
              href={`/leaderboard/day/${d}`}
              className="flex-shrink-0 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              Day {d}
              {accaOdds[d] !== undefined && (
                <span className="ml-1.5 text-xs text-purple-600">
                  ({accaOdds[d].toFixed(2)})
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-lg">Leaderboard</h2>
          </div>
          <LeaderboardTable standings={standings} competition={compInfo!} />
        </div>
      </div>
    </main>
  );
}
