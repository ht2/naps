import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface OddsEntry {
  horseName: string;
  odds: string;
}

interface OddsPayload {
  raceDate: string;
  raceTime: string;
  horses: OddsEntry[];
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.ODDS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: OddsPayload = await request.json();

    if (!body.raceDate || !body.raceTime || !Array.isArray(body.horses)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const now = new Date();

    await prisma.$transaction(
      body.horses.map((h) =>
        prisma.horseOdds.upsert({
          where: {
            raceDate_raceTime_horseName: {
              raceDate: body.raceDate,
              raceTime: body.raceTime,
              horseName: h.horseName,
            },
          },
          update: { odds: h.odds, fetchedAt: now },
          create: {
            raceDate: body.raceDate,
            raceTime: body.raceTime,
            horseName: h.horseName,
            odds: h.odds,
            fetchedAt: now,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      race: `${body.raceDate} ${body.raceTime}`,
      horses: body.horses.length,
    });
  } catch (error) {
    console.error("Odds API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
