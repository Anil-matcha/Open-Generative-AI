import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
  try {
    const data = await req.json();
    const requestId = data.id || data.request_id;

    if (!requestId) {
      console.error("[MUAPI_WEBHOOK_ERROR] Missing request id", data);
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    if (data.error) {
      await supabase
        .from('creations')
        .update({ status: 'failed', error: data.error })
        .eq('request_id', requestId);
    } else {
      const outputs = data.outputs || data.images || [];
      const imageUrl = JSON.stringify(outputs);

      await supabase
        .from('creations')
        .update({
          status: 'completed',
          image_url: imageUrl,
          is_pack: true,
          updated_at: new Date().toISOString()
        })
        .eq('request_id', requestId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MUAPI_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
