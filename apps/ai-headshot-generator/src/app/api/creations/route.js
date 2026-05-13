const { prisma } = require("@/lib/prisma");
const { NextResponse } = require("next/server");

module.exports = async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 401 });
  }

  try {
    const creations = await prisma.creation.findMany({
      where: { 
        userId: userId
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(creations);
  } catch (error) {
    console.error("Fetch creations error:", error);
    return NextResponse.json({ error: "Failed to fetch creations" }, { status: 500 });
  }
};
