const { NextResponse } = require("next/server");
const { AIService } = require("@/lib/services/ai");

module.exports = async function POST(req) {
  try {
    const body = await req.json();
    const { image_url, category, aspect_ratio, userId } = body;

    if (!image_url) {
      return NextResponse.json({ error: "Reference image is required" }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const result = await AIService.generate({
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
};
