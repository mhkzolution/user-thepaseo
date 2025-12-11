import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// list all tags + usage count
export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      relations: true,
    },
  });

  const formatted = tags.map((t) => ({
    id: t.id,
    name: t.name,
    usage: t.relations.length,
  }));

  return NextResponse.json(formatted);
}

// create new tag
export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const tag = await prisma.tag.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(tag);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
