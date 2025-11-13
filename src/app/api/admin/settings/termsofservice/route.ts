import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch the Termsofservice (assuming single record)
export async function GET() {
  try {
    const term = await prisma.termsofservice.findFirst();
    if (!term) {
      // If no term exists, return an empty object or create one
      return NextResponse.json({ id: "", description: "" }, { status: 200 });
    }
    return NextResponse.json(term, { status: 200 });
  } catch (error) {
    console.error("Error fetching Terms of service:", error);
    return NextResponse.json({ error: "Failed to fetch terms" }, { status: 500 });
  }
}

// PUT: Update the Termsofservice
export async function PUT(request: Request) {
  try {
    const { id, description } = await request.json();

    let term;
    if (id) {
      // Update existing term
      term = await prisma.termsofservice.update({
        where: { id },
        data: { description },
      });
    } else {
      // Create new term if no ID provided (first-time setup)
      term = await prisma.termsofservice.create({
        data: { description },
      });
    }

    return NextResponse.json(term, { status: 200 });
  } catch (error) {
    console.error("Error updating Terms of service:", error);
    return NextResponse.json({ error: "Failed to Terms of service" }, { status: 500 });
  }
}