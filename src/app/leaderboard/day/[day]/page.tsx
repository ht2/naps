import { notFound } from "next/navigation";
import { getActiveCompetition, getLeaderboard } from "@/lib/leaderboard";
import DayBreakdown from "@/components/DayBreakdown";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ day: string }>;
}

export default async function DayPage({ params }: PageProps) {
  const { day: dayParam } = await params;
  const day = parseInt(dayParam, 10);

  if (isNaN(day) || day < 1 || day > 4) {
    notFound();
  }

  const competition = await getActiveCompetition();
  if (!competition) {
    notFound();
  }

  const { standings, accaOdds, races, competition: compInfo } =
    await getLeaderboard(competition.id);

  return (
    <main className="min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">
            {compInfo?.name ?? "NAPS"}{" "}
            <span className="text-gray-500 font-normal text-lg">
              Day {day}
            </span>
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <DayBreakdown
          day={day}
          races={races}
          standings={standings}
          accaOdds={accaOdds[day] ?? null}
        />
      </div>
    </main>
  );
}
