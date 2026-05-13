import { inngest, JOB_DETAILS, createAIIntro } from "src/services/inngest";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { serve } from "inngest/next";

export default async function handler(req, res) {
    const supabase = createClientComponentClient();
    const {
        greeting,
        language,
        video_id,
        audio,
        text,
        email,
        userId,
        userName,
    } = req.body;

    const { data, error } = await supabase
        .from("jobs")
        .insert([
            {
                job_details: {
                    video_id: video_id,
                },
                status: JOB_DETAILS.pending,
            },
        ])
        .select("id")
        .single();
    // Trigger the workflow
    const event = await inngest.send({
        name: "ai/intro",
        data: {
            video_id: video_id,
            job_id: data.id,
            audio: audio,
            text: text,
            language: language,
            userId: userId,
            userName: userName,
            email: email,
            greeting: greeting,
        },
    });

    res.status(200).json({ success: true, job_id: data.id });
}
