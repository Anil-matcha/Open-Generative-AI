import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id;

    if (!requestId) {
      console.error("[MUAPI_WEBHOOK_ERROR] Missing request id in payload", data);
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const creation = await prisma.creation.findUnique({
      where: { requestId }
    });

    if (!creation) {
      console.warn(`[MUAPI_WEBHOOK] Creation with requestId ${requestId} not found.`);
      return NextResponse.json({ error: "Creation not found" }, { status: 404 });
    }

    if (data.error && data.error !== "") {
      await prisma.creation.update({
        where: { id: creation.id },
        data: {
          status: "failed",
          error: data.error
        }
      });
      // Credits refund logic could go here if implemented
    } else {
      const outputs = data.outputs || [];
      const imageUrl = JSON.stringify(outputs);

      await prisma.creation.update({
        where: { id: creation.id },
        data: {
          status: "completed",
          imageUrl: imageUrl,
          isPack: true,
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[MUAPI_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
