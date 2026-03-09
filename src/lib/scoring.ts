export function calcPickPnl(
  pick: { isNap: boolean; horseName: string },
  race: { winnerName: string | null; winnerSP: number | null }
) {
  const stake = pick.isNap ? 3 : 1;
  if (!race.winnerName || race.winnerSP === null)
    return { stake, winnings: 0, pnl: 0 };
  const won =
    pick.horseName.toLowerCase().trim() ===
    race.winnerName.toLowerCase().trim();
  const winnings = won ? stake * race.winnerSP : 0;
  return { stake, winnings, pnl: winnings - stake };
}
