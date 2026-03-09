"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function enterResult(formData: FormData) {
  const raceId = formData.get("raceId") as string;
  const winnerName = (formData.get("winnerName") as string).trim();
  const winnerSP = parseFloat(formData.get("winnerSP") as string);

  if (!raceId || !winnerName || isNaN(winnerSP)) {
    throw new Error("Missing required fields");
  }

  await prisma.race.update({
    where: { id: raceId },
    data: { winnerName, winnerSP },
  });

  revalidatePath("/admin/races");
  revalidatePath(`/admin/race/${raceId}`);
  revalidatePath("/");
}

export async function arsenalPlayer(formData: FormData) {
  const playerId = formData.get("playerId") as string;
  const raceId = formData.get("raceId") as string;
  const horseName = (formData.get("horseName") as string).trim();

  if (!playerId || !raceId || !horseName) {
    throw new Error("Missing required fields");
  }

  const race = await prisma.race.findUniqueOrThrow({
    where: { id: raceId },
  });

  // Check if the player already has a NAP for this day
  const existingNap = await prisma.pick.findFirst({
    where: {
      playerId,
      isNap: true,
      race: { day: race.day, competitionId: race.competitionId },
    },
  });

  // If no NAP for this day yet, make the arsenal pick the NAP
  const isNap = !existingNap;

  await prisma.pick.create({
    data: {
      playerId,
      raceId,
      horseName,
      isArsenalled: true,
      isNap,
    },
  });

  revalidatePath(`/admin/race/${raceId}`);
  revalidatePath("/admin/races");
}
