import { NextResponse } from "next/server";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const { requestId, metadata } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const result = await AIService.checkStatus(requestId);

    // When status is completed, save to main asset system (Director / AI Agent / Library)
    if (result.status === "completed" && result.imageUrl) {
      await AIService.saveToAssetSystem(result.imageUrl, metadata);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[AI_HEADSHOT_STATUS]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
