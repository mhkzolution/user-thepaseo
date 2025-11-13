import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch the BusinessInformation (assuming single record)
export async function GET() {
  try {
    const term = await prisma.businessInformation.findFirst();
    if (!term) {
      // If no term exists, return an empty object or create one
      return NextResponse.json({ id: "", description: "" }, { status: 200 });
    }
    return NextResponse.json(term, { status: 200 });
  } catch (error) {
    console.error("Error fetching Business Information:", error);
    return NextResponse.json({ error: "Failed to fetch Business Information" }, { status: 500 });
  }
}

// PUT: Update the BusinessInformation
export async function PUT(request: Request) {
  try {
    const { id, description } = await request.json();

    let term;
    if (id) {
      // Update existing term
      term = await prisma.businessInformation.update({
        where: { id },
        data: { description },
      });
    } else {
      // Create new term if no ID provided (first-time setup)
      term = await prisma.businessInformation.create({
        data: { description },
      });
    }

    return NextResponse.json(term, { status: 200 });
  } catch (error) {
    console.error("Error updating upload term:", error);
    return NextResponse.json({ error: "Failed to Business Information" }, { status: 500 });
  }
}