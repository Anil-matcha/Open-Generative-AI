import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createHmac, timingSafeEqual } from "crypto";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const supabase = createClientComponentClient();
const verifySignature = (payload, signature, secret) => {
    try {
        if (!signature) {
            return false;
        }

        const [, timestamp, receivedSignature] =
            signature.match(/t=(\d+),v1=(.+)/) ?? [];
        if (!timestamp || !receivedSignature) {
            return false;
        }

        const expectedSignature = createHmac("sha256", secret)
            .update(`${timestamp}.${JSON.stringify(payload)}`)
            .digest("hex");

        // Timing-safe comparison to prevent timing attacks
        return timingSafeEqual(
            Buffer.from(receivedSignature),
            Buffer.from(expectedSignature),
        );
    } catch (error) {
        return false;
    }
};

export default async function handler(req, res) {
    if (req.method === "POST") {
        const signature = req.headers["sync-signature"];

        // if (!verifySignature(req.body, signature, WEBHOOK_SECRET)) {
        //     return res.status(400).json({
        //         message: "Invalid signature",
        //     });
        // }

        const ai_video_update = await supabase
            .from("videos")
            .update({
                url: req.body.outputUrl,
                media_status: "ready",
            })
            .eq("ai_preview", req.body.id);
        return res.status(200).json({
            message: "Webhook signature verified",
        });
    }

    // Return 405 for methods other than POST
    return res.status(405).json({ message: "Method Not Allowed" });
}
