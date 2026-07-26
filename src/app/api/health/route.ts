import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Unauthenticated health check for Railway deployment
export async function GET() {
  const prisma = new PrismaClient();

  try {
    // Simple connectivity check
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return NextResponse.json({ status: "healthy" }, { status: 200 });
  } catch (err) {
    console.error("Health check failed:", err);
    await prisma.$disconnect();
    return NextResponse.json(
      { status: "unhealthy", error: "Database connection failed" },
      { status: 503 }
    );
  }
}
