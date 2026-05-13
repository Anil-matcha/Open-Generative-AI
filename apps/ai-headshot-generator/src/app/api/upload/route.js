import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import config from "@/lib/config";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    const apiKey = config.ai.headshot.apiKey;
    if (!apiKey) {
      return new NextResponse("API Key not configured", { status: 500 });
    }

    // Prepare for MuAPI
    const muapiFormData = new FormData();
    muapiFormData.append("file", file);

    const response = await fetch("https://api.muapi.ai/api/v1/upload_file", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
      },
      body: muapiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MuAPI Upload Failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
