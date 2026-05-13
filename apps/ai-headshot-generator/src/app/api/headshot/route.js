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

    const body = await req.json();
    const { image_url, category, aspect_ratio } = body;

    if (!image_url) {
      return NextResponse.json({ error: "Reference image is required" }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const result = await AIService.generate(session.user.id, {
      image_url,
      category,
      aspect_ratio,
    });

    return NextResponse.json({
      ...result,
      metadata: { category, aspect_ratio }
    });
  } catch (error) {
    if (error.message === "Insufficient credits") {
      return new NextResponse("Insufficient credits", { status: 403 });
    }
    console.error("[AI_HEADSHOT]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
