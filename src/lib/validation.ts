// Check if current time is before race scheduled time
export function isBeforeDeadline(scheduledTime: Date): boolean {
  return new Date() < scheduledTime;
}

// Validate NAP rule: exactly one NAP per day
export function validateNapRule(
  picks: { raceId: string; isNap: boolean }[],
  dayRaceIds: string[]
): boolean {
  const dayPicks = picks.filter((p) => dayRaceIds.includes(p.raceId));
  const napCount = dayPicks.filter((p) => p.isNap).length;
  return napCount <= 1;
}
