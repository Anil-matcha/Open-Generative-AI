import { inngest, JOB_DETAILS } from "src/services/inngest";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(req, res) {
    const supabase = createClientComponentClient();
    const {
        greeting,
        language,
        user_id,
        voice_id,
        text,
        background,
        website,
        voiceCloningEnabled = true,
        og_video_public_id,
    } = req.body;

    const { data, error } = await supabase
        .from("jobs")
        .insert([
            {
                job_details: {
                    ai_video_id: user_id,
                },
                status: JOB_DETAILS.pending,
            },
        ])
        .select("id")
        .single();
    // Trigger the workflow
    const event = await inngest.send({
        name: "ai/onboarding",
        data: {
            user_id: user_id,
            job_id: data.id,
            text: text,
            language: language,
            voice_id: voice_id,
            greeting: greeting,
            background: background,
            og_video_public_id: og_video_public_id,
            website: website,
            voiceCloningEnabled: voiceCloningEnabled,
        },
    });

    res.status(200).json({ success: true, event });
}
