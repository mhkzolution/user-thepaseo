// /api/campaign/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId"); // Get branchId from query params

    const now = new Date();
    const sevenDaysAfter = new Date(now);
    sevenDaysAfter.setDate(now.getDate() - 0);

    const campaigns = await prisma.campaign.findMany({
      where: {
        AND: [
          // Filter by branchId if provided
          branchId
            ? {
                branches: {
                  some: {
                    id: branchId,
                  },
                },
              }
            : {},
          {
            OR: [
              {
                startDate: {
                  gte: now,
                },
              },
              {
                AND: [
                  {
                    startDate: {
                      lte: now,
                    },
                  },
                  {
                    endDate: {
                      gte: now,
                    },
                  },
                ],
              },
              {
                AND: [
                  {
                    endDate: {
                      lt: now,
                    },
                  },
                  {
                    endDate: {
                      gte: sevenDaysAfter,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      include: {
        branches: true,
        shops: true,
        participations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = campaigns.map((r) => ({
      ...r,
      participantCount: r.participations.length,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}