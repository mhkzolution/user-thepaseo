// app/api/admin/move-inactive-users/route.ts
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const inactiveUsers = await prisma.user.findMany({
    where: {
        lastLogin: { lt: oneYearAgo },
    },
    })

    for (const user of inactiveUsers) {
    await prisma.user_Lost.create({
        data: {
        id: user.id,
        phone: user.phone || '',
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        },
    })

    await prisma.user.delete({ where: { id: user.id } })
    }

  return NextResponse.json({ moved: inactiveUsers.length })
}
