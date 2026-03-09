import Link from "next/link";
import { PlayerStanding } from "@/lib/leaderboard";

interface LeaderboardTableProps {
  standings: PlayerStanding[];
  competition: {
    name: string;
    year: number;
    entryFee: number;
    startDate: Date;
  };
}

function formatPnl(value: number): string {
  if (value === 0) return "0.00";
  return (value > 0 ? "+" : "") + value.toFixed(2);
}

function pnlColor(value: number): string {
  if (value > 0) return "text-green-600 font-semibold";
  if (value < 0) return "text-red-600";
  return "text-gray-500";
}

export default function LeaderboardTable({
  standings,
  competition,
}: LeaderboardTableProps) {
  const days = [1, 2, 3, 4];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left">
            <th className="py-3 px-2 w-10">#</th>
            <th className="py-3 px-2">Player</th>
            {days.map((d) => (
              <th key={d} className="py-3 px-2 text-right hidden sm:table-cell">
                <Link
                  href={`/leaderboard/day/${d}`}
                  className="hover:text-blue-600 hover:underline"
                >
                  Day {d}
                </Link>
              </th>
            ))}
            <th className="py-3 px-2 text-right">P&L</th>
            <th className="py-3 px-2 text-right hidden sm:table-cell">W</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((player, idx) => {
            const isLeader = idx === 0 && player.overallPnl > 0;
            const rowBg = isLeader
              ? "bg-yellow-50 border-yellow-200"
              : idx % 2 === 0
                ? "bg-white"
                : "bg-gray-50";

            return (
              <tr
                key={player.id}
                className={`border-b border-gray-200 ${rowBg}`}
              >
                <td className="py-3 px-2 font-medium text-gray-500">
                  {idx + 1}
                </td>
                <td className="py-3 px-2">
                  <span className="font-medium">{player.name}</span>
                  {!player.paid && (
                    <span className="ml-1 text-xs text-red-500">(unpaid)</span>
                  )}
                </td>
                {days.map((d) => {
                  const val = player.dayPnl[d] ?? 0;
                  const winners = player.dayWinners[d] ?? 0;
                  return (
                    <td
                      key={d}
                      className={`py-3 px-2 text-right hidden sm:table-cell ${pnlColor(val)}`}
                    >
                      <Link
                        href={`/leaderboard/day/${d}`}
                        className="hover:underline"
                      >
                        {formatPnl(val)}
                        {winners > 0 && (
                          <span className="text-xs text-gray-400 ml-1">
                            ({winners})
                          </span>
                        )}
                      </Link>
                    </td>
                  );
                })}
                <td
                  className={`py-3 px-2 text-right font-bold ${pnlColor(player.overallPnl)}`}
                >
                  {formatPnl(player.overallPnl)}
                </td>
                <td className="py-3 px-2 text-right hidden sm:table-cell text-gray-600">
                  {player.totalWinners}
                </td>
              </tr>
            );
          })}
          {standings.length === 0 && (
            <tr>
              <td
                colSpan={days.length + 4}
                className="py-8 text-center text-gray-400"
              >
                No players yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
