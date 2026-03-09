"use client";

import { useActionState } from "react";
import { useState } from "react";
import { submitDayPicks } from "@/app/play/[token]/actions";
import { isBeforeDeadline } from "@/lib/validation";
import type { Runner } from "@/lib/racing-api";
import RaceCard from "@/components/RaceCard";

interface RaceData {
  id: string;
  raceNumber: number;
  scheduledTime: string; // ISO string for client
  raceName?: string;
}

interface ExistingPick {
  raceId: string;
  horseName: string;
  isNap: boolean;
}

interface PickFormProps {
  races: RaceData[];
  existingPicks: ExistingPick[];
  playerToken: string;
  day: number;
  runnersPerRace?: Record<string, Runner[]>;
}

export default function PickForm({
  races,
  existingPicks,
  playerToken,
  day,
  runnersPerRace = {},
}: PickFormProps) {
  const pickMap = new Map(existingPicks.map((p) => [p.raceId, p]));

  const [horseNames, setHorseNames] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const race of races) {
      initial[race.id] = pickMap.get(race.id)?.horseName ?? "";
    }
    return initial;
  });

  const [napRaceId, setNapRaceId] = useState<string>(() => {
    const napPick = existingPicks.find((p) => p.isNap);
    return napPick?.raceId ?? "";
  });

  async function handleSubmit(
    _prevState: { success: boolean; message: string } | null,
    formData: FormData
  ) {
    return submitDayPicks(formData);
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, null);

  const now = new Date();
  const hasEditableRaces = races.some(
    (r) => new Date(r.scheduledTime) > now
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="playerToken" value={playerToken} />
      <input type="hidden" name="day" value={day} />

      <div className="space-y-4">
        {races.map((race) => {
          const existing = pickMap.get(race.id);
          const raceTime = new Date(race.scheduledTime);
          const locked = !isBeforeDeadline(raceTime);
          const runners = runnersPerRace[race.id];
          const hasRunners = runners && runners.length > 0;

          return (
            <div
              key={race.id}
              className={`rounded-lg border p-4 ${
                locked
                  ? "bg-gray-100 border-gray-300"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">Race {race.raceNumber}</h3>
                  {race.raceName && (
                    <p className="text-xs text-gray-500">{race.raceName}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {raceTime.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {locked && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      Locked
                    </span>
                  )}
                </div>
              </div>

              {hasRunners ? (
                <>
                  {/* Hidden input carries the value when using runner selection */}
                  <input
                    type="hidden"
                    name={`horse_${race.id}`}
                    value={horseNames[race.id] ?? ""}
                  />
                  <RaceCard
                    runners={runners}
                    selectedHorse={horseNames[race.id] ?? ""}
                    onSelect={(horseName) =>
                      setHorseNames((prev) => ({
                        ...prev,
                        [race.id]: horseName,
                      }))
                    }
                    locked={locked}
                  />
                  {!locked && (
                    <div className="mt-2">
                      <input
                        type="text"
                        id={`horse-${race.id}`}
                        value={horseNames[race.id] ?? ""}
                        onChange={(e) =>
                          setHorseNames((prev) => ({
                            ...prev,
                            [race.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Or type horse name manually"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label
                      htmlFor={`horse-${race.id}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Horse name
                    </label>
                    {locked ? (
                      <p className="text-sm py-2 px-3 bg-gray-200 rounded-md">
                        {existing?.horseName || (
                          <span className="text-gray-400 italic">No pick</span>
                        )}
                      </p>
                    ) : (
                      <input
                        type="text"
                        id={`horse-${race.id}`}
                        name={`horse_${race.id}`}
                        value={horseNames[race.id] ?? ""}
                        onChange={(e) =>
                          setHorseNames((prev) => ({
                            ...prev,
                            [race.id]: e.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter horse name"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-end mt-3">
                <label
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                    napRaceId === race.id
                      ? "bg-amber-100 border-amber-400 text-amber-800"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="napRaceId"
                    value={race.id}
                    checked={napRaceId === race.id}
                    onChange={() => {
                      if (!locked) setNapRaceId(race.id);
                    }}
                    disabled={locked && napRaceId !== race.id}
                    className="accent-amber-600"
                  />
                  <span className="text-sm font-medium">NAP</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {state && (
        <div
          className={`mt-4 p-3 rounded-md text-sm ${
            state.success
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {state.message}
        </div>
      )}

      {hasEditableRaces && (
        <button
          type="submit"
          disabled={isPending}
          className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Saving..." : "Save Picks"}
        </button>
      )}
    </form>
  );
}
