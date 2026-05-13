import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId, metadata } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const result = await AIService.checkStatus(requestId, session.user.id, metadata);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[AI_HEADSHOT_STATUS]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
