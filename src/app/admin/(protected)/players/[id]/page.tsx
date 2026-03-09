import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { calcPickPnl } from "@/lib/scoring";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminPlayerDetailPage({ params }: Props) {
  const { id } = await params;

  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      picks: {
        include: {
          race: {
            select: {
              id: true,
              day: true,
              raceNumber: true,
              scheduledTime: true,
              winnerName: true,
              winnerSP: true,
            },
          },
        },
        orderBy: [{ race: { day: "asc" } }, { race: { raceNumber: "asc" } }],
      },
    },
  });

  if (!player) return notFound();

  // Group picks by day
  const grouped: Record<number, typeof player.picks> = {};
  for (const pick of player.picks) {
    const day = pick.race.day;
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(pick);
  }

  const days = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  let overallTotal = 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <a
        href="/admin/races"
        className="text-sm text-blue-600 hover:underline"
      >
        &larr; Back to all races
      </a>
      <h1 className="text-2xl font-bold mt-2 mb-6">{player.name}</h1>

      {days.length === 0 && (
        <p className="text-gray-500">No picks submitted yet.</p>
      )}

      {days.map((day) => {
        let dayTotal = 0;

        return (
          <div key={day} className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Day {day}</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Race</th>
                    <th className="text-left px-4 py-3 font-medium">Time</th>
                    <th className="text-left px-4 py-3 font-medium">Horse</th>
                    <th className="text-center px-4 py-3 font-medium">NAP?</th>
                    <th className="text-center px-4 py-3 font-medium">Arsenalled?</th>
                    <th className="text-right px-4 py-3 font-medium">P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {grouped[day].map((pick) => {
                    const { pnl } = calcPickPnl(pick, pick.race);
                    dayTotal += pnl;
                    overallTotal += pnl;

                    const isWinner =
                      pick.race.winnerName &&
                      pick.horseName.toLowerCase().trim() ===
                        pick.race.winnerName.toLowerCase().trim();

                    return (
                      <tr key={pick.id} className={isWinner ? "bg-green-50" : ""}>
                        <td className="px-4 py-3">
                          <a
                            href={`/admin/race/${pick.race.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            Race {pick.race.raceNumber}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {pick.race.scheduledTime.toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className={`px-4 py-3 ${pick.isNap ? "font-bold" : ""}`}>
                          {pick.horseName}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pick.isNap ? "Yes" : ""}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pick.isArsenalled ? "Yes" : ""}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono ${
                            pnl > 0
                              ? "text-green-600"
                              : pnl < 0
                              ? "text-red-600"
                              : "text-gray-500"
                          }`}
                        >
                          {pick.race.winnerName
                            ? (pnl >= 0 ? "+" : "") + pnl.toFixed(2)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 font-semibold text-right">
                      Day {day} Total
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-semibold ${
                        dayTotal > 0
                          ? "text-green-600"
                          : dayTotal < 0
                          ? "text-red-600"
                          : "text-gray-500"
                      }`}
                    >
                      {(dayTotal >= 0 ? "+" : "") + dayTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        );
      })}

      {days.length > 0 && (
        <div className="bg-white rounded-lg shadow px-4 py-4 flex justify-between items-center">
          <span className="text-lg font-bold">Overall Total</span>
          <span
            className={`text-lg font-mono font-bold ${
              overallTotal > 0
                ? "text-green-600"
                : overallTotal < 0
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            {(overallTotal >= 0 ? "+" : "") + overallTotal.toFixed(2)}
          </span>
        </div>
      )}
    </main>
  );
}
