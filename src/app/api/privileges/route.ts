import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const now = new Date();
    const sevenDaysAfter = new Date(now);
    sevenDaysAfter.setDate(now.getDate() - 0);

    // Common where clause for date filtering
    const dateFilter = {
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
    };

    // Fetch Campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        AND: [
          branchId
            ? {
                branches: {
                  some: {
                    id: branchId,
                  },
                },
              }
            : {},
          dateFilter,
        ],
      },
      include: {
        branches: true,
        shops: true,
        participations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch Events
    const events = await prisma.event.findMany({
      where: {
        AND: [
          branchId
            ? {
                branches: {
                  some: {
                    id: branchId,
                  },
                },
              }
            : {},
          dateFilter,
        ],
      },
      include: {
        branches: true,
        shops: true,
        registrations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch Coupons
    const coupons = await prisma.coupon.findMany({
      where: {
        AND: [
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
        users: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch Rewards
    const rewards = await prisma.reward.findMany({
      where: {
        AND: [
          branchId
            ? {
                branches: {
                  some: {
                    id: branchId,
                  },
                },
              }
            : {},
          dateFilter,
        ],
      },
      include: {
        branches: true,
        shops: true,
        participations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Format data
    const formattedCampaigns = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      imageUrl: c.imageUrl,
      participantCount: c.participations.length,
      type: "CAMPAIGN" as const,
    }));

    const formattedEvents = events.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      imageUrl: e.imageUrl,
      participantCount: e.registrations.length,
      type: "EVENT" as const,
      startDate: e.startDate,
      endDate: e.endDate,
    }));

    const formattedCoupons = coupons.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      imageUrl: c.imageUrl,
      participantCount: c.users.length,
      type: "COUPON" as const,
      startDate: c.startDate,
      endDate: c.endDate,
      pointCost: c.pointCost,
      createdAt: c.createdAt,
    }));

    const formattedRewards = rewards.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl,
      participantCount: r.participations.length,
      type: "REWARD" as const,
      startDate: r.startDate,
      endDate: r.endDate,
      pointCost: r.pointCost,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      campaigns: formattedCampaigns,
      events: formattedEvents,
      coupons: formattedCoupons,
      rewards: formattedRewards,
    });
  } catch (error) {
    console.error("Error fetching privileges:", error);
    return NextResponse.json({ error: "Failed to fetch privileges" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}