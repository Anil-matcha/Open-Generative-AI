import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import axios from "axios";
import { Inngest } from "inngest";
import { v2 as cloudinary } from "cloudinary";
import { makeTextToVoice } from "./api/aiVoice";

export const JOB_DETAILS = {
    pending: "pending",
    processing: "processing",
    completed: "completed",
    failed: "failed",
};

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const supabase = createClientComponentClient();

export const createAIClone = inngest.createFunction(
    { id: "ai-clone" },
    { event: "ai/clone" },
    async ({ event, step }) => {
        const voice = await makeTextToVoice(
            event.data.text,
            null,
            event.data.voice_id,
            event.data.language,
        );

        const result = (await new Promise((resolve, reject) => {
            const dataUri = `data:audio/mp3;base64,${voice.data.audio_data}`;

            cloudinary.uploader.upload_large(
                dataUri,
                { resource_type: "video", chunk_size: 6000000 },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                },
            );
        })) as any;
        const sync_options = {
            method: "POST",
            url: "https://api.sync.so/v2/generate",
            headers: {
                "x-api-key": process.env.SYNC_API_KEY,
                "Content-Type": "application/json",
            },
            data: {
                model: "lipsync-1.8.0",
                input: [
                    {
                        type: "video",
                        url: event.data.video_url,
                    },
                    {
                        type: "audio",
                        url: `https://res.cloudinary.com/dhd6m0fh3/video/upload/${result.public_id}.mp3`,
                    },
                ],
                options: { output_format: "mp4" },
                webhookUrl: "https://app.videco.io/api/webhooks/sync",
            },
        };
        const cloneFace = await axios(sync_options);
        const ai_video_update = await supabase
            .from("videos")
            .update({
                ai_preview: cloneFace.data.id, //This need to identify the video id for the webhook
                language: event.data.language,
                media_status: "in_progress",
            })
            .eq("id", event.data.video_id);

        const { data, error } = await supabase
            .from("jobs")
            .update([
                {
                    job_details: event,
                    status: JOB_DETAILS.completed, //Might not be completed because of the Webhook stuff
                },
            ])
            .eq("id", event.data.job_id)
            .single();
        if (error) throw error;
        if (ai_video_update.error) throw error;

        return { event: ai_video_update, body: result };
    },
);
