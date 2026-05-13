import { inngest, JOB_DETAILS } from "src/services/inngest";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(req, res) {
    const supabase = createClientComponentClient();
    const { video_url, language, ai_video_id, voice_id, text, video_id } =
        req.body;

    const { data, error } = await supabase
        .from("jobs")
        .insert([
            {
                job_details: {
                    ai_video_id: ai_video_id,
                },
                status: JOB_DETAILS.pending,
            },
        ])
        .select("id")
        .single();
    // Trigger the workflow
    const event = await inngest.send({
        name: "ai/clone",
        data: {
            ai_video_id: ai_video_id,
            job_id: data.id,
            text: text,
            language: language,
            voice_id: voice_id,
            video_url: video_url,
            video_id: video_id,
        },
    });

    res.status(200).json({ success: true, event });
}
