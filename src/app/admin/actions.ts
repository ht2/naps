"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  verifyAdminPassword,
  createAdminSession,
  destroyAdminSession,
} from "@/lib/auth";

export async function loginAdmin(formData: FormData) {
  const password = formData.get("password") as string;
  if (!password) {
    return { error: "Password is required" };
  }

  const valid = await verifyAdminPassword(password);
  if (!valid) {
    return { error: "Invalid password" };
  }

  await createAdminSession();
  redirect("/admin/dashboard");
}

export async function logoutAdmin() {
  await destroyAdminSession();
  redirect("/admin");
}

export async function createCompetition(formData: FormData) {
  const name = formData.get("name") as string;
  const year = parseInt(formData.get("year") as string, 10);
  const startDateStr = formData.get("startDate") as string;

  if (!name || !year || !startDateStr) {
    throw new Error("All fields are required");
  }

  const startDate = new Date(startDateStr);

  const raceTimes = ["13:20", "14:00", "14:40", "15:20", "16:00", "16:40", "17:20"];

  const competition = await prisma.competition.create({
    data: {
      name,
      year,
      startDate,
      adminPasswordHash: process.env.ADMIN_PASSWORD!,
    },
  });

  const raceData = [];
  for (let day = 1; day <= 4; day++) {
    for (let raceNum = 0; raceNum < raceTimes.length; raceNum++) {
      const [hours, minutes] = raceTimes[raceNum].split(":").map(Number);
      const scheduledTime = new Date(startDate);
      scheduledTime.setDate(scheduledTime.getDate() + (day - 1));
      scheduledTime.setHours(hours, minutes, 0, 0);

      raceData.push({
        day,
        raceNumber: raceNum + 1,
        scheduledTime,
        competitionId: competition.id,
      });
    }
  }

  await prisma.race.createMany({ data: raceData });

  revalidatePath("/admin/dashboard");
  redirect("/admin/dashboard");
}

export async function addPlayer(formData: FormData) {
  const name = formData.get("name") as string;
  const competitionId = formData.get("competitionId") as string;

  if (!name || !competitionId) {
    throw new Error("Name and competition are required");
  }

  await prisma.player.create({
    data: {
      name,
      competitionId,
    },
  });

  revalidatePath("/admin/dashboard");
}

export async function removePlayer(formData: FormData) {
  const playerId = formData.get("playerId") as string;

  if (!playerId) {
    throw new Error("Player ID is required");
  }

  // Delete picks first, then player
  await prisma.pick.deleteMany({ where: { playerId } });
  await prisma.player.delete({ where: { id: playerId } });

  revalidatePath("/admin/dashboard");
}

export async function togglePayment(formData: FormData) {
  const playerId = formData.get("playerId") as string;
  const currentPaid = formData.get("currentPaid") === "true";

  if (!playerId) {
    throw new Error("Player ID is required");
  }

  await prisma.player.update({
    where: { id: playerId },
    data: { paid: !currentPaid },
  });

  revalidatePath("/admin/dashboard");
}
