import { NextResponse } from "next/server";
import { getMuapiKey } from "@higgsfield/api-config";

export async function POST(req) {
  try {
    const { prompt, image_url, aspect_ratio = "16:9" } = await req.json();

    if (!prompt && !image_url) {
      return NextResponse.json({ error: "Prompt or image_url is required" }, { status: 400 });
    }

    const apiKey = getMuapiKey();
    const baseUrl = "https://api.muapi.ai";

    // Example MU API video endpoint (adjust based on actual MU API docs)
    const submitUrl = `${baseUrl}/video/generate`;

    const submitRes = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt,
        image_url,
        aspect_ratio,
        model: "runway-gen3" // or whatever model MU API supports
      }),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      throw new Error(`MU API Video Error: ${submitRes.status} ${errorText}`);
    }

    const result = await submitRes.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[MUAPI_VIDEO_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
