import Link from "next/link";

interface DayOverviewProps {
  day: number;
  date: string;
  picksCount: number;
  hasNap: boolean;
  totalRaces: number;
  token: string;
}

export default function DayOverview({
  day,
  date,
  picksCount,
  hasNap,
  totalRaces,
  token,
}: DayOverviewProps) {
  const allDone = picksCount === totalRaces && hasNap;
  const partial = picksCount > 0 && !allDone;

  let borderColor = "border-gray-300 bg-gray-50";
  let badge = "bg-gray-200 text-gray-600";
  let statusText = "Not started";

  if (allDone) {
    borderColor = "border-green-400 bg-green-50";
    badge = "bg-green-100 text-green-700";
    statusText = "Complete";
  } else if (partial) {
    borderColor = "border-yellow-400 bg-yellow-50";
    badge = "bg-yellow-100 text-yellow-700";
    statusText = "In progress";
  }

  return (
    <Link href={`/play/${token}/day/${day}`}>
      <div
        className={`rounded-lg border-2 p-4 transition-shadow hover:shadow-md ${borderColor}`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">Day {day}</h3>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge}`}>
            {statusText}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-3">{date}</p>

        <div className="flex items-center justify-between text-sm">
          <span>
            Picks: {picksCount}/{totalRaces}
          </span>
          <span>
            NAP:{" "}
            {hasNap ? (
              <span className="text-green-600 font-medium">Yes</span>
            ) : (
              <span className="text-gray-400">No</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
