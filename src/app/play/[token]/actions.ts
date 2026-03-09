"use server";

import { prisma } from "@/lib/prisma";
import { isBeforeDeadline } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export async function submitDayPicks(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  const playerToken = formData.get("playerToken") as string;
  const day = parseInt(formData.get("day") as string, 10);
  const napRaceId = formData.get("napRaceId") as string | null;

  if (!playerToken || isNaN(day) || day < 1 || day > 4) {
    return { success: false, message: "Invalid request." };
  }

  // Validate player
  const player = await prisma.player.findUnique({
    where: { token: playerToken },
    include: { competition: true },
  });

  if (!player) {
    return { success: false, message: "Invalid player token." };
  }

  // Get races for this day
  const races = await prisma.race.findMany({
    where: { competitionId: player.competitionId, day },
    orderBy: { raceNumber: "asc" },
  });

  if (races.length === 0) {
    return { success: false, message: "No races found for this day." };
  }

  // Collect picks from form data
  const picksToUpsert: { raceId: string; horseName: string; isNap: boolean }[] =
    [];

  for (const race of races) {
    const horseName = (formData.get(`horse_${race.id}`) as string)?.trim();
    if (!horseName) continue;

    // Only allow changes before deadline
    if (!isBeforeDeadline(race.scheduledTime)) continue;

    picksToUpsert.push({
      raceId: race.id,
      horseName,
      isNap: napRaceId === race.id,
    });
  }

  // Check that at most one NAP is set among all picks for the day
  // (including existing locked picks)
  const existingPicks = await prisma.pick.findMany({
    where: {
      playerId: player.id,
      raceId: { in: races.map((r) => r.id) },
    },
    include: { race: true },
  });

  // Build final state of all picks for NAP validation
  const lockedNap = existingPicks.find(
    (p) => p.isNap && !isBeforeDeadline(p.race.scheduledTime)
  );

  const editableNapCount = picksToUpsert.filter((p) => p.isNap).length;

  if (lockedNap && editableNapCount > 0) {
    return {
      success: false,
      message:
        "A NAP is already locked on a past race. You cannot change it.",
    };
  }

  if (!lockedNap && editableNapCount > 1) {
    return {
      success: false,
      message: "You can only designate one NAP per day.",
    };
  }

  // Perform upserts in a transaction
  await prisma.$transaction(async (tx) => {
    // If setting a new NAP, unset old NAPs for this day first
    if (editableNapCount === 1) {
      await tx.pick.updateMany({
        where: {
          playerId: player.id,
          raceId: { in: races.map((r) => r.id) },
          isNap: true,
        },
        data: { isNap: false },
      });
    }

    for (const pick of picksToUpsert) {
      await tx.pick.upsert({
        where: {
          playerId_raceId: {
            playerId: player.id,
            raceId: pick.raceId,
          },
        },
        update: {
          horseName: pick.horseName,
          isNap: pick.isNap,
        },
        create: {
          playerId: player.id,
          raceId: pick.raceId,
          horseName: pick.horseName,
          isNap: pick.isNap,
        },
      });
    }
  });

  revalidatePath(`/play/${playerToken}`);
  revalidatePath(`/play/${playerToken}/day/${day}`);

  return { success: true, message: "Picks saved successfully!" };
}
